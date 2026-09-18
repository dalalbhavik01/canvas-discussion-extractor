import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function readValue(raw = '') {
  const value = raw.trim();
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value); } catch { return value.slice(1, -1); }
  }
  return value;
}

function bodyFrom(block, headingIndex, issues, location) {
  const actionIndex = block.findIndex((line, i) => i > headingIndex
    && /- button "(?:Reply to post from|Collapse discussion thread|Expand discussion thread)/.test(line));
  if (actionIndex < 0) {
    issues.push(location + ': reply/action controls were not found');
    return '';
  }
  let end = actionIndex;
  while (end > headingIndex && !/^\s{6}- list:$/.test(block[end])) end--;
  if (end === headingIndex) {
    issues.push(location + ': action-list boundary was not found');
    return '';
  }
  const lines = block.slice(headingIndex + 1, end);
  const paragraphs = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const paragraph = line.match(/^(\s{6,})- paragraph(?::(?:\s+(.*))?)?$/);
    if (paragraph) {
      const indent = paragraph[1].length;
      let text = readValue(paragraph[2]);
      const parts = [];
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^\s*/)[0].length > indent) {
        const child = lines[j].match(/^\s+- (?:text|generic|strong|emphasis):(?:\s+(.*))?$/);
        if (child?.[1]) parts.push(readValue(child[1]));
        const image = lines[j].match(/^\s+- img "(.+)"/);
        if (image) parts.push('[Image: ' + image[1] + ']');
        j++;
      }
      if (!text) text = parts.filter((part, k) => part && part !== parts[k - 1]).join(' ');
      else if (parts.some(part => part.startsWith('[Image: '))) {
        text += ' ' + parts.filter(part => part.startsWith('[Image: ')).join(' ');
      }
      if (text) paragraphs.push(text);
      i = j - 1;
      continue;
    }
    const direct = line.match(/^\s{6}- (?:generic|text):(?:\s+(.*))?$/);
    if (direct?.[1]) {
      const text = readValue(direct[1]);
      if (text && !text.startsWith('Reply from ')) paragraphs.push(text);
      continue;
    }
    const link = line.match(/^\s{6}- link "(.+)":$/);
    if (link) {
      paragraphs.push(link[1]);
      continue;
    }
    if (/^\s{6}- list:$/.test(line)) {
      let j = i + 1;
      while (j < lines.length && lines[j].match(/^\s*/)[0].length > 6) j++;
      if (!lines.slice(i + 1, j).some(item => /- paragraph/.test(item))) {
        issues.push(location + ': authored list without readable paragraphs');
      }
    } else if (/^\s{6}- (?:table|blockquote|iframe)\b/.test(line)) {
      issues.push(location + ': authored structured content needs review');
    }
  }
  if (!paragraphs.length) issues.push(location + ': no readable body text');
  return paragraphs.join('\n\n');
}

function parsePage(text, section, page, sourceFile, issues, startOrder) {
  const lines = text.split(/\r?\n/);
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^    - generic "Reply to Post by (.+) from (\d{4}-\d{2}-\d{2})":$/);
    if (match) starts.push({ index: i, author: match[1] });
  }
  if (!starts.length) issues.push(section.key + '/page ' + page + ': no entries found');
  const entries = [];
  const stack = [];
  for (let n = 0; n < starts.length; n++) {
    const current = starts[n];
    const block = lines.slice(current.index, starts[n + 1]?.index ?? lines.length);
    const headingIndex = block.findIndex(line => /- heading "Reply from .*" \[level=\d+\]:/.test(line));
    const location = section.key + '/page ' + page + '/entry ' + (n + 1);
    if (headingIndex < 0) {
      issues.push(location + ': missing reply heading (possibly deleted)');
      continue;
    }
    const level = Number(block[headingIndex].match(/\[level=(\d+)\]/)[1]);
    if (level < 2) {
      issues.push(location + ': unexpected heading level ' + level);
      continue;
    }
    const authorLink = block.slice(0, headingIndex).join('\n').match(/\/users\/(\d+)/);
    const id = 'p' + page + 'e' + (n + 1);
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
    const parent = level === 2 ? null : stack[stack.length - 1];
    if (level > 2 && (!parent || parent.level !== level - 1)) {
      issues.push(location + ': missing parent for heading level ' + level);
    }
    const count = block.join('\n').match(/\bHide ([\d,]+) Repl(?:y|ies)\b/);
    const entry = {
      id, kind: level === 2 ? 'post' : 'reply', author: current.author,
      author_id: authorLink?.[1] ?? null,
      parent_id: parent?.id ?? null, level, page, order: startOrder + entries.length + 1,
      source_file: sourceFile,
      text: bodyFrom(block, headingIndex, issues, location),
      expected_replies: count ? Number(count[1].replaceAll(',', '')) : (level === 2 ? 0 : null),
    };
    entries.push(entry);
    stack.push(entry);
  }
  return entries;
}

