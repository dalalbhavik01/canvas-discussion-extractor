import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const integer = value => Number.isInteger(value) && value >= 0;
const timestamp = value => typeof value === 'string'
  && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
const signature = value => JSON.stringify(value, (_key, item) => {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    return Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]]));
  }
  return item;
});

function unique(values, label) {
  requireThat(Array.isArray(values), `${label}: expected an array`);
  requireThat(values.every(nonempty), `${label}: empty or non-string identifier`);
  requireThat(new Set(values).size === values.length, `${label}: duplicate identifier`);
}

function validateText(value, label) {
  requireThat(typeof value === 'string', `${label}: expected text`);
  requireThat(value.length <= 32767, `${label}: exceeds Excel's cell limit`);
  requireThat(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(value),
    `${label}: XML-incompatible character`);
  // Reject unpaired UTF-16 surrogates rather than replacing source characters.
  requireThat(!/[\uD800-\uDFFF]/u.test(value), `${label}: unpaired Unicode surrogate`);
}

function attachmentText(entry) {
  return entry.text + entry.attachments.map(file =>
    `\n\n[Attachment reference]\n${file.name}\n${file.url}`).join('');
}

export function selectCapture(input, selectedKeys) {
  requireThat(input?.version === 1 && Array.isArray(input.sections) && input.sections.length > 0,
    'Expected version 1 and at least one section');
  unique(input.sections.map(s => s.key), 'section keys');
  unique(input.sections.map(s => s.key.toLowerCase()), 'case-insensitive section keys');
  const available = new Map(input.sections.map(section => [section.key, section]));
  const requested = selectedKeys === undefined ? [...available.keys()] : selectedKeys;
  unique(requested, 'requested section keys');
  requireThat(requested.length > 0, 'At least one section must be requested');
  for (const key of requested) requireThat(available.has(key), `Requested section not found: ${key}`);
  return {
    capture: { version: 1, sections: requested.map(key => available.get(key)) },
    scope: {
      requested_sections: [...requested],
      skipped_sections: [...available.keys()].filter(key => !requested.includes(key)),
      skipped_reason: 'not requested',
    },
  };
}

export function prepareCapture(input, { selectedKeys } = {}) {
  const { capture, scope } = selectCapture(input, selectedKeys);
  const sections = capture.sections.map(prepareSection);
  return { version: 1, capture_sha256: createHash('sha256').update(signature(capture)).digest('hex'), scope, sections };
}

export function parseSectionArgs(args) {
  if (args.length === 0) return undefined;
  const keys = [];
  for (let i = 0; i < args.length; i += 2) {
    requireThat(args[i] === '--section' && nonempty(args[i + 1]) && !args[i + 1].startsWith('--'),
      'Expected --section EXACT_CAPTURE_KEY (repeat for multiple sections)');
    keys.push(args[i + 1]);
  }
  return keys;
}

