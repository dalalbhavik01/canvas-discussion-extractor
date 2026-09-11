import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { prepareCapture, columnName } from './prepare.mjs';

export async function build(inputPath, outputDir, { render = true } = {}) {
  const original = await fs.readFile(inputPath, 'utf8');
  const prepared = prepareCapture(JSON.parse(original));
  const resolveFromHost = createRequire(path.join(process.cwd(), 'runtime-resolver.cjs'));
  let libraryPath;
  try { libraryPath = resolveFromHost.resolve('@oai/artifact-tool'); }
  catch { throw new Error('Artifact Tool unavailable. See references/transfer.md; no packages were installed.'); }
  const { Workbook, SpreadsheetFile } = await import(pathToFileURL(libraryPath).href);
  // A new directory prevents failed reruns from masquerading as an earlier verified export.
  await fs.mkdir(outputDir, { recursive: false });
  await fs.writeFile(path.join(outputDir, 'capture.json'), original, { flag: 'wx' });
  await fs.writeFile(path.join(outputDir, 'prepared.json'), JSON.stringify(prepared, null, 2), { flag: 'wx' });
  const files = [];
  for (const section of prepared.sections) {
    const workbook = Workbook.create();
    for (const spec of section.sheets) {
      const sheet = workbook.worksheets.add(spec.name);
      const height = spec.values.length;
      const width = spec.values[0].length;
      const range = sheet.getRangeByIndexes(0, 0, height, width);
      range.setNumberFormat('@');
      // Formula-like text is quoted here; exact strings are restored after export.
      range.values = spec.values.map(row => row.map(value =>
        typeof value === 'string' && value.startsWith('=') ? `'${value}` : value));
      range.format.font = { name: 'Arial', size: 10, color: '#202020' };
      range.format.wrapText = true;
      range.format.verticalAlignment = 'top';
      sheet.showGridLines = false;
      const header = sheet.getRangeByIndexes(0, 0, 1, width);
      header.format.fill = '#4A1730';
      header.format.font = { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' };
      header.format.rowHeight = 32;
      header.format.verticalAlignment = 'center';
      range.format.columnWidth = spec.name === 'Posts and Replies' ? 65 : 24;
      if (spec.name === 'Posts and Replies') sheet.getRangeByIndexes(0, 0, height, 1).format.columnWidth = 27;
      range.format.autofitRows();
      header.format.rowHeight = 32;
      sheet.freezePanes.freezeRows(1);
    }
    workbook.recalculate();
    await workbook.inspect({ kind: 'table', range: "'Posts and Replies'!A1:D3", tableMaxRows: 3, tableMaxCols: 4 });
    const destination = path.join(outputDir, `${section.key}.xlsx`);
    const file = await SpreadsheetFile.exportXlsx(workbook);
    await file.save(destination);
    if (render) for (const spec of section.sheets) {
      const end = `${columnName(Math.min(spec.values[0].length, 5))}${Math.min(spec.values.length, 4)}`;
      const preview = await workbook.render({ sheetName: spec.name, range: `A1:${end}`, scale: 1, format: 'png' });
      await fs.writeFile(path.join(outputDir, `${section.key}-${spec.name.replaceAll(' ', '-')}.png`),
        new Uint8Array(await preview.arrayBuffer()));
    }
    files.push({ section: section.key, file: path.basename(destination), ...section.summary });
  }
  execFileSync(process.env.DISCUSSION_PYTHON || 'python3', [
    fileURLToPath(new URL('./restore_text_cells.py', import.meta.url)), outputDir,
  ], { stdio: 'pipe' });
  await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify({
    capture_sha256: prepared.capture_sha256,
    status: 'exported-awaiting-independent-readback',
    note: 'Source evidence is supplied by the capturing agent; local checks do not authenticate it.',
    files,
  }, null, 2), { flag: 'wx' });
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [input, output] = process.argv.slice(2);
    if (!input || !output) throw new Error('Usage: node build_workbooks.mjs capture.json NEW_OUTPUT_DIRECTORY');
    console.log(JSON.stringify(await build(input, output), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
