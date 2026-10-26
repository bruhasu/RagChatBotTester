# documents/scripts/pdf_builder.py
# Turns a simple Markdown-like text file into a styled PDF (cover page, table of
# contents, header/footer). Used by build_tenantA.py and build_tenantB.py.
# Needs: py -m pip install reportlab
#
# Supported syntax in the source .md files:
#   # Chapter title        -> big heading, starts a new page, listed in the TOC
#   ## Section title       -> section heading, listed in the TOC
#   ### Sub-heading        -> small heading
#   - bullet item          -> bullet list (indent the next line by 2 spaces to continue it)
#   1. numbered item       -> numbered list
#   | a | b |              -> table (first row = header; |---| lines are skipped)
#   > note text            -> shaded note box
#   **bold**  *italic*     -> inline styles
#   {{TOC}}                -> table of contents goes here
#   [[PAGEBREAK]]          -> force a new page

import re
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, NextPageTemplate, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

# Calibri ships with Windows and has the peso sign (₱). The PDF built-in fonts do not.
FONT_DIR = "C:/Windows/Fonts/"
pdfmetrics.registerFont(TTFont("Body", FONT_DIR + "calibri.ttf"))
pdfmetrics.registerFont(TTFont("Body-Bold", FONT_DIR + "calibrib.ttf"))
pdfmetrics.registerFont(TTFont("Body-Italic", FONT_DIR + "calibrii.ttf"))
pdfmetrics.registerFont(TTFont("Body-BoldItalic", FONT_DIR + "calibriz.ttf"))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="Body-Bold",
                              italic="Body-Italic", boldItalic="Body-BoldItalic")

# Branding per tenant. Pick one with meta["theme"] (default "bagwis").
THEMES = {
    "bagwis": {
        "primary": "#1B2A4A", "accent": "#D4AF37", "light": "#F3F1EA", "grid": "#C9C4B5",
        "logo": "wing", "brand": "BAGWIS UNIVERSITY",
        "author": "Bagwis University (fictional) - synthetic",
        "subject": "Synthetic document for a school project",
        "cover_note": "Bagwis University is a fictional institution created for a school project. "
                      "All names, people and data in this document are synthetic.",
        "footer_note": "Fictional business for a school project. All content is synthetic.",
    },
    # Tenant B must not mention school topics anywhere, so its notes avoid that word.
    "kahonko": {
        "primary": "#C2410C", "accent": "#FDBA74", "light": "#FFF7ED", "grid": "#E7C9B5",
        "logo": "box", "brand": "KAHONKO GADGETS",
        "author": "KahonKo Gadgets (fictional) - synthetic",
        "subject": "Synthetic document for a demo project",
        "cover_note": "KahonKo Gadgets is a fictional online shop created for a demo project. "
                      "All names, products and data in this document are synthetic.",
        "footer_note": "Fictional business for a demo project. All content is synthetic.",
    },
}
THEME = THEMES["bagwis"]
PRIMARY = colors.HexColor(THEME["primary"])
ACCENT = colors.HexColor(THEME["accent"])
LIGHT = colors.HexColor(THEME["light"])
GRID = colors.HexColor(THEME["grid"])
RED = colors.HexColor("#B91C1C")

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm

STYLES = {
    "body": ParagraphStyle("body", fontName="Body", fontSize=10.5, leading=14.5, spaceAfter=6),
    "h1": ParagraphStyle("h1", fontName="Body-Bold", fontSize=20, leading=25, textColor=PRIMARY,
                         spaceBefore=4, spaceAfter=12),
    "h2": ParagraphStyle("h2", fontName="Body-Bold", fontSize=14, leading=18, textColor=PRIMARY,
                         spaceBefore=12, spaceAfter=6),
    "h3": ParagraphStyle("h3", fontName="Body-Bold", fontSize=11.5, leading=15, spaceBefore=8,
                         spaceAfter=4),
    "bullet": ParagraphStyle("bullet", fontName="Body", fontSize=10.5, leading=14.5, leftIndent=16,
                             bulletIndent=4, spaceAfter=3),
    "cell": ParagraphStyle("cell", fontName="Body", fontSize=9.5, leading=12.5),
    "cellhead": ParagraphStyle("cellhead", fontName="Body-Bold", fontSize=9.5, leading=12.5,
                               textColor=colors.white),
    "note": ParagraphStyle("note", fontName="Body", fontSize=10.5, leading=14.5),
    "toc0": ParagraphStyle("toc0", fontName="Body-Bold", fontSize=11, leading=16, leftIndent=0),
    "toc1": ParagraphStyle("toc1", fontName="Body", fontSize=10, leading=13.5, leftIndent=16),
    "toctitle": ParagraphStyle("toctitle", fontName="Body-Bold", fontSize=18, leading=24,
                               textColor=PRIMARY, spaceAfter=10, alignment=TA_CENTER),
}
for _name in ("h1", "h2", "h3"):
    STYLES[_name].keepWithNext = 1   # never leave a heading alone at the bottom of a page


def inline(text):
    """Escape XML characters, then turn **bold** and *italic* into reportlab tags."""
    text = escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<i>\1</i>", text)
    return text


class Heading(Paragraph):
    """A Paragraph that remembers its TOC level so the doc can list it."""

    def __init__(self, text, style, level):
        super().__init__(inline(text), style)
        self.toc_level = level
        self.toc_text = text.replace("**", "")


def make_table(rows):
    ncols = max(len(r) for r in rows)
    rows = [r + [""] * (ncols - len(r)) for r in rows]
    # Column widths proportional to the longest text in each column (with limits).
    usable = PAGE_W - 2 * MARGIN
    lengths = [max(min(len(r[c]), 60) for r in rows) + 4 for c in range(ncols)]
    widths = [usable * l / sum(lengths) for l in lengths]
    data = [[Paragraph(inline(c), STYLES["cellhead"] if i == 0 else STYLES["cell"]) for c in r]
            for i, r in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("GRID", (0, 0), (-1, -1), 0.5, GRID),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]
    for i in range(2, len(rows), 2):
        style.append(("BACKGROUND", (0, i), (-1, i), LIGHT))
    t.setStyle(TableStyle(style))
    return t


