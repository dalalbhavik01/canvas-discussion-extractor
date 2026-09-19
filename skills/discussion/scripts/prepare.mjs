import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

function check(ok, message) {
  if (!ok) throw new Error(message);
}

export function columnName(number) {
  let name = '';
  while (number > 0) {
    number--;
    name = String.fromCharCode(65 + number % 26) + name;
    number = Math.floor(number / 26);
  }
  return name;
}

export function parseSectionArgs(args) {
  if (!args.length) return undefined;
  const keys = [];
  for (let i = 0; i < args.length; i += 2) {
    check(args[i] === '--section' && args[i + 1], 'Expected --section KEY');
    keys.push(args[i + 1]);
  }
  check(new Set(keys).size === keys.length, 'Duplicate section selector');
  return keys;
}

export function selectCapture(input, selectedKeys) {
  check(input && input.version === 1 && Array.isArray(input.sections) && input.sections.length,
    'Expected a version 1 capture with sections');
  const all = input.sections.map(section => section.key);
  check(all.every(key => typeof key === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(key)),
    'Invalid section key');
  check(new Set(all.map(key => key.toLowerCase())).size === all.length, 'Duplicate section key');
  const keys = selectedKeys ?? all;
  check(keys.length > 0 && keys.every(key => all.includes(key)), 'Unknown or empty section selection');
  return { version: 1, sections: keys.map(key => input.sections[all.indexOf(key)]) };
}

function validText(value, context) {
  check(typeof value === 'string', context + ': missing text');
  check(value.length <= 32767, context + ': exceeds Excel cell limit');
  check(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u.test(value),
    context + ': XML-incompatible character');
  check(![...value].some(char => {
    const code = char.codePointAt(0);
    return code >= 0xD800 && code <= 0xDFFF;
  }), context + ': unpaired Unicode surrogate');
}

