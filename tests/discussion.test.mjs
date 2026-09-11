import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareCapture } from '../skills/discussion/scripts/prepare.mjs';

export function fixture() {
  const authors = [
    { id: 'a', name: 'Example Student A', role: 'student', evidence: 'synthetic roster A' },
    { id: 'b', name: 'Example Student B', role: 'student', evidence: 'synthetic roster B' },
    { id: 'c', name: 'Example Student C', role: 'student', evidence: 'synthetic roster C' },
    { id: 'teacher', name: 'Example Instructor', role: 'instructor', evidence: 'synthetic instructor role' },
  ];
  const entry = (id, author_id, parent_id, root_id, text, minute) => ({
    id, author_id, parent_id, root_id, text, source_text: text,
    created_at: `2026-01-01T12:${String(minute).padStart(2, '0')}:00Z`,
    deleted: false, quote_status: 'none', quoted_text: '', quote_evidence: '', attachments: [], evidence: `synthetic/${id}`,
  });
  return { version: 1, sections: [{
    key: 'cohort-A', label: 'Synthetic Cohort A',
    source: { url: 'https://canvas.example.edu/courses/1/discussion_topics/2', course_id: '1', discussion_id: '2',
      title: 'Synthetic discussion', captured_at: '2026-01-01T13:00:00Z', method: 'dom',
      evidence: 'synthetic source', section_evidence: 'synthetic section label' },
    coverage: { all_pages_visited: true, all_threads_expanded: true, unfiltered: true, stable: true,
      pages: ['page-1', 'page-2'], expected_root_ids: ['p1', 'p2'], root_evidence: 'synthetic root inventory',
      roster_complete: true, order: 'gradebook', order_evidence: 'synthetic ordered roster' },
    students: authors,
    entries: [
      entry('p1', 'a', null, 'p1', 'First learning.\n\nSecond paragraph.', 0),
      entry('p2', 'b', null, 'p2', 'Different perspective.', 1),
      entry('r1', 'a', 'p2', 'p2', 'A constructive first peer reply.', 2),
      entry('r2', 'b', 'r1', 'p2', 'A nested response to Student A.', 3),
      entry('r3', 'a', 'r2', 'p2', 'A deeper reply at depth three.', 4),
      entry('r4', 'a', 'p2', 'p2', 'Third peer reply, retained.', 5),
      entry('r5', 'a', 'r4', 'p2', 'A self-follow-up, retained in capture.', 6),
      entry('r6', 'teacher', 'p2', 'p2', 'An instructor response.', 7),
    ],
    threads: [
      { root_id: 'p1', expected_replies: 0, semantics: 'all-descendants-active', evidence: 'synthetic zero' },
      { root_id: 'p2', expected_replies: 6, semantics: 'all-descendants-active', evidence: 'synthetic six' },
    ],
    source_checks: [{ entry_id: 'r3', result: 'match', evidence: 'synthetic source spot-check' }], observations: [],
  }] };
}

const section = data => data.sections[0];
const reject = (mutate, expression) => {
  const data = fixture(); mutate(section(data));
  assert.throws(() => prepareCapture(data), expression);
};

