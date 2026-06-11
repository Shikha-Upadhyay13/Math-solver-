from typing import Any, Optional, Union
from pydantic import BaseModel, Field


class Question(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class SolveStep(BaseModel):
    step: str
    explanation: str


class SolveResponse(BaseModel):
    operation: Optional[str] = None
    method: Optional[str] = None
    steps: Optional[Union[list[str], list[SolveStep]]] = None
    final_answer: Optional[Any] = None
    variables: Optional[list[str]] = None
    error: Optional[str] = None
    details: Optional[str] = None
    hint: Optional[str] = None
