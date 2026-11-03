"""Optional saved-PDF content regression, complementary to browser geometry.

Requires pypdf. Usage: python scripts/check_slides_pdf_text.py REPORT PDF [THEME]
Does not claim that text extraction alone proves visual readability. In particular,
math and diagrams still need raster inspection; long R code is a separate QA gate.
"""
import json
import re
import sys
import unicodedata
from pypdf import PdfReader


def normalized(text):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKC", text).casefold())


def check(report_path, pdf_path, theme="light"):
    with open(report_path, encoding="utf-8") as source:
        report = json.load(source)
    scenes = next(t["pages"] for t in report["themes"] if t["theme"] == theme)
    pdf = PdfReader(pdf_path)
    failures = []
    if len(pdf.pages) != len(scenes):
        failures.append({"problem": "page count differs", "expected": len(scenes), "actual": len(pdf.pages)})
    for page, scene in zip(pdf.pages, scenes):
        found = normalized(page.extract_text() or "")
        if float(page.mediabox.width) <= float(page.mediabox.height):
            failures.append({"page": scene["page"], "problem": "not landscape"})
        if not found:
            failures.append({"page": scene["page"], "problem": "empty page"})
        # First and last excerpt detect lost blocks/captions without assuming the
        # PDF extractor's reading order across independent grid columns.
        for text in scene["texts"]:
            expected = normalized(text)
            if len(expected) < 40:
                continue
            if expected[:30] not in found or expected[-30:] not in found:
                failures.append({"page": scene["page"], "id": scene["id"], "problem": "missing text block", "excerpt": text[:80]})
    print(json.dumps({"pages": len(pdf.pages), "theme": theme, "failures": failures}, ensure_ascii=True, indent=2))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(check(*sys.argv[1:]))
