from fastapi import APIRouter

from app.schemas.solve import Question
from app.services.preprocess import preprocess_input
from app.services.solver import solve as solve_text

router = APIRouter(tags=["solve"])


@router.post("/solve")
def solve_endpoint(q: Question):
    return solve_text(preprocess_input(q.text))
