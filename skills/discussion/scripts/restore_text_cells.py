"""Restore literal strings after Artifact Tool's automatic date coercion.

Keep the generated workbook structure and styles. Only textual values in the
prepared matrices are replaced with explicit OOXML inline strings.
"""

import json
import posixpath
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from verify_workbooks import NS, cell_address


def restore(directory):
    directory = Path(directory)
    prepared = json.loads((directory / "prepared.json").read_text(encoding="utf-8"))
    for section in prepared["sections"]:
        path = directory / f"{section['key']}.xlsx"
        with zipfile.ZipFile(path) as source:
            replacements = {}
            relationships = ET.fromstring(source.read("xl/_rels/workbook.xml.rels"))
            targets = {r.attrib["Id"]: r.attrib["Target"] for r in relationships}
            workbook = ET.fromstring(source.read("xl/workbook.xml"))
            sheets = workbook.findall("s:sheets/s:sheet", NS)
            if len(sheets) != len(section["sheets"]):
                raise ValueError("Unexpected worksheet count during text restoration")
            for sheet, spec in zip(sheets, section["sheets"]):
                if sheet.attrib["name"] != spec["name"]:
                    raise ValueError("Unexpected worksheet order during text restoration")
                target = targets[sheet.attrib[f"{{{NS['r']}}}id"]]
                target = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
                root = ET.fromstring(source.read(target))
                data = root.find("s:sheetData", NS)
                rows = {int(row.get("r")): row for row in data}
                for row_number, values in enumerate(spec["values"], 1):
                    row = rows.get(row_number)
                    if row is None:
                        row = ET.SubElement(data, f"{{{NS['s']}}}row", {"r": str(row_number)})
                    cells = {cell.get("r"): cell for cell in row}
                    for column, value in enumerate(values, 1):
                        if not isinstance(value, str):
                            continue
                        address = cell_address(row_number, column)
                        cell = cells.get(address)
                        if cell is None:
                            cell = ET.SubElement(row, f"{{{NS['s']}}}c", {"r": address})
                        for child in list(cell):
                            cell.remove(child)
                        cell.set("t", "inlineStr")
                        inline = ET.SubElement(cell, f"{{{NS['s']}}}is")
                        text = ET.SubElement(inline, f"{{{NS['s']}}}t", {"{http://www.w3.org/XML/1998/namespace}space": "preserve"})
                        text.text = re.sub(r"_x[0-9A-Fa-f]{4}_", lambda m: "_x005F_" + m[0][1:], value)
                    row[:] = sorted(row, key=lambda c: (len(re.sub(r"[0-9]", "", c.get("r", ""))), re.sub(r"[0-9]", "", c.get("r", ""))))
                replacements[target] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
            temp = path.with_suffix(".text-restored.tmp")
            with zipfile.ZipFile(temp, "x", compression=zipfile.ZIP_DEFLATED) as destination:
                for item in source.infolist():
                    destination.writestr(item, replacements.get(item.filename, source.read(item.filename)))
        temp.replace(path)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python3 restore_text_cells.py OUTPUT_DIRECTORY")
    restore(sys.argv[1])