function prepareSection(section) {
  const key = section.key;
  check(typeof section.url === 'string' && /^https:\/\/[^/]+\/courses\/\d+\/discussion_topics\/\d+/.test(section.url),
    key + ': invalid discussion URL');
  check(typeof section.title === 'string' && section.title.trim(), key + ': missing discussion title');
  check(Array.isArray(section.pages) && section.pages.length, key + ': no captured pages');
  check(Array.isArray(section.entries) && section.entries.length, key + ': no discussion entries');
  check(Array.isArray(section.issues) && section.issues.length === 0,
    key + ': unresolved capture issues: ' + JSON.stringify(section.issues));
  const pageNumbers = section.pages.map(page => page.number);
  check(pageNumbers.every((n, i) => n === i + 1), key + ': page coverage is not contiguous');
  check(section.pages.every(page => page.expanded === true && page.source_file),
    key + ': page not expanded or missing source snapshot');

  const ids = new Set();
  const authors = new Map();
  const entries = section.entries;
  const knownIdsByName = new Map();
  for (const entry of entries) {
    if (!entry.author_id) continue;
    if (!knownIdsByName.has(entry.author)) knownIdsByName.set(entry.author, new Set());
    knownIdsByName.get(entry.author).add(entry.author_id);
  }
  for (const [name, authorIds] of knownIdsByName) {
    check(authorIds.size === 1,
      key + ': same display name has multiple Canvas user IDs; resolve before export: ' + name);
  }
  const authorKeyFor = entry => {
    if (entry.author_id) return 'id:' + entry.author_id;
    const knownIds = knownIdsByName.get(entry.author);
    return knownIds?.size === 1 ? 'id:' + [...knownIds][0] : 'name:' + entry.author;
  };
  for (const [index, entry] of entries.entries()) {
    check(entry && typeof entry.id === 'string' && !ids.has(entry.id), key + ': duplicate/missing local entry ID');
    ids.add(entry.id);
    check(entry.kind === 'post' || entry.kind === 'reply', key + ': unknown entry kind');
    check(typeof entry.author === 'string' && entry.author.trim(), key + ': missing author');
    check(typeof entry.page === 'number' && pageNumbers.includes(entry.page), key + ': invalid entry page');
    check(entry.order === index + 1, key + ': entry order does not match Canvas display order');
    check(typeof entry.source_file === 'string' && entry.source_file,
      key + ': missing source file');
    validText(entry.text, key + '/' + entry.id);
    check(entry.text.trim(), key + ': empty body for ' + entry.id);
    const authorKey = authorKeyFor(entry);
    const found = authors.get(authorKey);
    check(!found || found === entry.author, key + ': one author ID has conflicting names');
    authors.set(authorKey, entry.author);
  }
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  const positions = new Map(entries.map((entry, i) => [entry.id, i]));
  for (const entry of entries) {
    if (entry.kind === 'post') {
      check(entry.parent_id === null, key + ': root has a parent');
    } else {
      check(byId.has(entry.parent_id), key + ': reply parent missing for ' + entry.id);
      check(positions.get(entry.parent_id) < positions.get(entry.id),
        key + ': reply appears before its parent');
    }
    if (entry.expected_replies !== null && entry.expected_replies !== undefined) {
      const actual = entries.filter(other => {
        let parent = other.parent_id;
        while (parent) {
          if (parent === entry.id) return true;
          parent = byId.get(parent)?.parent_id;
        }
        return false;
      }).length;
      check(actual === entry.expected_replies,
        key + ': reply count mismatch for ' + entry.id + ' (' + actual + ' vs ' +
        entry.expected_replies + ')');
    }
  }
  const names = new Map();
  for (const entry of entries) {
    const authorKey = authorKeyFor(entry);
    const previous = names.get(entry.author);
    check(!previous || previous === authorKey,
      key + ': same display name has multiple identities; resolve before export: ' + entry.author);
    names.set(entry.author, authorKey);
  }

  const grouped = new Map();
  for (const entry of entries) {
    const authorKey = authorKeyFor(entry);
    if (!grouped.has(authorKey)) grouped.set(authorKey, { name: entry.author, posts: [], replies: [] });
    grouped.get(authorKey)[entry.kind === 'post' ? 'posts' : 'replies'].push(entry.text);
  }
  const maxReplies = Math.max(2, ...[...grouped.values()].map(row => row.replies.length));
  check(maxReplies + 2 <= 16384, key + ': too many reply columns');
  const headers = ['Student Name', 'Discussion Post',
    ...Array.from({ length: maxReplies }, (_, i) => 'Reply ' + (i + 1))];
  const rows = [...grouped.values()].map(row => {
    const posts = row.posts.join('\n\n--- Additional top-level post ---\n\n');
    validText(posts, key + '/' + row.name + '/post');
    const values = [row.name, posts, ...row.replies];
    while (values.length < headers.length) values.push('');
    return values;
  });
  const sheets = [{ name: 'Posts and Replies', values: [headers, ...rows] }];
  return { key, url: section.url, title: section.title, pages: section.pages,
    sheets, summary: { students: rows.length,
      posts: entries.filter(entry => entry.kind === 'post').length,
      replies: entries.filter(entry => entry.kind === 'reply').length,
      reply_columns: maxReplies } };
}

export function prepareCapture(input, { selectedKeys } = {}) {
  const selected = selectCapture(input, selectedKeys);
  return { version: 1,
    capture_sha256: createHash('sha256').update(JSON.stringify(selected)).digest('hex'),
    sections: selected.sections.map(prepareSection) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [inputPath, outputPath, ...args] = process.argv.slice(2);
    check(inputPath && outputPath, 'Usage: node prepare.mjs capture.json prepared.json [--section KEY]');
    const result = prepareCapture(JSON.parse(await fs.readFile(inputPath, 'utf8')),
      { selectedKeys: parseSectionArgs(args) });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), { flag: 'wx' });
    console.log(JSON.stringify(result.sections.map(section => ({ section: section.key, ...section.summary }))));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
