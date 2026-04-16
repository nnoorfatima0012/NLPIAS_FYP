# nlp-service/interview_routes.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from services.interview_service import generate_questions, evaluate_answer

router = APIRouter(prefix="/interview", tags=["interview"])


class GenerateQuestionsRequest(BaseModel):
    jobTitle: str
    jobDescription: str
    mustHaveSkills: List[str] = []
    niceToHaveSkills: List[str] = []
    candidateSkills: List[str] = []
    matchedSkills: List[str] = []
    missingSkills: List[str] = []
    weights: Dict[str, Any] = {}
    questionCount: int = 8
    jobRequirements: Dict[str, Any] = {}


class EvaluateAnswerRequest(BaseModel):
    question: str
    answer: str
    skill: Optional[str] = None
    jobTitle: Optional[str] = None
    jobDescription: Optional[str] = None
    mustHaveSkills: List[str] = []
    candidateSkills: List[str] = []
    meta: Dict[str, Any] = {}


@router.post("/generate-questions")
def generate(req: GenerateQuestionsRequest):
    try:
        return generate_questions(req.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/evaluate-answer")
def evaluate(req: EvaluateAnswerRequest):
    try:
        return evaluate_answer(req.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))