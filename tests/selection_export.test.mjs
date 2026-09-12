import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fixture } from './discussion.test.mjs';
import { build } from '../skills/discussion/scripts/build_workbooks.mjs';

for (const selected of ['cohort-A', 'cohort-B']) {
  test(`actual Excel export contains only ${selected}`, async t => {
    const data = fixture();
    const other = structuredClone(data.sections[0]);
    other.key = 'cohort-B'; other.label = 'Synthetic Cohort B'; data.sections.push(other);
    const excluded = data.sections.find(section => section.key !== selected);
    excluded.coverage.all_pages_visited = false;
    excluded.students[0].name = 'EXCLUDED_SYNTHETIC_STUDENT';
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'discussion-selection-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const source = path.join(directory, 'source.json');
    const output = path.join(directory, 'output');
    await fs.writeFile(source, JSON.stringify(data));
    const files = await build(source, output, { render: false, selectedKeys: [selected] });
    assert.deepEqual(files.map(file => file.section), [selected]);
    assert.deepEqual((await fs.readdir(output)).filter(file => file.endsWith('.xlsx')), [`${selected}.xlsx`]);
    for (const filename of ['capture.json', 'prepared.json']) {
      const text = await fs.readFile(path.join(output, filename), 'utf8');
      assert.ok(!text.includes('EXCLUDED_SYNTHETIC_STUDENT'));
      assert.deepEqual(JSON.parse(text).sections.map(section => section.key), [selected]);
    }
    const report = JSON.parse(await fs.readFile(path.join(output, 'report.json'), 'utf8'));
    assert.deepEqual(report.scope.skipped_sections, [excluded.key]);
    const verifier = fileURLToPath(new URL('../skills/discussion/scripts/verify_workbooks.py', import.meta.url));
    const readback = JSON.parse(execFileSync(process.env.DISCUSSION_PYTHON || 'python3', [verifier, output], { encoding: 'utf8' }));
    assert.equal(readback.files.length, 1);
    assert.equal(readback.files[0].file, `${selected}.xlsx`);
    assert.equal(readback.files[0].cells_checked, 160);
  });
}
