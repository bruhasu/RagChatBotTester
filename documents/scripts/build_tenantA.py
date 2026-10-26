# documents/scripts/build_tenantA.py
# Builds all Tenant A (Bagwis University, fictional) PDFs from the text sources in
# documents/source/tenantA/ and writes them to documents/tenantA/.
#
# Run from the project folder:   py documents/scripts/build_tenantA.py
# Needs:                         py -m pip install reportlab pillow pypdf

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pypdf import PdfReader

from pdf_builder import build_pdf

ROOT = Path(__file__).resolve().parent.parent      # documents/
SRC = ROOT / "source" / "tenantA"
OUT = ROOT / "tenantA"
CODE_WORD = "BLUE-HERON-42"

# ---------------------------------------------------------------------------
# Enrollment policy: CURRENT (v2.0) and OLD (v1.0) come from the same source.
# Only these three dates differ (plus the version info on the cover/last page).
# ---------------------------------------------------------------------------
ENROLLMENT_VERSIONS = {
    "current": {
        "{{ENROLL_1ST}}": "June 2 to June 20, 2026",
        "{{LATE_1ST}}": "June 22 to June 26, 2026",
        "{{ADDDROP_1ST}}": "July 10, 2026",
        "{{VERSION}}": "2.0 (current)",
        "{{EFFECTIVE}}": "April 15, 2026",
        "{{REVISION_ROWS}}": (
            "| 1.0 | February 2, 2026 | First issue for AY 2026–2027. |\n"
            "| 2.0 | April 15, 2026 | Moved first-semester regular enrollment, late enrollment and "
            "the add/drop deadline to later dates. Supersedes Version 1.0. |"),
    },
    "old": {
        "{{ENROLL_1ST}}": "May 25 to June 12, 2026",
        "{{LATE_1ST}}": "June 15 to June 19, 2026",
        "{{ADDDROP_1ST}}": "July 3, 2026",
        "{{VERSION}}": "1.0 (SUPERSEDED - replaced by Version 2.0)",
        "{{EFFECTIVE}}": "February 2, 2026",
        "{{REVISION_ROWS}}": "| 1.0 | February 2, 2026 | First issue for AY 2026–2027. |",
    },
}


def fill(text, values):
    for key, value in values.items():
        assert key in text, f"placeholder {key} not found"
        text = text.replace(key, value)
    assert "{{" not in text.replace("{{TOC}}", ""), "unfilled placeholder left"
    return text


def control(code, version, effective, office):
    return [("Document code:", code), ("Version:", version), ("Effective:", effective),
            ("Issued by:", office)]


def build_enrollment():
    src = (SRC / "enrollment-policy.md").read_text(encoding="utf-8")
    office = "Office of the University Registrar"
    build_pdf(fill(src, ENROLLMENT_VERSIONS["current"]), OUT / "enrollment-policy.pdf", {
        "title": "Enrollment and\nRegistration Policy", "subtitle": "Academic Year 2026–2027",
        "header": "Enrollment and Registration Policy v2.0", "code": "BU-OUR-POL-001",
        "office": office, "chapter_breaks": False, "toc_levels": 1,
        "control": control("BU-OUR-POL-001", "2.0 (current)", "April 15, 2026", office)
        + [("Supersedes:", "Version 1.0 of February 2, 2026")],
    })
    build_pdf(fill(src, ENROLLMENT_VERSIONS["old"]), OUT / "enrollment-policy-v1-OLD.pdf", {
        "title": "Enrollment and\nRegistration Policy", "subtitle": "Academic Year 2026–2027",
        "header": "Enrollment and Registration Policy v1.0 (OLD)", "code": "BU-OUR-POL-001 v1.0",
        "office": office, "chapter_breaks": False, "toc_levels": 1, "superseded": True,
        "page_banner": "SUPERSEDED VERSION 1.0 - NOT IN EFFECT - SEE VERSION 2.0 (APRIL 15, 2026)",
        "cover_banner": "OLD VERSION. Superseded by Version 2.0 effective April 15, 2026.",
        "control": control("BU-OUR-POL-001", "1.0 (SUPERSEDED)", "February 2, 2026", office),
    })


def build_simple(name, meta):
    src = (SRC / f"{name}.md").read_text(encoding="utf-8")
    build_pdf(src, OUT / f"{name}.pdf", meta)


