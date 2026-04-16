
import re
from typing import List

SKILL_ALIASES = {
    "react": ["react", "reactjs", "react.js", "react js"],
    "node": ["node", "nodejs", "node.js", "node js"],
    "express": ["express", "expressjs", "express.js", "express js"],
    "javascript": ["javascript", "js", "java script"],
    "typescript": ["typescript", "ts", "type script"],
    "mongodb": ["mongodb", "mongo db", "mongo"],
    "mysql": ["mysql", "my sql"],
    "postgresql": ["postgresql", "postgres", "postgre sql"],
    "html": ["html", "html5"],
    "css": ["css", "css3"],
    "rest api": ["rest api", "restful api", "restful apis", "api development"],
    "git": ["git", "github", "git/github", "git and github"],
    "docker": ["docker"],
    "python": ["python"],
    "java": ["java"],
    "c++": ["c++", "cpp"],
    "machine learning": ["machine learning", "ml"],
    "nlp": ["nlp", "natural language processing"],
}

TITLE_ALIASES = {
    "web developer": [
        "web developer", "frontend developer", "front end developer",
        "backend developer", "full stack developer", "software engineer",
        "software developer", "mern developer", "react developer"
    ],
    "data entry": [
        "data entry", "data entry operator", "office clerk",
        "clerk", "computer operator"
    ],
}


def _clean_text(value: str) -> str:
    value = (value or "").strip().lower()
    value = value.replace("&", " and ")
    value = re.sub(r"[\._\-\/]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def canonicalize_skill(value: str) -> str:
    v = _clean_text(value)
    for canon, aliases in SKILL_ALIASES.items():
        if v == canon or v in aliases:
            return canon
    return v


def canonicalize_title(value: str) -> str:
    v = _clean_text(value)
    for canon, aliases in TITLE_ALIASES.items():
        if v == canon or v in aliases:
            return canon
    return v


def normalize_skill_list(skills: List[str]) -> List[str]:
    seen = set()
    out = []
    for s in skills or []:
        c = canonicalize_skill(s)
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out