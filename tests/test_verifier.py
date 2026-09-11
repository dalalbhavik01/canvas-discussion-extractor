"""Run against a synthetic export via DISCUSSION_TEST_EXPORT. Never uses Canvas."""

import importlib.util
import json
import os
import shutil
import tempfile
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

SCRIPTS = Path(__file__).resolve().parents[1] / "skills" / "discussion" / "scripts"
spec = importlib.util.spec_from_file_location("verify_workbooks", SCRIPTS / "verify_workbooks.py")
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)


@unittest.skipUnless(os.environ.get("DISCUSSION_TEST_EXPORT"), "Set DISCUSSION_TEST_EXPORT to the synthetic export folder")
class VerificationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name) / "export"
        shutil.copytree(os.environ["DISCUSSION_TEST_EXPORT"], self.folder)
        prepared = json.loads((self.folder / "prepared.json").read_text())
        self.workbook = self.folder / f"{prepared['sections'][0]['key']}.xlsx"

    def change_xml(self, member, change):
        with zipfile.ZipFile(self.workbook) as source:
            info = source.infolist()
            data = {i.filename: source.read(i.filename) for i in info}
        root = ET.fromstring(data[member])
        change(root)
        data[member] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
        with zipfile.ZipFile(self.workbook, "w", compression=zipfile.ZIP_DEFLATED) as destination:
            for item in info:
                destination.writestr(item, data[item.filename])

    def test_all_saved_cells_match(self):
        result = verifier.verify(self.folder)
        self.assertEqual(len(result["files"]), 2)
        self.assertFalse(result["live_source_verified_by_this_script"])

    def test_changed_text_rejected_and_stale_marker_removed(self):
        def change(root):
            root.find(".//s:c[@r='B2']/s:is/s:t", verifier.NS).text = "Changed synthetic text"
        self.change_xml("xl/worksheets/sheet1.xml", change)
        with self.assertRaisesRegex(ValueError, "source cell mismatch"):
            verifier.verify(self.folder)
        self.assertFalse((self.folder / "VERIFIED.json").exists())

    def test_formula_injection_rejected(self):
        def change(root):
            cell = root.find(".//s:c[@r='B2']", verifier.NS)
            ET.SubElement(cell, f"{{{verifier.NS['s']}}}f").text = "1+1"
        self.change_xml("xl/worksheets/sheet1.xml", change)
        with self.assertRaisesRegex(ValueError, "Unexpected formula"):
            verifier.verify(self.folder)

    def test_extra_content_rejected(self):
        def change(root):
            row = root.find("s:sheetData/s:row", verifier.NS)
            cell = ET.SubElement(row, f"{{{verifier.NS['s']}}}c", {"r": "ZZ1", "t": "inlineStr"})
            inline = ET.SubElement(cell, f"{{{verifier.NS['s']}}}is")
            ET.SubElement(inline, f"{{{verifier.NS['s']}}}t").text = "Extra content"
        self.change_xml("xl/worksheets/sheet1.xml", change)
        with self.assertRaisesRegex(ValueError, "extra nonempty"):
            verifier.verify(self.folder)

    def test_missing_workbook_rejected(self):
        self.workbook.unlink()
        with self.assertRaises(FileNotFoundError):
            verifier.verify(self.folder)


if __name__ == "__main__":
    unittest.main()
