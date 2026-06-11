from fastapi import APIRouter

from app.schemas.solve import Question
from app.services.preprocess import preprocess_input
from app.services.explainer import explain as explain_text

router = APIRouter(tags=["explain"])


@router.post("/explain")
def explain_endpoint(q: Question):
    return explain_text(preprocess_input(q.text))
