# Math Platform — Backend

FastAPI service powering the math platform: symbolic solving, explanations, OCR.

## Layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, router mounting, /health
│   ├── core/
│   │   └── config.py        # Settings from .env via pydantic-settings
│   ├── schemas/
│   │   └── solve.py         # Request/response Pydantic models
│   ├── services/
│   │   ├── preprocess.py    # Text → SymPy-friendly form
│   │   ├── solver.py        # Symbolic solving (eval-free, security-hardened)
│   │   ├── explainer.py     # Step-by-step explanation generation
│   │   └── ocr.py           # OCR provider abstraction (Pix2Text now, Mathpix in Phase 3)
│   └── routers/
│       ├── solve.py         # POST /solve
│       ├── explain.py       # POST /explain
│       └── ocr.py           # POST /image-ocr (multipart upload)
├── requirements.txt
└── .env.example
```

## Run locally

From the `backend/` directory:

```powershell
# 1. Activate the project's venv (one level up):
..\venv\Scripts\Activate.ps1

# 2. Install deps:
pip install -r requirements.txt

# 3. Copy env template and edit:
copy .env.example .env

# 4. Start the API:
uvicorn app.main:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs for the interactive Swagger UI.

## Endpoints (Phase 0)

| Method | Path          | Purpose                                     |
|--------|---------------|---------------------------------------------|
| GET    | `/health`     | Liveness probe                              |
| GET    | `/`           | Service metadata                            |
| POST   | `/solve`      | Symbolic solve → final answer + steps       |
| POST   | `/explain`    | Step-by-step explanation                    |
| POST   | `/image-ocr`  | Extract math text from an uploaded image    |

Auth routes (`/auth/signup`, `/auth/login`, `/auth/me`) land in Phase 1.
