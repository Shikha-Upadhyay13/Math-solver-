from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import explain, ocr, solve

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Production-grade math platform API. "
        "Accepts text, image, or voice-derived math input and returns "
        "answers plus step-by-step explanations."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(solve.router)
app.include_router(explain.router)
app.include_router(ocr.router)


@app.get("/health", tags=["meta"])
def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
    }


@app.get("/", tags=["meta"])
def root():
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "health": "/health",
    }