function prepareSection(section) {
  const { key, label, source, coverage, students, entries, threads, source_checks, observations } = section;
  const check = (value, message) => requireThat(value, `${key}: ${message}`);
  check(/^[a-zA-Z0-9_-]{1,64}$/.test(key), 'invalid section key');
  check(nonempty(label), 'missing section label');
  check(source && ['url', 'course_id', 'discussion_id', 'title', 'evidence', 'section_evidence']
    .every(field => nonempty(source[field])), 'missing source identity/evidence');
  let url;
  try { url = new URL(source.url); } catch { throw new Error(`${key}: invalid source URL`); }
  check(url.protocol === 'https:' && url.pathname === `/courses/${source.course_id}/discussion_topics/${source.discussion_id}`,
    'source URL does not match course/discussion IDs');
  check(timestamp(source.captured_at), 'invalid capture timestamp');
  check(['dom', 'frontend-cache'].includes(source.method), 'unknown extraction method');
  check(coverage && ['all_pages_visited', 'all_threads_expanded', 'unfiltered', 'stable']
    .every(field => coverage[field] === true), 'source coverage is incomplete or unstable');
  unique(coverage.pages, `${key}: pages`);
  check(coverage.pages.length > 0 && nonempty(coverage.root_evidence), 'missing page/root evidence');
  unique(coverage.expected_root_ids, `${key}: expected roots`);
  check(typeof coverage.roster_complete === 'boolean', 'roster completeness must be explicit');
  check(['captured', 'gradebook'].includes(coverage.order), 'unknown student order');
  if (coverage.order === 'gradebook') check(coverage.roster_complete && nonempty(coverage.order_evidence),
    'gradebook order requires complete roster and order evidence');
  check(Array.isArray(students) && Array.isArray(entries) && Array.isArray(threads)
    && Array.isArray(source_checks) && Array.isArray(observations), 'missing capture arrays');
  check(observations.every(nonempty), 'observations must be nonempty strings');
  unique(students.map(s => s.id), `${key}: author IDs`);
  const authors = new Map(students.map(student => {
    check(nonempty(student.name) && nonempty(student.evidence)
      && ['student', 'instructor', 'test', 'other'].includes(student.role), 'unverified author identity or role');
    return [student.id, student];
  }));
  const byId = new Map();
  let duplicateObservations = 0;
  for (const entry of entries) {
    check(nonempty(entry.id) && nonempty(entry.root_id) && nonempty(entry.evidence), 'missing entry identity/evidence');
    check(entry.parent_id === null || nonempty(entry.parent_id), `invalid parent for ${entry.id}`);
    check(typeof entry.deleted === 'boolean', `unknown deleted state for ${entry.id}`);
    check(authors.has(entry.author_id) || (entry.deleted && entry.author_id === null), `unresolved author for ${entry.id}`);
    check(timestamp(entry.created_at), `invalid timestamp for ${entry.id}`);
    if (entry.edited_at != null) check(timestamp(entry.edited_at), `invalid edit time for ${entry.id}`);
    check(typeof entry.text === 'string' && typeof entry.source_text === 'string'
      && typeof entry.quoted_text === 'string', `missing original text for ${entry.id}`);
    check(['none', 'separated'].includes(entry.quote_status), `unresolved quote in ${entry.id}`);
    if (entry.quote_status === 'none') check(entry.text === entry.source_text && entry.quoted_text === '',
      `unexplained text transformation in ${entry.id}`);
    else check(nonempty(entry.quote_evidence) && nonempty(entry.quoted_text), `missing quote evidence for ${entry.id}`);
    check(Array.isArray(entry.attachments), `missing attachment state for ${entry.id}`);
    for (const file of entry.attachments) {
      check(file.status === 'reference-verified' && nonempty(file.name) && nonempty(file.url),
        `unresolved attachment for ${entry.id}`);
      let target;
      try { target = new URL(file.url); } catch { throw new Error(`${key}: invalid attachment URL`); }
      check(['https:', 'http:'].includes(target.protocol), `unsupported attachment URL for ${entry.id}`);
    }
    if (!entry.deleted) check(nonempty(entry.text) || entry.attachments.length > 0 || entry.quote_status === 'separated',
      `blank unexplained entry ${entry.id}`);
    if (byId.has(entry.id)) {
      check(signature(byId.get(entry.id)) === signature(entry), `conflicting observations of ${entry.id}`);
      duplicateObservations++;
    } else byId.set(entry.id, entry);
  }
  const records = [...byId.values()];
  const roots = records.filter(e => e.parent_id === null);
  check(signature(roots.map(e => e.id).sort()) === signature([...coverage.expected_root_ids].sort()),
    'captured root IDs do not match independent root coverage');
  const depth = new Map();
  for (const entry of records) {
    let current = entry;
    const seen = new Set();
    while (current.parent_id !== null) {
      check(!seen.has(current.id), `parent cycle involving ${entry.id}`);
      seen.add(current.id);
      check(byId.has(current.parent_id), `missing parent ${current.parent_id}`);
      current = byId.get(current.parent_id);
    }
    check(current.id === entry.root_id, `root relationship mismatch in ${entry.id}`);
    depth.set(entry.id, seen.size);
  }
  unique(threads.map(t => t.root_id), `${key}: thread controls`);
  check(signature(threads.map(t => t.root_id).sort()) === signature(roots.map(r => r.id).sort()),
    'missing or extra thread control');
  const reconciliation = threads.map(thread => {
    check(integer(thread.expected_replies) && nonempty(thread.evidence), 'invalid thread count/evidence');
    check(['all-descendants-active', 'all-descendants-including-deleted', 'direct-active', 'direct-including-deleted']
      .includes(thread.semantics), 'unverified counter semantics');
    const descendants = records.filter(e => e.root_id === thread.root_id && e.id !== thread.root_id);
    if (thread.semantics.startsWith('direct')) check(!descendants.some(e => depth.get(e.id) > 1),
      'direct-only count cannot establish nested reply completeness');
    const captured = descendants.filter(e => thread.semantics.endsWith('including-deleted') || !e.deleted).length;
    check(captured === thread.expected_replies, `reply count mismatch for ${thread.root_id}: expected ${thread.expected_replies}, captured ${captured}`);
    return { ...thread, captured };
  });
  check(records.length === 0 || source_checks.length > 0, 'no source spot-check evidence');
  for (const item of source_checks) check(byId.has(item.entry_id) && item.result === 'match' && nonempty(item.evidence),
    'failed or unverified source spot-check');

  const ordered = records.slice().sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
    || a.id.localeCompare(b.id, 'en'));
  const classified = new Map(ordered.map(entry => {
    if (entry.deleted) return [entry.id, 'deleted'];
    if (authors.get(entry.author_id).role !== 'student') return [entry.id, 'non-student'];
    if (entry.parent_id === null) return [entry.id, 'post'];
    const parent = byId.get(entry.parent_id);
    check(parent.author_id !== null, `unknown reply target for ${entry.id}`);
    if (parent.author_id === entry.author_id) return [entry.id, 'self-follow-up'];
    if (authors.get(parent.author_id).role !== 'student') return [entry.id, 'reply-to-non-student'];
    return [entry.id, 'peer-reply'];
  }));
  const activeAuthors = new Set(ordered.filter(e => !e.deleted).map(e => e.author_id));
  const rowAuthors = students.filter(s => s.role === 'student' && (coverage.roster_complete || activeAuthors.has(s.id)));
  const studentRows = rowAuthors.map(student => ({
    student,
    posts: ordered.filter(e => e.author_id === student.id && classified.get(e.id) === 'post'),
    replies: ordered.filter(e => e.author_id === student.id && classified.get(e.id) === 'peer-reply'),
  }));
  const maxReplies = Math.max(2, ...studentRows.map(row => row.replies.length));
  check(maxReplies + 2 <= 16384 && studentRows.length + 1 <= 1048576, 'Excel dimensions exceeded');
  const headers = ['Student Name', 'Discussion Post', ...Array.from({ length: maxReplies }, (_, i) => `Reply ${i + 1}`)];
  const cells = new Map();
  const rows = studentRows.map(({ student, posts, replies }, index) => {
    const rowNumber = index + 2;
    for (const post of posts) cells.set(post.id, `B${rowNumber}`);
    replies.forEach((entry, i) => cells.set(entry.id, `${columnName(i + 3)}${rowNumber}`));
    return [student.name, posts.map((post, i) =>
      (i ? `\n\n[Additional top-level post: ${post.id}]\n\n` : '') + attachmentText(post)).join(''),
    ...Array.from({ length: maxReplies }, (_, i) => replies[i] ? attachmentText(replies[i]) : '')];
  });
  const audit = [
    ['Section', 'Student ID', 'Student Name', 'Entry ID', 'Kind', 'Parent ID', 'Root ID', 'Depth', 'Created At', 'Output Cell', 'Quote Status', 'Evidence', 'Captured Text', 'Separated Quote'],
    ...ordered.map(entry => [label, entry.author_id ?? '', authors.get(entry.author_id)?.name ?? '', entry.id,
      classified.get(entry.id), entry.parent_id ?? '', entry.root_id, depth.get(entry.id), entry.created_at,
      cells.get(entry.id) ?? '', entry.quote_status, entry.evidence, attachmentText(entry), entry.quoted_text]),
    ...studentRows.filter(row => row.posts.length === 0 && row.replies.length === 0).map(row =>
      [label, row.student.id, row.student.name, '', 'no-post-or-peer-reply-captured', '', '', '', '', '', '', row.student.evidence, '', '']),
  ];
  const sheets = [{ name: 'Posts and Replies', values: [headers, ...rows] }, { name: 'Audit', values: audit }];
  for (const sheet of sheets) for (const [r, row] of sheet.values.entries()) for (const [c, value] of row.entries()) {
    if (typeof value === 'string') validateText(value, `${key}/${sheet.name}/${columnName(c + 1)}${r + 1}`);
  }
  const counts = Object.fromEntries(['post', 'peer-reply', 'self-follow-up', 'reply-to-non-student', 'non-student', 'deleted']
    .map(kind => [kind, [...classified.values()].filter(value => value === kind).length]));
  return {
    key, label, source, coverage, sheets, reconciliation, source_checks, observations,
    summary: { students: rows.length, unique_entries: records.length, duplicate_observations: duplicateObservations,
      reply_columns: maxReplies, ...counts },
    row_identity: studentRows.map((row, index) => ({ row: index + 2, id: row.student.id, name: row.student.name })),
  };
}

export function columnName(number) {
  let name = '';
  while (number > 0) { number--; name = String.fromCharCode(65 + number % 26) + name; number = Math.floor(number / 26); }
  return name;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [inputPath, outputPath, ...options] = process.argv.slice(2);
    requireThat(inputPath && outputPath, 'Usage: node prepare.mjs capture.json prepared.json [--section KEY]');
    const result = prepareCapture(JSON.parse(await fs.readFile(inputPath, 'utf8')), { selectedKeys: parseSectionArgs(options) });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), { flag: 'wx' });
    console.log(JSON.stringify(result.sections.map(s => ({ section: s.key, ...s.summary }))));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
