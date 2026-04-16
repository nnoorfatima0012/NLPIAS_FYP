# nlp-service/services/pdf_generator.py
from io import BytesIO
from typing import Any, Dict, List
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

def _safe(x: Any) -> str:
    return str(x).strip() if x is not None else ""

def _draw_section_title(c: canvas.Canvas, x: int, y: int, title: str, theme_color_rgb=(0.07, 0.10, 0.16)):
    c.setFillColorRGB(*theme_color_rgb)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(x, y, title)
    c.setFillColorRGB(0.07, 0.10, 0.16)

def _hex_to_rgb01(hex_color: str):
    try:
        s = (hex_color or "").lstrip("#")
        if len(s) != 6:
            return (0.07, 0.10, 0.16)  # default-ish
        r = int(s[0:2], 16) / 255.0
        g = int(s[2:4], 16) / 255.0
        b = int(s[4:6], 16) / 255.0
        return (r, g, b)
    except Exception:
        return (0.07, 0.10, 0.16)

def generate_resume_pdf_bytes(view_model: Dict[str, Any], theme_color: str = "#111827") -> bytes:
    """
    Generates PDF bytes from the same viewModel shape you currently use in Node:
    header{name,email,phone,address}, summary, education[], experience[], projects[], certifications[], languages[], skills[]
    """
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    width, height = letter

    theme_rgb = _hex_to_rgb01(theme_color)

    x = 50
    y = height - 60

    header = view_model.get("header") or {}

    # Header Name
    c.setFillColorRGB(*theme_rgb)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(x, y, _safe(header.get("name")) or "Resume")
    y -= 18

    # Contact line
    c.setFillColorRGB(0.07, 0.10, 0.16)
    c.setFont("Helvetica", 9)
    contact = " | ".join([_safe(header.get("email")), _safe(header.get("phone")), _safe(header.get("address"))])
    contact = " | ".join([p for p in contact.split(" | ") if p.strip()])
    if contact:
        c.drawString(x, y, contact)
        y -= 18
    y -= 8

    def new_page_if_needed(current_y: int) -> int:
        if current_y < 80:
            c.showPage()
            return height - 60
        return current_y

    # Summary
    summary = _safe(view_model.get("summary"))
    if summary:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Summary", theme_rgb)
        y -= 14
        c.setFont("Helvetica", 10)
        for line in summary.split("\n"):
            y = new_page_if_needed(y)
            c.drawString(x, y, line[:110])
            y -= 12
        y -= 8

    # Education
    education: List[Dict[str, Any]] = view_model.get("education") or []
    if education:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Education", theme_rgb)
        y -= 16
        for e in education:
            y = new_page_if_needed(y)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x, y, _safe(e.get("degree")) or "Degree")
            y -= 12
            c.setFont("Helvetica", 9)
            sub = " • ".join([_safe(e.get("institution")), _safe(e.get("dateRange"))])
            sub = " • ".join([p for p in sub.split(" • ") if p.strip()])
            if sub:
                c.drawString(x, y, sub[:110])
                y -= 12
            y -= 6
        y -= 6

    # Experience
    experience: List[Dict[str, Any]] = view_model.get("experience") or []
    if experience:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Experience", theme_rgb)
        y -= 16
        for ex in experience:
            y = new_page_if_needed(y)
            c.setFont("Helvetica-Bold", 10)
            title = " • ".join([_safe(ex.get("role")), _safe(ex.get("company"))])
            title = " • ".join([p for p in title.split(" • ") if p.strip()])
            c.drawString(x, y, title[:110])
            y -= 12
            date_range = _safe(ex.get("dateRange"))
            if date_range:
                c.setFont("Helvetica", 9)
                c.drawString(x, y, date_range[:110])
                y -= 12

            bullets = ex.get("bullets") or []
            if isinstance(bullets, list) and bullets:
                c.setFont("Helvetica", 9)
                for b in bullets:
                    y = new_page_if_needed(y)
                    c.drawString(x + 10, y, f"• {_safe(b)[:105]}")
                    y -= 11
            y -= 8
        y -= 6

    # Projects
    projects: List[Dict[str, Any]] = view_model.get("projects") or []
    if projects:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Projects", theme_rgb)
        y -= 16
        for p in projects:
            y = new_page_if_needed(y)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x, y, _safe(p.get("name")) or "Project")
            y -= 12
            c.setFont("Helvetica", 9)
            desc = _safe(p.get("description"))
            if desc:
                c.drawString(x, y, desc[:110])
                y -= 12
            tech = p.get("tech") or []
            if isinstance(tech, list) and tech:
                c.drawString(x, y, ("Tech: " + ", ".join([_safe(t) for t in tech if _safe(t)]) )[:110])
                y -= 12
            link = _safe(p.get("link"))
            if link:
                c.drawString(x, y, link[:110])
                y -= 12
            y -= 6
        y -= 6

    # Certifications
    certs: List[Dict[str, Any]] = view_model.get("certifications") or []
    if certs:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Certifications", theme_rgb)
        y -= 16
        for cc in certs:
            y = new_page_if_needed(y)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x, y, _safe(cc.get("name")) or "Certification")
            y -= 12
            c.setFont("Helvetica", 9)
            sub = " • ".join([_safe(cc.get("issuer")), _safe(cc.get("date"))])
            sub = " • ".join([p for p in sub.split(" • ") if p.strip()])
            if sub:
                c.drawString(x, y, sub[:110])
                y -= 12
            y -= 6
        y -= 6

    # Languages
    langs: List[Dict[str, Any]] = view_model.get("languages") or []
    if langs:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Languages", theme_rgb)
        y -= 16
        c.setFont("Helvetica", 10)
        for l in langs:
            y = new_page_if_needed(y)
            line = " — ".join([_safe(l.get("name")), _safe(l.get("level"))])
            line = " — ".join([p for p in line.split(" — ") if p.strip()])
            if line:
                c.drawString(x, y, line[:110])
                y -= 12
        y -= 6

    # Skills
    skills = view_model.get("skills") or []
    if isinstance(skills, list) and skills:
        y = new_page_if_needed(y)
        _draw_section_title(c, x, y, "Skills", theme_rgb)
        y -= 16
        c.setFont("Helvetica", 10)
        c.drawString(x, y, ", ".join([_safe(s) for s in skills if _safe(s)])[:110])

    c.showPage()
    c.save()

    return buf.getvalue()
