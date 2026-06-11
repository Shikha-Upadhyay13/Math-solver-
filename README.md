# Math Platform

A production-grade math platform: **type, upload, or speak** a math problem and get a direct answer plus a step-by-step explanation.

> Currently under active rebuild — see [Roadmap](#roadmap). The repo started as a single-file FastAPI prototype and is being upgraded into a real product.

## Architecture

```
math-project/
├── backend/            # FastAPI + SymPy API (Phase 0 — done)
│   └── app/
│       ├── main.py
│       ├── core/       # config, security (Phase 1)
│       ├── schemas/    # Pydantic request/response models
│       ├── services/   # preprocess, solver, explainer, ocr
│       └── routers/    # /solve, /explain, /image-ocr, /auth (Phase 1)
├── frontend/           # Next.js + Tailwind app (Phase 2 — not yet)
├── legacy-frontend/    # Original vanilla HTML/JS prototype (kept for reference)
└── README.md
```

## Quick start

### Backend

```powershell
cd backend
..\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env       # edit JWT_SECRET etc.
uvicorn app.main:app --reload --port 8000
```

Then open **http://127.0.0.1:8000/docs**.

### Legacy frontend (until Phase 2)

Open `legacy-frontend/index.html` in a browser. It talks to the backend on `http://127.0.0.1:8000`.

## Tech stack

| Layer       | Choice                                                |
|-------------|-------------------------------------------------------|
| Frontend    | Next.js 14 + React + Tailwind + KaTeX                 |
| Backend     | FastAPI + SymPy                                       |
| OCR         | Mathpix (primary, Phase 3) / Pix2Text (fallback)      |
| LLM         | Anthropic Claude / OpenAI (Phases 4 & 5)              |
| Auth        | SQLite + SQLAlchemy + JWT + bcrypt                    |
| Deployment  | Docker + Render/Vercel (Phase 8)                      |

## Roadmap

| Phase | Status     | Scope                                                                 |
|-------|------------|-----------------------------------------------------------------------|
| 0     | ✅ Done    | Restructure, security fixes (eval → ast.literal_eval), CORS lockdown |
| 1     | 🟡 Next    | Signup / login / JWT / user DB                                       |
| 2     | ⏳         | Next.js frontend: landing, auth, dashboard, solver                   |
| 3     | ⏳         | OCR v2 — Mathpix integration with confidence + edit-before-solve UX  |
| 4     | ⏳         | Math engine v2 — geometry, statistics, ODEs, word-problem bridge     |
| 5     | ⏳         | LLM-grounded step-by-step explanations                               |
| 6     | ⏳         | Voice input v2 — robust speech-to-math, multi-language               |
| 7     | ⏳         | History, dashboard, profile, export to PDF                           |
| 8     | ⏳         | Production hardening — rate limiting, logging, tests, Docker         |

## License

Proprietary, all rights reserved.
