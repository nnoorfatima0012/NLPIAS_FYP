# nlp-services/resume_pipeline.py
from .docling_ocr import extract_clean_text_from_url
from .groq_client import parse_resume_with_groq
from .sanitizer import sanitize_resume_text


def run_resume_pipeline(file_url: str):
    """
    Main function the FastAPI endpoint will call.

    Steps:
    1. Download PDF and extract clean text (Docling + OCR + cleaning).
    2. Send to Groq to get markdown + structured JSON + scoring_text.
    """
    

    clean_text = extract_clean_text_from_url(file_url)

       # 🔐 SANITIZE HERE
    sanitized_text, pii_found = sanitize_resume_text(clean_text)

       # 🔍 DEBUG (ADD HERE)
    print("\n===== SANITIZED DEBUG =====")
    print("SANITIZED TEXT:\n", sanitized_text[:500])
    print("PII FOUND:", pii_found)
    print("===========================\n")

       # Send ONLY sanitized text to Groq
    scoring_text, structured, markdown = parse_resume_with_groq(sanitized_text)
    return {
        "scoring_text": scoring_text,
        "structured": structured,
        "markdown": markdown,
    }
