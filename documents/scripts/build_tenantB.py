# documents/scripts/build_tenantB.py
# Builds the Tenant B (KahonKo Gadgets, fictional) PDFs from the text sources in
# documents/source/tenantB/ and writes them to documents/tenantB/. Then checks all
# Tenant B files: page counts, the code word, and that no school words slipped in.
#
# Run from the project folder:   py documents/scripts/build_tenantB.py
# Needs:                         py -m pip install reportlab pypdf

import csv
import re
from pathlib import Path

from pypdf import PdfReader

from pdf_builder import build_pdf

ROOT = Path(__file__).resolve().parent.parent      # documents/
SRC = ROOT / "source" / "tenantB"
OUT = ROOT / "tenantB"
CODE_WORD = "AMBER-LYNX-17"
OTHER_TENANT_CODE_WORD = "BLUE-HERON-42"

# Tenant B must never talk about school topics, so a leak from Tenant A is obvious.
FORBIDDEN = re.compile(
    r"\b(school|university|universit\w*|college|student\w*|semester\w*|enrol\w*|scholar\w*|"
    r"tuition|campus|handbook|registrar|academic\w*|grade[sd]?|GWA|INC|exams?|examination\w*|course\w*|"
    r"class(es)?|teacher\w*|professor\w*|diploma|dean|probation|Bagwis\w*)\b",
    re.IGNORECASE)


def control(version, office):
    return [("Version:", version), ("Effective:", "August 1, 2026"), ("Issued by:", office)]


def build():
    common = {"theme": "kahonko", "chapter_breaks": False, "toc_levels": 1}
    build_pdf((SRC / "return-refund-policy.md").read_text(encoding="utf-8"),
              OUT / "return-refund-policy.pdf", {
                  **common, "title": "Return and\nRefund Policy",
                  "subtitle": "Version 3.0  |  Effective August 1, 2026",
                  "header": "Return and Refund Policy v3.0", "code": "KK-POL-RR-3.0",
                  "office": "Customer Care",
                  "control": control("3.0", "KahonKo Gadgets Customer Care")})
    build_pdf((SRC / "warranty-terms.md").read_text(encoding="utf-8"),
              OUT / "warranty-terms.pdf", {
                  **common, "title": "Warranty Terms",
                  "subtitle": "Version 2.0  |  Effective August 1, 2026",
                  "header": "Warranty Terms v2.0", "code": "KK-POL-WT-2.0",
                  "office": "Warranty Desk",
                  "control": control("2.0", "KahonKo Gadgets Warranty Desk")})


def file_text(path):
    if path.suffix == ".pdf":
        return "".join(p.extract_text() or "" for p in PdfReader(path).pages)
    return path.read_text(encoding="utf-8")


def report():
    print("\nFile                          Size")
    hits, problems = {}, []
    for path in sorted(OUT.iterdir()):
        text = file_text(path)
        if path.suffix == ".pdf":
            size = f"{len(PdfReader(path).pages)} pages"
        elif path.suffix == ".csv":
            rows = list(csv.reader(path.open(encoding="utf-8")))
            assert all(len(r) == len(rows[0]) for r in rows), "CSV rows have different column counts"
            size = f"{len(rows) - 1} products x {len(rows[0])} columns"
        elif path.name == "shipping-faq.txt":
            size = f"{len(re.findall(r'^Q\d+:', text, re.M))} Q&As"
        else:
            size = "reference only"
        print(f"{path.name:<30}{size}")
        hits[path.name] = text.count(CODE_WORD)
        if OTHER_TENANT_CODE_WORD in text:
            problems.append(f"{path.name}: contains Tenant A's code word")
        for m in FORBIDDEN.finditer(text):
            problems.append(f"{path.name}: school word '{m.group(0)}'")
    total = sum(hits.values())
    print(f"\nCode word appears {total} time(s): {[k for k, v in hits.items() if v]}")
    if total != 1 or hits.get("warranty-terms.pdf") != 1:
        problems.append("code word must appear exactly once, in warranty-terms.pdf")
    for p in problems:
        print("PROBLEM:", p)
    assert not problems, "fix the problems above"
    print("Checks passed: code word once (warranty only), no school words, no Tenant A code word.")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    build()
    report()
