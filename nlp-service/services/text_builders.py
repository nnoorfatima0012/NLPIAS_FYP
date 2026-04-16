# # nlp-service/services/text_builders.py
# import re
# from typing import Dict, Any


# def build_job_text(job: Dict[str, Any]) -> str:
#     """
#     Convert your Job Mongo document into a single text string for SBERT.
#     """
#     title = job.get("title") or ""
#     desc = job.get("description") or ""
#     skills = job.get("skillsRequired", []) or []
#     exp = job.get("experience") or ""
#     qualification = job.get("qualification") or ""
#     location = job.get("location") or ""
#     career_level = job.get("careerLevel") or ""

#     # strip HTML from description
#     desc_clean = re.sub(r"<[^>]+>", " ", desc)

#     return (
#         f"JOB TITLE: {title}\n"
#         f"DESCRIPTION: {desc_clean}\n"
#         f"REQUIRED SKILLS: {', '.join(skills)}\n"
#         f"EXPERIENCE: {exp}\n"
#         f"QUALIFICATION: {qualification}\n"
#         f"CAREER LEVEL: {career_level}\n"
#         f"LOCATION: {location}\n"
#     )


# def build_resume_text(resume_doc: Dict[str, Any]) -> str:
#     """
#     Use your stored scoringText from processed resume.
#     """
#     return resume_doc.get("scoringText") or ""

import re
from typing import Dict, Any


def build_job_text(job: Dict[str, Any]) -> str:
    title = job.get("title") or ""
    desc = job.get("description") or ""
    skills = job.get("skillsRequired", []) or []
    exp = job.get("experience") or ""
    qualification = job.get("qualification") or ""
    location = job.get("location") or ""
    career_level = job.get("careerLevel") or ""

    desc_clean = re.sub(r"<[^>]+>", " ", desc)

    return (
        f"JOB TITLE: {title}\n"
        f"DESCRIPTION: {desc_clean}\n"
        f"REQUIRED SKILLS: {', '.join(skills)}\n"
        f"EXPERIENCE: {exp}\n"
        f"QUALIFICATION: {qualification}\n"
        f"CAREER LEVEL: {career_level}\n"
        f"LOCATION: {location}\n"
    )


def build_resume_text(resume_doc: Dict[str, Any]) -> str:
    scoring = resume_doc.get("scoringText") or ""
    structured = resume_doc.get("structured") or {}

    skills = ", ".join(structured.get("skills", []) or [])

    projects = " ".join([
        f"{p.get('name','')} {p.get('description','')} {' '.join(p.get('technologies', []) or [])}"
        for p in (structured.get("projects", []) or [])
    ])

    experience = " ".join([
        f"{e.get('title','') or e.get('jobTitle','')} {e.get('description','')}"
        for e in (structured.get("experience", []) or [])
    ])

    combined = f"{scoring}\nSKILLS: {skills}\nPROJECTS: {projects}\nEXPERIENCE: {experience}"
    return combined.strip()