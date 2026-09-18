import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseManifest } from '../skills/discussion/scripts/parse_snapshots.mjs';
import { prepareCapture } from '../skills/discussion/scripts/prepare.mjs';

function section(key) {
  return {
    key, url: 'https://canvas.tamu.edu/courses/1/discussion_topics/2',
    title: 'Sample discussion',
    pages: [{ number: 1, source_file: 'page_1.txt', expanded: true }],
    issues: [],
    entries: [
      { id: 'p1', kind: 'post', author: 'Student A', author_id: '1',
        parent_id: null, page: 1, order: 1, source_file: 'page_1.txt',
        text: 'First post', expected_replies: 2 },
      { id: 'r1', kind: 'reply', author: 'Student B', author_id: '2',
        parent_id: 'p1', page: 1, order: 2, source_file: 'page_1.txt',
        text: 'First reply', expected_replies: null },
      { id: 'r2', kind: 'reply', author: 'Student A', author_id: '1',
        parent_id: 'r1', page: 1, order: 3, source_file: 'page_1.txt',
        text: 'Nested reply', expected_replies: null },
    ],
  };
}

test('one URL gives one cohort; two URLs give separate cohorts', () => {
  const capture = { version: 1, sections: [section('701'), section('702')] };
  const one = prepareCapture(capture, { selectedKeys: ['701'] });
  assert.deepEqual(one.sections.map(item => item.key), ['701']);
  const both = prepareCapture(capture);
  assert.deepEqual(both.sections.map(item => item.key), ['701', '702']);
  assert.equal(both.sections[0].sheets[0].name, 'Posts and Replies');
  assert.equal(both.sections[0].sheets[0].values[1][2], 'Nested reply');
});

test('all replies get columns, including the third and nested replies', () => {
  const sample = section('701');
  sample.entries.push({
    id: 'r3', kind: 'reply', author: 'Student A', author_id: '1',
    parent_id: 'p1', page: 1, order: 4, source_file: 'page_1.txt',
    text: 'Third reply', expected_replies: null,
  });
  sample.entries[0].expected_replies = 3;
  const values = prepareCapture({ version: 1, sections: [sample] }).sections[0].sheets[0].values;
  assert.deepEqual(values[0], ['Student Name', 'Discussion Post', 'Reply 1', 'Reply 2']);
  assert.deepEqual(values[1], ['Student A', 'First post', 'Nested reply', 'Third reply']);
});

test('count mismatch, incomplete pages, and unresolved issues block export', () => {
  const sample = section('701');
  sample.entries[0].expected_replies = 1;
  assert.throws(() => prepareCapture({ version: 1, sections: [sample] }), /reply count mismatch/);
  sample.entries[0].expected_replies = 2;
  sample.pages[0].number = 2;
  assert.throws(() => prepareCapture({ version: 1, sections: [sample] }), /page coverage/);
  sample.pages[0].number = 1;
  sample.issues.push('unknown attachment');
  assert.throws(() => prepareCapture({ version: 1, sections: [sample] }), /unresolved capture issues/);
});

test('text that looks like an Excel formula stays literal in prepared cells', () => {
  const sample = section('701');
  sample.entries[0].text = '=HYPERLINK("https://example.test","text")';
  const values = prepareCapture({ version: 1, sections: [sample] }).sections[0].sheets[0].values;
  assert.equal(values[1][1], '=HYPERLINK("https://example.test","text")');
});

test('snapshot parser includes depth-four replies and preserves display order', async t => {
  const folder = await fs.mkdtemp(path.join(os.tmpdir(), 'discussion-skill-test-'));
  t.after(() => fs.rm(folder, { recursive: true, force: true }));
  const snapshot = [
    '- button "Collapse Threads" [expanded]:',
    '  - generic: Collapse Threads',
    '- link "Sample":',
    '  - /url: /courses/1/discussion_topics/2',
    '    - generic "Reply to Post by Student A from 2026-09-01":',
    '      - link "Student A":',
    '        - /url: /courses/1/users/1',
    '      - heading "Reply from Student A" [level=2]:',
    '      - paragraph: First post',
    '      - list:',
    '        - button "Collapse discussion thread from Student A Hide 2 Replies" [expanded]:',
    '        - button "Reply to post from Student A":',
    '    - generic "Reply to Post by Student B from 2026-09-01":',
    '      - link "Student B":',
    '        - /url: /courses/1/users/2',
    '      - heading "Reply from Student B" [level=3]:',
    '      - paragraph: First reply',
    '      - list:',
    '        - button "Reply to post from Student B":',
    '    - generic "Reply to Post by Student A from 2026-09-01":',
    '      - link "Student A":',
    '        - /url: /courses/1/users/1',
    '      - heading "Reply from Student A" [level=4]:',
    '      - paragraph: Nested reply',
    '      - list:',
    '        - button "Reply to post from Student A":',
  ].join('\n');
  await fs.writeFile(path.join(folder, 'page_1.txt'), snapshot);
  const capture = await parseManifest({ sections: [{
    key: '701', url: 'https://canvas.tamu.edu/courses/1/discussion_topics/2',
    dir: folder, title: 'Sample',
  }] }, folder);
  assert.deepEqual(capture.sections[0].issues, []);
  assert.deepEqual(capture.sections[0].entries.map(entry => entry.level), [2, 3, 4]);
  assert.equal(capture.sections[0].entries[2].parent_id, 'p1e2');
  assert.equal(prepareCapture(capture).sections[0].summary.replies, 2);
});
