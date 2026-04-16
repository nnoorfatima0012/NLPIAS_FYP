# # services/groq_client.py
# import os
# import json
# from groq import Groq

# GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
# if not GROQ_API_KEY:
#     raise RuntimeError("GROQ_API_KEY not set in environment")

# _client = Groq(api_key=GROQ_API_KEY)


# def build_resume_prompt(clean_text: str) -> str:
#     """
#     Prompt asks Groq to return strictly JSON.
#     """
#     return f"""
# You are a resume parsing engine.

# You receive merged cleaned text extracted from a CV.
# You must return ONLY valid JSON in the following exact schema:

# {{
#   "markdown": "string, full resume in clean Markdown format",
#   "structured": {{
#     "name": "string or empty",
#     "address": "string or empty",
#     "email": "string or empty",
#     "phone": "string or empty",
#     "summary": "string or empty",
#     "skills": [ "skill1", "skill2", ... ],
#     "education": [{{"degree": "...", "field": "...", "institution": "...", "from": "...", "to": "...", "currently": false }}],
#     "experience": [{{"title": "...", "company": "...", "from": "...", "to": "...", "currently": false, "description": "..."}}],
#     "languages": [{{"language": "...", "level": "..."}}],
#     "certifications": [{{"name": "...", "issuer": "...", "date": "..."}}],
#     "projects": [{{"name": "...", "description": "...", "technologies": ["..."], "link": ""}}],
#     "hobbies": "string or empty"
#   }},
#   "scoring_text": "single long string with all important information for matching"
# }}

# Rules:
# - Do NOT invent information.
# - If a section is missing, use empty string or empty list.
# - Respond with JSON ONLY. No markdown fences, no explanation.

# TEXT:
# -------------------------
# {clean_text}
# -------------------------
# """.strip()


# def parse_resume_with_groq(clean_text: str) -> tuple[str, dict, str]:
#     """
#     Call Groq and parse the JSON.
#     Returns (scoring_text, structured, markdown).
#     """
#     prompt = build_resume_prompt(clean_text)

#     resp = _client.chat.completions.create(
#         model="llama-3.3-70b-versatile",
#         messages=[{"role": "user", "content": prompt}],
#     )

#     content = resp.choices[0].message.content

#     try:
#         data = json.loads(content)
#     except Exception:
#         # fallback if model returns something non-JSON
#         return clean_text, {"raw_text": clean_text}, clean_text

#     markdown = data.get("markdown", "")
#     structured = data.get("structured", {})
#     scoring_text = data.get("scoring_text") or markdown or clean_text

#     return scoring_text, structured, markdown
#nlp-service/services/groq_client.py
import os, json, re
from groq import Groq

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in environment")

_client = Groq(api_key=GROQ_API_KEY)


# def build_resume_prompt(clean_text: str) -> str:
#     return f"""
# You are a resume parsing engine.

# You receive merged cleaned text extracted from a CV.
# You must return ONLY valid JSON in the following exact schema, with no markdown fences, no explanation:

# {{
#   "markdown": "string",
#   "structured": {{
#     "name": "string",
#     "address": "string",
#     "email": "string",
#     "phone": "string",
#     "summary": "string",
#     "skills": [ "skill1", "skill2" ],
#     "education": [{{"degree": "", "field": "", "institution": "", "from": "", "to": "", "currently": false}}],
#     "experience": [{{"title": "", "company": "", "from": "", "to": "", "currently": false, "description": ""}}],
#     "languages": [{{"language": "", "level": ""}}],
#     "certifications": [{{"name": "", "issuer": "", "date": ""}}],
#     "projects": [{{"name": "", "description": "", "technologies": [""], "link": ""}}],
#     "hobbies": "string"
#   }},
#   "scoring_text": "string"
# }}

# Rules:
# - Output JSON ONLY, starting with {{ and ending with }}.
# - No ```json``` fences.
# - No additional commentary.

# TEXT:
# -------------------------
# {clean_text}
# -------------------------
# """.strip()


def build_resume_prompt(clean_text: str) -> str:
    return f"""
You are a resume parsing engine.

You receive merged cleaned text extracted from a CV.
You must return ONLY valid JSON in the following exact schema, with no markdown fences, no explanation:

{{
  "markdown": "string",
  "structured": {{
    "name": "string",
    "address": "string",
    "email": "string",
    "phone": "string",
    "summary": "string",
    "skills": [ "skill1", "skill2" ],
    "education": [
      {{
        "degree": "",
        "field": "",
        "institution": "",
        "from": "",
        "to": "",
        "currently": false
      }}
    ],
    "experience": [
      {{
        "title": "",
        "company": "",
        "from": "",
        "to": "",
        "currently": false,
        "description": ""
      }}
    ],
    "languages": [
      {{
        "language": "",
        "level": ""
      }}
    ],
    "certifications": [
      {{
        "name": "",
        "issuer": "",
        "date": ""
      }}
    ],
    "projects": [
      {{
        "name": "",
        "description": "",
        "technologies": [""],
        "link": ""
      }}
    ],
    "hobbies": "string"
  }},
  "scoring_text": "string"
}}

CRITICAL RULES (DO NOT BREAK THEM):
- You MUST output JSON ONLY.
- JSON must begin with {{ and end with }}.
- DO NOT include ```json``` fences or any commentary.
- All fields must exist even if empty.

ADDITIONAL RULES FOR "markdown":
- Produce a CLEAN, FORMATTED resume using Markdown.
- Use H2 section headers (e.g., ## Summary, ## Experience).
- Group content clearly under the correct sections.
- Bullet points where appropriate.
- No raw OCR, no unnecessary symbols.

ADDITIONAL RULES FOR "scoring_text":
- Produce a clean, grouped, human-readable plaintext resume.
- Use uppercase section headers:
  SUMMARY, EDUCATION, EXPERIENCE, PROJECTS, SKILLS, CERTIFICATIONS, LANGUAGES, AWARDS, REFERENCES, OTHER
- Group items under appropriate sections.
- Normalize common variations:
  "Work History", "Employment", "Professional Experience" → EXPERIENCE
  "Academics", "Qualifications" → EDUCATION
  "Tools", "Tech Stack", "Expertise" → SKILLS
  "Awards", "Achievements" → AWARDS
- If a section does not exist, OMIT it.
- If an unknown section exists, include it under OTHER.
- DO NOT output JSON here—only plaintext inside the JSON string.
- DO NOT output raw OCR.

TEXT:
-------------------------
{clean_text}
-------------------------
""".strip()


def _extract_json_block(content: str) -> str:
    # drop code fences if present
    content = content.strip()
    if content.startswith("```"):
        parts = content.split("```")
        # take the part inside fences if available
        if len(parts) >= 2:
            content = parts[1].lstrip("json").strip()
    # get first {...last}
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1:
        return content[start:end + 1]
    return content


def parse_resume_with_groq(clean_text: str):
    prompt = build_resume_prompt(clean_text)

    resp = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )

    raw = resp.choices[0].message.content
    print("GROQ RAW RESPONSE (first 500 chars):", raw[:500])  # debug

    try:
        json_str = _extract_json_block(raw)
        data = json.loads(json_str)
    except Exception as e:
        # hard fallback – this is what you are seeing now
        print("JSON parse failed, fallback. Error:", e)
        return clean_text, {"raw_text": clean_text}, clean_text

    markdown = data.get("markdown", "")
    structured = data.get("structured", {})
    scoring_text = data.get("scoring_text") or markdown or clean_text

    return scoring_text, structured, markdown