test('all peer replies, nested attribution, roster order, and paragraph preservation', () => {
  const prepared = prepareCapture(fixture()).sections[0];
  const rows = prepared.sheets[0].values;
  assert.deepEqual(rows[0], ['Student Name', 'Discussion Post', 'Reply 1', 'Reply 2', 'Reply 3']);
  assert.equal(rows[1][1], 'First learning.\n\nSecond paragraph.');
  assert.equal(rows[1][4], 'Third peer reply, retained.');
  assert.equal(rows[2][2], 'A nested response to Student A.');
  assert.deepEqual(rows[3], ['Example Student C', '', '', '', '']);
  assert.equal(prepared.summary['peer-reply'], 4);
  assert.equal(prepared.summary['self-follow-up'], 1);
  assert.equal(prepared.summary['non-student'], 1);
});
test('sections stay independent even with the same author IDs', () => {
  const data = fixture();
  const other = structuredClone(data.sections[0]);
  other.key = 'cohort-B'; other.label = 'Synthetic Cohort B';
  other.students[0].name = 'Second cohort name';
  data.sections.push(other);
  const output = prepareCapture(data);
  assert.equal(output.sections.length, 2);
  assert.equal(output.sections[1].sheets[0].values[1][0], 'Second cohort name');
  assert.equal(output.sections[0].sheets[0].values[1][0], 'Example Student A');
});
test('same-name authors do not merge', () => {
  const data = fixture(); section(data).students[1].name = section(data).students[0].name;
  const output = prepareCapture(data).sections[0];
  assert.equal(output.summary.students, 3);
  assert.notEqual(output.row_identity[0].id, output.row_identity[1].id);
});
test('repeat observations deduplicate by ID', () => {
  const data = fixture(); section(data).entries.push(structuredClone(section(data).entries[0]));
  const output = prepareCapture(data).sections[0];
  assert.equal(output.summary.unique_entries, 8);
  assert.equal(output.summary.duplicate_observations, 1);
});
test('multiple initial posts are retained under their writer', () => {
  const data = fixture(); const s = section(data); s.entries[1].author_id = 'a';
  const output = prepareCapture(data).sections[0];
  assert.match(output.sheets[0].values[1][1], /Additional top-level post: p2/);
  assert.match(output.sheets[0].values[1][1], /Different perspective/);
});
test('deleted parents retain descendants and use explicit counter semantics', () => {
  const data = fixture(); const s = section(data); s.entries[3].deleted = true;
  s.threads[1].expected_replies = 5;
  const output = prepareCapture(data).sections[0];
  assert.equal(output.summary.deleted, 1);
  assert.equal(output.summary['peer-reply'], 3);
  assert.match(output.sheets[0].values[1][3], /deeper reply/);
});
test('quoted source is separate and original text survives', () => {
  const data = fixture(); const e = section(data).entries[2];
  e.source_text = 'A quoted peer passage.\n' + e.text;
  e.quote_status = 'separated'; e.quoted_text = 'A quoted peer passage.';
  e.quote_evidence = 'synthetic quoted-entry boundary';
  const result = prepareCapture(data).sections[0];
  assert.equal(result.sheets[0].values[1][2], e.text);
});
test('attachment-only entry is retained as a reference, not an empty submission', () => {
  const data = fixture(); const e = section(data).entries[0]; e.text = ''; e.source_text = '';
  e.attachments = [{ name: 'Reflection.pdf', url: 'https://example.edu/Reflection.pdf', status: 'reference-verified' }];
  assert.match(prepareCapture(data).sections[0].sheets[0].values[1][1], /Attachment reference/);
});
test('does not invent roster-only students when roster is incomplete', () => {
  const data = fixture(); const c = section(data).coverage; c.roster_complete = false; c.order = 'captured';
  assert.equal(prepareCapture(data).sections[0].summary.students, 2);
});
test('more than five pages are supported', () => {
  const data = fixture(); section(data).coverage.pages = Array.from({ length: 12 }, (_, i) => `page-${i + 1}`);
  assert.equal(prepareCapture(data).sections[0].coverage.pages.length, 12);
});
test('Unicode and formula-looking content preserved by preparation', () => {
  const data = fixture(); const e = section(data).entries[0]; e.text = '=SUM(1,2)\n\u00c9lodie \u2014 \ud83d\ude00\n_x0041_'; e.source_text = e.text;
  assert.equal(prepareCapture(data).sections[0].sheets[0].values[1][1], e.text);
});
test('empty discussion is allowed only with explicit zero-root coverage', () => {
  const data = fixture(); const s = section(data); s.entries = []; s.threads = []; s.source_checks = [];
  s.coverage.expected_root_ids = [];
  assert.equal(prepareCapture(data).sections[0].summary.unique_entries, 0);
});
test('missing thread fails even when remaining thread replies reconcile', () => reject(s => {
  s.entries = s.entries.filter(e => e.root_id !== 'p1'); s.threads.shift();
}, /root IDs/));
test('missing reply fails reconciliation', () => reject(s => s.entries.splice(7, 1), /reply count mismatch/));
test('conflicting versions block export', () => reject(s => {
  s.entries.push({ ...s.entries[0], text: 'Changed', source_text: 'Changed' });
}, /conflicting observations/));
test('orphan replies block export', () => reject(s => { s.entries[2].parent_id = 'missing'; }, /missing parent/));
test('cycles block export', () => reject(s => { s.entries[2].parent_id = 'r3'; }, /cycle/));
test('incorrect root relation blocks export', () => reject(s => { s.entries[2].root_id = 'p1'; }, /root relationship/));
test('unknown authors block export', () => reject(s => { s.entries[0].author_id = 'unknown'; }, /unresolved author/));
test('incorrect topic URL blocks export', () => reject(s => { s.source.discussion_id = '99'; }, /source URL/));
test('collapsed threads block export', () => reject(s => { s.coverage.all_threads_expanded = false; }, /incomplete/));
test('filtered view blocks export', () => reject(s => { s.coverage.unfiltered = false; }, /incomplete/));
test('direct-only counts cannot certify nested descendants', () => reject(s => {
  s.threads[1].semantics = 'direct-active';
}, /direct-only/));
test('unknown counter semantics block export', () => reject(s => { s.threads[1].semantics = 'unknown'; }, /counter semantics/));
test('unresolved quote blocks export', () => reject(s => { s.entries[0].quote_status = 'unresolved'; }, /unresolved quote/));
test('unexplained text removal blocks export', () => reject(s => { s.entries[0].text = 'Shortened'; }, /transformation/));
test('inaccessible attachment blocks export', () => reject(s => {
  s.entries[0].attachments.push({ name: 'file', url: 'https://example.edu/file', status: 'unresolved' });
}, /unresolved attachment/));
test('unsafe attachment URL blocks export', () => reject(s => {
  s.entries[0].attachments.push({ name: 'file', url: 'javascript:alert(1)', status: 'reference-verified' });
}, /unsupported attachment/));
test('oversized cell fails instead of truncating', () => reject(s => {
  s.entries[0].text = 'a'.repeat(32768); s.entries[0].source_text = s.entries[0].text;
}, /cell limit/));
test('invalid XML text fails instead of being stripped', () => reject(s => {
  s.entries[0].text = 'Hello\u0000'; s.entries[0].source_text = s.entries[0].text;
}, /XML-incompatible/));
test('missing source checks block verified output', () => reject(s => { s.source_checks = []; }, /source spot-check/));
test('file path traversal in section key fails', () => reject(s => { s.key = '../escape'; }, /section key/));
