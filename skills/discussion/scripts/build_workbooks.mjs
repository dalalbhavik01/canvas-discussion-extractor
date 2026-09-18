import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { prepareCapture, parseSectionArgs } from './prepare.mjs';

export async function build(inputPath, outputDir, { selectedKeys } = {}) {
  const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
  const prepared = prepareCapture(input, { selectedKeys });
  const resolveFromHost = createRequire(path.join(process.cwd(), 'runtime-resolver.cjs'));
  let libraryPath;
  if (process.env.DISCUSSION_EXPORTER !== 'python') {
    try { libraryPath = resolveFromHost.resolve('@oai/artifact-tool'); }
    catch { /* Use the portable Python exporter below. */ }
  }
  await fs.mkdir(outputDir, { recursive: false });
  await fs.mkdir(path.join(outputDir, '.audit'));
  await fs.writeFile(path.join(outputDir, '.audit', 'prepared.json'),
    JSON.stringify(prepared, null, 2), { flag: 'wx' });
  const files = [];
  if (!libraryPath) {
    execFileSync(process.env.DISCUSSION_PYTHON || 'python3', [
      fileURLToPath(new URL('./export_openpyxl.py', import.meta.url)), outputDir,
    ], { stdio: 'pipe' });
    return prepared.sections.map(section => ({
      section: section.key, file: section.key + '.xlsx', ...section.summary,
    }));
  }
  const { Workbook, SpreadsheetFile } = await import(pathToFileURL(libraryPath).href);
  for (const section of prepared.sections) {
    const workbook = Workbook.create();
    const spec = section.sheets[0];
    const sheet = workbook.worksheets.add(spec.name);
    const height = spec.values.length;
    const width = spec.values[0].length;
    const range = sheet.getRangeByIndexes(0, 0, height, width);
    range.setNumberFormat('@');
    range.values = spec.values.map(row => row.map(value =>
      typeof value === 'string' && value.startsWith('=') ? "'" + value : value));
    range.format.font = { name: 'Arial', size: 10, color: '#202020' };
    range.format.wrapText = true;
    range.format.verticalAlignment = 'top';
    range.format.columnWidth = 65;
    sheet.getRangeByIndexes(0, 0, height, 1).format.columnWidth = 27;
    if (height > 1) sheet.getRangeByIndexes(1, 0, height - 1, width).format.rowHeight = 100;
    const header = sheet.getRangeByIndexes(0, 0, 1, width);
    header.format.fill = '#4A1730';
    header.format.font = { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' };
    header.format.rowHeight = 32;
    sheet.freezePanes.freezeRows(1);
    sheet.showGridLines = false;
    workbook.recalculate();
    const destination = path.join(outputDir, section.key + '.xlsx');
    const file = await SpreadsheetFile.exportXlsx(workbook);
    await file.save(destination);
    await fs.rm(destination + '.inspect.ndjson', { force: true });
    files.push({ section: section.key, file: path.basename(destination), ...section.summary });
  }
  execFileSync(process.env.DISCUSSION_PYTHON || 'python3', [
    fileURLToPath(new URL('./restore_text_cells.py', import.meta.url)), outputDir,
  ], { stdio: 'pipe' });
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [input, output, ...args] = process.argv.slice(2);
    if (!input || !output) throw new Error('Usage: node build_workbooks.mjs capture.json NEW_OUTPUT_DIRECTORY [--section KEY]');
    console.log(JSON.stringify(await build(input, output, { selectedKeys: parseSectionArgs(args) }), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
