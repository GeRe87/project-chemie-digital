"""Prepare approved local institutional artwork without modifying source files."""
import argparse
from pathlib import Path
from shutil import copyfile
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser()
parser.add_argument("source", type=Path, help="Directory containing the three supplied SVG files")
args = parser.parse_args()
target = Path(__file__).resolve().parents[1] / "apps/pitch/public/talks-media"
ns = "http://www.w3.org/2000/svg"
ET.register_namespace("", ns)
for theme in ("light", "dark"):
    root = ET.parse(args.source / "LOGO.svg").getroot()
    for parent in list(root.iter()):
        for child in list(parent):
            if not child.tag.startswith("{" + ns + "}") or child.tag.endswith("metadata"):
                parent.remove(child)
        for key in list(parent.attrib):
            if key.startswith("{"): del parent.attrib[key]
        if theme == "dark" and "style" in parent.attrib:
            parent.attrib["style"] = parent.attrib["style"].replace("#033052", "#bfe9ff").replace("#0668af", "#4edbf2")
    ET.ElementTree(root).write(target / f"iac-{theme}.svg", encoding="utf-8", xml_declaration=True)
copyfile(args.source / "logo_claim_rgb.svg", target / "ude-light.svg")
copyfile(args.source / "logo_claim_rgb_negativ.svg", target / "ude-dark.svg")