export async function parseManifest(manifest, base) {
  if (!manifest || !Array.isArray(manifest.sections) || !manifest.sections.length) {
    throw new Error('Expected sections in manifest');
  }
  const capture = { version: 1, sections: [] };
  for (const section of manifest.sections) {
    if (!section.key || !section.url || !section.dir) throw new Error('Section needs key, URL, and dir');
    const folder = path.resolve(base, section.dir);
    const files = (await fs.readdir(folder)).filter(name => /^page_\d+\.txt$/.test(name))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
    const issues = [];
    const entries = [];
    const pages = [];
    const topic = new URL(section.url);
    const expectedPath = topic.pathname;
    for (const file of files) {
      const page = Number(file.match(/\d+/)[0]);
      const fullPath = path.join(folder, file);
      const snapshot = await fs.readFile(fullPath, 'utf8');
      const expanded = /button "Collapse Threads" \[expanded\]/.test(snapshot);
      if (!expanded) issues.push(section.key + '/page ' + page + ': threads not confirmed expanded');
      if (!snapshot.includes('/url: ' + expectedPath)
        && !snapshot.includes('/url: ' + topic.origin + expectedPath)) {
        issues.push(section.key + '/page ' + page + ': topic URL not confirmed in snapshot');
      }
      const sourceFile = path.relative(base, fullPath);
      pages.push({ number: page, source_file: sourceFile, expanded });
      entries.push(...parsePage(snapshot, section, page, sourceFile, issues, entries.length));
    }
    if (!files.length) issues.push(section.key + ': no page snapshots');
    const byId = new Map(entries.map(entry => [entry.id, entry]));
    for (const entry of entries) {
      const descendants = entries.filter(other => {
        let parent = other.parent_id;
        while (parent) {
          if (parent === entry.id) return true;
          parent = byId.get(parent)?.parent_id;
        }
        return false;
      }).length;
      if (entry.expected_replies !== null && descendants !== entry.expected_replies) {
        issues.push(section.key + '/' + entry.id + ': Canvas shows ' +
          entry.expected_replies + ' replies; captured ' + descendants);
      }
      if (entry.parent_id && !byId.has(entry.parent_id)) {
        issues.push(section.key + '/' + entry.id + ': parent missing');
      }
    }
    capture.sections.push({
      key: section.key, url: section.url, title: section.title ?? expectedPath,
      pages, entries, issues,
    });
  }
  return capture;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [manifestPath, outputPath] = process.argv.slice(2);
    if (!manifestPath || !outputPath) throw new Error('Usage: node parse_snapshots.mjs manifest.json capture.json');
    const base = path.dirname(path.resolve(manifestPath));
    const capture = await parseManifest(JSON.parse(await fs.readFile(manifestPath, 'utf8')), base);
    await fs.writeFile(outputPath, JSON.stringify(capture, null, 2), { flag: 'wx' });
    console.log(JSON.stringify(capture.sections.map(section => ({
      section: section.key, pages: section.pages.length,
      posts: section.entries.filter(entry => entry.kind === 'post').length,
      replies: section.entries.filter(entry => entry.kind === 'reply').length,
      issues: section.issues.length,
    }))));
    if (capture.sections.some(section => section.issues.length)) process.exitCode = 2;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
