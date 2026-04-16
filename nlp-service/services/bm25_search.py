

# nlp-service/services/bm25_search.py
import re
from bs4 import BeautifulSoup
from rank_bm25 import BM25Okapi
from typing import List, Dict, Any

def html_to_text(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "lxml")
    return soup.get_text(" ", strip=True)

_token_re = re.compile(r"[a-zA-Z0-9]+")

def tokenize(text: str):
    return _token_re.findall((text or "").lower())

def build_doc(job: dict) -> str:
    parts = []
    title = job.get("title", "")
    # weight title a bit by repeating
    parts.append(title)
    parts.append(title)

    parts.append(html_to_text(job.get("description", "")))

    skills = job.get("skillsRequired") or []
    if isinstance(skills, list):
        parts.append(" ".join(skills))

    parts.append(job.get("companyName", ""))
    parts.append(job.get("workArrangement", ""))
    parts.append(job.get("jobLocation", ""))
    parts.append(job.get("remoteLocation", ""))

    return " ".join([p for p in parts if p])

def bm25_rank(query: str, jobs: list[dict]):
    if not jobs:
        return []
    
    docs = [build_doc(j) for j in jobs]
    tokens = [tokenize(d) for d in docs]
    bm25 = BM25Okapi(tokens)

    q_tokens = tokenize(query)
    if len(q_tokens) == 0:
        return []
    
    scores = bm25.get_scores(q_tokens)

    ranked = sorted(
        zip(jobs, scores),
        key=lambda x: float(x[1]),
        reverse=True
    )

    # Only keep jobs with score > 0 (optional)
    # out = [{"id": j["id"], "score": float(s)} for j, s in ranked if float(s) > 0]
    out = [{"id": j["id"], "score": float(s)} 
           for j, s in ranked 
        #    if float(s) > 0
           ]

    return out