def note_box(text):
    t = Table([[Paragraph(inline(text), STYLES["note"])]], colWidths=[PAGE_W - 2 * MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("LINEBEFORE", (0, 0), (0, -1), 3, ACCENT),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return t


def parse(md, chapter_breaks=True):
    """Convert the source text into a list of reportlab flowables.
    chapter_breaks=False lets '#' chapters flow on without starting a new page."""
    story, para, items, table, seen_h1 = [], [], [], [], False

    def flush():
        nonlocal para, items, table
        if para:
            story.append(Paragraph(inline(" ".join(para)), STYLES["body"]))
        for kind, num, text in items:
            bullet = "•" if kind == "-" else num
            story.append(Paragraph(inline(text), STYLES["bullet"], bulletText=bullet))
        if items:
            story.append(Spacer(1, 4))
        if table:
            story.append(make_table(table))
            story.append(Spacer(1, 8))
        para, items, table = [], [], []

    for raw in md.splitlines():
        line = raw.rstrip()
        s = line.strip()
        if not s:
            flush()
            continue
        if s == "{{TOC}}":
            flush()
            toc = TableOfContents(levelStyles=[STYLES["toc0"], STYLES["toc1"]], dotsMinLevel=0)
            story += [Paragraph("Contents", STYLES["toctitle"]), toc]
            continue
        if s == "[[PAGEBREAK]]":
            flush()
            story.append(PageBreak())
            continue
        if s.startswith("|"):
            if para or items:
                flush()
            if re.fullmatch(r"\|[\s:|-]+\|", s):
                continue
            table.append([c.strip() for c in s.strip("|").split("|")])
            continue
        if table:
            flush()
        m = re.match(r"(#{1,3}) (.*)", s)
        if m:
            flush()
            level = len(m.group(1))
            if level == 1:
                if seen_h1:
                    story.append(PageBreak() if chapter_breaks else Spacer(1, 14))
                seen_h1 = True
                story.append(Heading(m.group(2), STYLES["h1"], 0))
            elif level == 2:
                story.append(Heading(m.group(2), STYLES["h2"], 1))
            else:
                story.append(Paragraph(inline(m.group(2)), STYLES["h3"]))
            continue
        if s.startswith("> "):
            flush()
            story.append(note_box(s[2:]))
            story.append(Spacer(1, 8))
            continue
        m = re.match(r"(-|\d+\.) (.*)", s)
        if m:
            if para:
                flush()
            items.append(("-" if m.group(1) == "-" else "1", m.group(1), m.group(2)))
            continue
        if items and line.startswith("  "):
            kind, num, text = items[-1]
            items[-1] = (kind, num, text + " " + s)
            continue
        if items:
            flush()
        para.append(s)
    flush()
    return story


class PolicyDoc(BaseDocTemplate):
    def __init__(self, path, meta):
        super().__init__(path, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
                         topMargin=MARGIN + 6 * mm, bottomMargin=MARGIN,
                         title=meta["title"].replace("\n", " "), author=THEME["author"],
                         subject=THEME["subject"])
        self.meta = meta
        frame = Frame(MARGIN, MARGIN, PAGE_W - 2 * MARGIN, PAGE_H - 2 * MARGIN - 6 * mm, id="f")
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[frame], onPage=self.draw_cover),
            PageTemplate(id="body", frames=[frame], onPage=self.draw_page),
        ])

    def afterFlowable(self, flowable):
        if isinstance(flowable, Heading):
            key = f"h{id(flowable)}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.toc_text, key, level=flowable.toc_level)
            if flowable.toc_level < self.meta.get("toc_levels", 2):
                self.notify("TOCEntry", (flowable.toc_level, flowable.toc_text, self.page, key))

    def watermark(self, c):
        if not self.meta.get("superseded"):
            return
        c.saveState()
        c.setFillColor(colors.Color(0.73, 0.11, 0.11, alpha=0.13))
        c.setFont("Body-Bold", 64)
        c.translate(PAGE_W / 2, PAGE_H / 2)
        c.rotate(45)
        c.drawCentredString(0, 0, "SUPERSEDED")
        c.setFont("Body-Bold", 30)
        c.drawCentredString(0, -42, "OLD VERSION - NOT IN EFFECT")
        c.restoreState()

    def draw_cover(self, c, doc):
        m = self.meta
        c.saveState()
        c.setFillColor(PRIMARY)
        c.rect(0, PAGE_H * 0.45, PAGE_W, PAGE_H * 0.55, stroke=0, fill=1)
        c.setFillColor(ACCENT)
        c.rect(0, PAGE_H * 0.45 - 5, PAGE_W, 5, stroke=0, fill=1)
        c.setFillColor(ACCENT)
        x, y = MARGIN, PAGE_H - 52 * mm
        if THEME["logo"] == "wing":
            # Simple wing mark
            p = c.beginPath()
            p.moveTo(x, y); p.curveTo(x + 10 * mm, y + 14 * mm, x + 24 * mm, y + 16 * mm, x + 34 * mm, y + 18 * mm)
            p.curveTo(x + 24 * mm, y + 10 * mm, x + 14 * mm, y + 4 * mm, x, y)
            c.drawPath(p, stroke=0, fill=1)
        else:
            # Simple box mark: front face, lid, and a tape line
            c.setFillColor(colors.white)
            c.rect(x + 4 * mm, y - 2 * mm, 26 * mm, 18 * mm, stroke=0, fill=1)
            c.setFillColor(ACCENT)
            c.rect(x + 2 * mm, y + 16 * mm, 30 * mm, 5 * mm, stroke=0, fill=1)
            c.setFillColor(PRIMARY)
            c.rect(x + 15 * mm, y - 2 * mm, 4 * mm, 18 * mm, stroke=0, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Body-Bold", 15)
        c.drawString(MARGIN + 40 * mm, PAGE_H - 44 * mm, THEME["brand"])
        c.setFont("Body", 10.5)
        c.drawString(MARGIN + 40 * mm, PAGE_H - 50 * mm, m.get("office", ""))
        c.setFont("Body-Bold", 30)
        ty = PAGE_H * 0.62
        for line in m["title"].split("\n"):
            c.drawString(MARGIN, ty, line)
            ty -= 36
        c.setFont("Body", 14)
        c.setFillColor(ACCENT)
        c.drawString(MARGIN, ty - 4, m.get("subtitle", ""))
        # Document control block
        c.setFillColor(colors.black)
        c.setFont("Body", 11)
        yy = PAGE_H * 0.45 - 22 * mm
        for label, value in m.get("control", []):
            c.setFont("Body-Bold", 11); c.drawString(MARGIN, yy, label)
            c.setFont("Body", 11); c.drawString(MARGIN + 45 * mm, yy, value)
            yy -= 16
        if m.get("cover_banner"):
            c.setFillColor(RED)
            c.rect(MARGIN, yy - 30, PAGE_W - 2 * MARGIN, 34, stroke=0, fill=1)
            c.setFillColor(colors.white)
            c.setFont("Body-Bold", 11)
            c.drawCentredString(PAGE_W / 2, yy - 12, m["cover_banner"])
        c.setFillColor(colors.HexColor("#555555"))
        c.setFont("Body-Italic", 9)
        c.drawCentredString(PAGE_W / 2, 18 * mm, THEME["cover_note"])
        c.restoreState()
        self.watermark(c)

    def draw_page(self, c, doc):
        m = self.meta
        c.saveState()
        top = PAGE_H - MARGIN + 2 * mm
        c.setFont("Body-Bold", 9); c.setFillColor(PRIMARY)
        c.drawString(MARGIN, top, THEME["brand"])
        c.setFont("Body", 9)
        c.drawRightString(PAGE_W - MARGIN, top, m.get("header", m["title"].replace("\n", " ")))
        c.setStrokeColor(ACCENT); c.setLineWidth(1.2)
        c.line(MARGIN, top - 4, PAGE_W - MARGIN, top - 4)
        if m.get("superseded"):
            c.setFillColor(RED); c.setFont("Body-Bold", 9)
            c.drawCentredString(PAGE_W / 2, top + 12, m.get("page_banner", "SUPERSEDED"))
        c.setFillColor(colors.HexColor("#666666")); c.setFont("Body-Italic", 8)
        c.drawString(MARGIN, 12 * mm, THEME["footer_note"])
        c.setFont("Body", 8.5)
        c.drawRightString(PAGE_W - MARGIN, 12 * mm, f"{m.get('code', '')}  |  Page {doc.page}")
        c.restoreState()
        self.watermark(c)


def apply_theme(name):
    """Switch the colors and brand text used by everything above."""
    global THEME, PRIMARY, ACCENT, LIGHT, GRID
    THEME = THEMES[name]
    PRIMARY = colors.HexColor(THEME["primary"])
    ACCENT = colors.HexColor(THEME["accent"])
    LIGHT = colors.HexColor(THEME["light"])
    GRID = colors.HexColor(THEME["grid"])
    for style in ("h1", "h2", "toctitle"):
        STYLES[style].textColor = PRIMARY


def build_pdf(md_text, out_path, meta):
    apply_theme(meta.get("theme", "bagwis"))
    doc = PolicyDoc(str(out_path), meta)
    story = [Spacer(1, 1), NextPageTemplate("body"), PageBreak()]
    story += parse(md_text, meta.get("chapter_breaks", True))
    doc.multiBuild(story)
