"""Independently check exported OOXML cells against prepared matrices. Standard library only."""

import hashlib
import json
import posixpath
import re
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
      "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships"}


def decoded_text(element):
    if element is None:
        return ""
    text = "".join(part.text or "" for part in element.findall(".//s:t", NS))
    return re.sub(r"_x([0-9A-Fa-f]{4})_", lambda match: chr(int(match[1], 16)), text)


def cell_address(row, column):
    label = ""
    while column:
        column, remainder = divmod(column - 1, 26)
        label = chr(65 + remainder) + label
    return f"{label}{row}"


def read_workbook(path):
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError("Invalid ZIP checksum")
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        targets = {rel.attrib["Id"]: rel.attrib["Target"] for rel in relationships}
        shared = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared = [decoded_text(si) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        result = []
        for sheet in workbook.findall("s:sheets/s:sheet", NS):
            target = targets[sheet.attrib[f"{{{NS['r']}}}id"]]
            sheet_path = target.lstrip("/") if target.startswith("/") else posixpath.normpath("xl/" + target)
            root = ET.fromstring(archive.read(sheet_path))
            cells = {}
            for cell in root.findall(".//s:sheetData/s:row/s:c", NS):
                address = cell.attrib["r"]
                if cell.find("s:f", NS) is not None:
                    raise ValueError(f"Unexpected formula in {sheet.attrib['name']}!{address}")
                value = cell.find("s:v", NS)
                kind = cell.get("t", "n")
                if kind == "s":
                    content = shared[int(value.text)]
                elif kind == "inlineStr":
                    content = decoded_text(cell.find("s:is", NS))
                elif kind == "e":
                    raise ValueError(f"Excel error at {address}")
                elif value is None or value.text is None:
                    content = ""
                elif kind in ("str", "d"):
                    content = value.text
                elif kind == "b":
                    content = value.text == "1"
                else:
                    content = float(value.text)
                if address in cells:
                    raise ValueError(f"Duplicate cell {address}")
                cells[address] = content
            result.append((sheet.attrib["name"], cells))
        return result


def verify(directory):
    directory = Path(directory)
    marker = directory / "VERIFIED.json"
    if marker.exists():
        marker.unlink()
    prepared_bytes = (directory / "prepared.json").read_bytes()
    prepared = json.loads(prepared_bytes)
    if not isinstance(prepared, dict):
        raise ValueError("Expected an object for the prepared manifest")
    sections = prepared.get("sections")
    if prepared.get("version") != 1 or not isinstance(sections, list) or not sections:
        raise ValueError("Expected version 1 and a nonempty section manifest")
    keys = [section.get("key") for section in sections if isinstance(section, dict)]
    if len(keys) != len(sections) or any(
        not isinstance(key, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", key) for key in keys
    ):
        raise ValueError("Invalid section key in prepared manifest")
    if len({key.lower() for key in keys}) != len(keys):
        raise ValueError("Duplicate section key in prepared manifest")
    expected_files = {f"{key}.xlsx" for key in keys}
    actual_files = {item.name for item in directory.iterdir() if item.suffix.lower() == ".xlsx"}
    if actual_files - expected_files:
        raise ValueError("Unexpected workbook files outside selected scope")
    for section in sections:
        sheets = section.get("sheets")
        if not isinstance(sheets, list) or len(sheets) != 2 or any(not isinstance(s, dict) for s in sheets):
            raise ValueError("Invalid sheet manifest")
        if [sheet.get("name") for sheet in sheets] != ["Posts and Replies", "Audit"]:
            raise ValueError("Invalid sheet manifest order/names")
        for sheet in sheets:
            rows = sheet.get("values")
            if not isinstance(rows, list) or not rows or not isinstance(rows[0], list) or not rows[0]:
                raise ValueError("Missing sheet values/header")
            if any(not isinstance(row, list) or len(row) != len(rows[0]) for row in rows):
                raise ValueError("Nonrectangular prepared sheet")
    verified = []
    for section in sections:
        path = directory / f"{section['key']}.xlsx"
        actual = read_workbook(path)
        expected = section["sheets"]
        if [name for name, _ in actual] != [sheet["name"] for sheet in expected]:
            raise ValueError(f"{section['key']}: sheet order/names mismatch")
        count = 0
        for (name, cells), spec in zip(actual, expected):
            for row_number, row in enumerate(spec["values"], 1):
                for column, value in enumerate(row, 1):
                    address = cell_address(row_number, column)
                    found = cells.pop(address, "")
                    if found != value or (isinstance(value, str) != isinstance(found, str)):
                        raise ValueError(f"{section['key']}/{name}/{address}: source cell mismatch")
                    count += 1
            if any(value != "" for value in cells.values()):
                raise ValueError(f"{section['key']}/{name}: extra nonempty cells")
        verified.append({"file": path.name, "cells_checked": count,
                         "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    result = {"status": "saved-workbook-cells-match-prepared-capture",
              "live_source_verified_by_this_script": False,
              "prepared_sha256": hashlib.sha256(prepared_bytes).hexdigest(), "files": verified}
    # Publish a complete marker atomically; interrupted verification must not look successful.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=directory, delete=False) as stream:
            temporary = Path(stream.name)
            json.dump(result, stream, indent=2)
        temporary.replace(marker)
    finally:
        if temporary is not None and temporary.exists():
            temporary.unlink()
    return result


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("Usage: python3 verify_workbooks.py OUTPUT_DIRECTORY")
        print(json.dumps(verify(sys.argv[1]), indent=2))
    except (ValueError, KeyError, OSError, ET.ParseError, zipfile.BadZipFile) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