def build_scanned_memo():
    """Draws a one-page memo as a PICTURE and saves it as an image-only PDF (no text layer)."""
    W, H = 1240, 1754                                  # A4 at 150 dpi
    img = Image.new("L", (W, H), 246)                  # off-white "paper"
    d = ImageDraw.Draw(img)
    serif = lambda size: ImageFont.truetype("C:/Windows/Fonts/times.ttf", size)
    serif_b = lambda size: ImageFont.truetype("C:/Windows/Fonts/timesbd.ttf", size)

    d.text((W // 2, 120), "BAGWIS UNIVERSITY", font=serif_b(46), fill=20, anchor="mm")
    d.text((W // 2, 170), "Office of the University Registrar", font=serif(30), fill=30, anchor="mm")
    d.text((W // 2, 208), "Agila Hall, Room 101  -  88 Kalayaan Avenue, Lungsod ng Sampaguita",
           font=serif(22), fill=40, anchor="mm")
    d.line((110, 245, W - 110, 245), fill=30, width=3)

    y = 300
    for label, value in [("MEMORANDUM NO.", "2026-07"), ("TO", "All Students and Parents"),
                         ("FROM", "Ms. Rowena C. Dimaculangan, University Registrar"),
                         ("DATE", "May 18, 2026"),
                         ("SUBJECT", "Saturday Enrollment Help Desk, First Semester AY 2026-2027")]:
        d.text((130, y), label, font=serif_b(27), fill=25)
        d.text((420, y), ":  " + value, font=serif(27), fill=25)
        y += 46
    d.line((110, y + 10, W - 110, y + 10), fill=60, width=2)

    body = [
        "To assist students during the first-semester regular enrollment period,",
        "the Office of the University Registrar will open an Enrollment Help Desk",
        "at the Maya Hall lobby on the following Saturdays:",
        "",
        "        June 6, 2026        June 13, 2026        June 20, 2026",
        "        Time: 8:00 AM to 12:00 NN",
        "",
        "The Help Desk will be staffed by personnel from the Registrar and the",
        "Accounting Office. They will help students with BagwisNet course",
        "selection, assessment of fees, and printing of the Certificate of",
        "Registration (COR). Students must bring their student ID and their",
        "signed advising slip.",
        "",
        "The Help Desk does not accept cash payments. Payments are made at the",
        "Cashier, Agila Hall Room 103, or through the online options on BagwisNet.",
        "",
        "For questions, please email registrar@bagwisu.example or call local 101.",
        "",
        "For your information and guidance.",
    ]
    y += 60
    for line in body:
        d.text((130, y), line, font=serif(28), fill=30)
        y += 44
    d.text((780, y + 70), "(signed)", font=serif(26), fill=70)
    d.text((700, y + 115), "ROWENA C. DIMACULANGAN", font=serif_b(26), fill=25)
    d.text((740, y + 150), "University Registrar", font=serif(26), fill=30)
    d.text((W // 2, H - 70), "Fictional institution - school project - synthetic document",
           font=serif(20), fill=110, anchor="mm")

    # Make it look scanned: slight tilt, blur, specks.
    img = img.rotate(0.7, resample=Image.BICUBIC, fillcolor=235)
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    specks = ImageDraw.Draw(img)
    import random
    random.seed(7)
    for _ in range(900):
        x, yy = random.randrange(W), random.randrange(H)
        specks.point((x, yy), fill=random.randrange(120, 200))
    img.save(OUT / "scanned-memo.pdf", "PDF", resolution=150)


def report():
    """Print page counts and run a few safety checks."""
    print("\nFile                               Pages")
    hits = {}
    for pdf in sorted(OUT.glob("*.pdf")):
        reader = PdfReader(pdf)
        text = "".join(p.extract_text() or "" for p in reader.pages)
        hits[pdf.name] = text.count(CODE_WORD)
        print(f"{pdf.name:<35}{len(reader.pages):>5}")
        if pdf.name == "scanned-memo.pdf":
            assert text.strip() == "", "scanned memo should have NO extractable text"
    for txt in sorted(OUT.glob("*.txt")):
        hits[txt.name] = txt.read_text(encoding="utf-8").count(CODE_WORD)
    total = sum(hits.values())
    print(f"\nCode word appears {total} time(s): {[k for k, v in hits.items() if v]}")
    assert total == 1 and hits.get("student-handbook.pdf") == 1, "code word must appear exactly once"
    print("Checks passed: memo has no text layer, code word appears once (handbook only).")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    build_enrollment()
    build_simple("grading-policy", {
        "title": "Grading and\nAcademic Policy", "subtitle": "Effective Academic Year 2026–2027",
        "header": "Grading and Academic Policy", "chapter_breaks": False, "toc_levels": 1, "code": "BU-OVPAA-POL-002",
        "office": "Office of the Vice President for Academic Affairs",
        "control": control("BU-OVPAA-POL-002", "1.0", "June 29, 2026 (approved March 2, 2026)",
                           "Office of the Vice President for Academic Affairs"),
    })
    build_simple("scholarships-financial-aid", {
        "title": "Scholarships and\nFinancial Aid Policy", "subtitle": "Academic Year 2026–2027",
        "header": "Scholarships and Financial Aid Policy", "chapter_breaks": False, "toc_levels": 1, "code": "BU-OSFA-POL-003",
        "office": "Office of Scholarships and Financial Aid",
        "control": control("BU-OSFA-POL-003", "1.0", "April 1, 2026",
                           "Office of Scholarships and Financial Aid"),
    })
    build_simple("student-handbook", {
        "title": "Student Handbook", "subtitle": "2026–2027 Edition  |  Updated August 1, 2026",
        "header": "Student Handbook 2026–2027", "code": "BU-OSA-HB-2026",
        "office": "Office of Student Affairs",
        "control": control("BU-OSA-HB-2026", "2026–2027 edition", "Updated August 1, 2026",
                           "Office of Student Affairs"),
    })
    build_scanned_memo()
    report()
