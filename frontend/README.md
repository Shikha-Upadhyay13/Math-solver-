# Math Platform — Frontend

Next.js 16 (App Router) + React 19 + Tailwind v4 + KaTeX.

## Routes

| Path         | Auth     | Purpose                                                    |
|--------------|----------|------------------------------------------------------------|
| `/`          | public   | Landing page                                               |
| `/login`     | public   | Sign in with email + password                              |
| `/signup`    | public   | Create an account                                          |
| `/dashboard` | required | Welcome dashboard, account snapshot                        |
| `/solve`     | public   | Solver — text, image, voice modes                          |

## Quick start

```powershell
# Install deps (already done by create-next-app)
npm install

# Copy env template, fill in API URL
copy .env.local.example .env.local

# Start dev server
npm run dev
```

Open http://localhost:3000.

The frontend talks to the FastAPI backend at `NEXT_PUBLIC_API_URL`
(default `http://127.0.0.1:8000`). Make sure the backend is running
(`uvicorn app.main:app --reload` inside `backend/`).

## Layout

```
src/
├── app/
│   ├── layout.tsx        # root layout, providers, navbar, footer
│   ├── page.tsx          # landing
│   ├── globals.css       # Tailwind + design tokens + KaTeX
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── dashboard/page.tsx
│   └── solve/page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── MathRender.tsx    # KaTeX renderer
├── contexts/
│   └── AuthContext.tsx   # JWT auth state via localStorage
└── lib/
    ├── config.ts         # env vars
    ├── api.ts            # fetch wrapper with Bearer auth
    ├── auth.ts           # localStorage helpers
    └── speech.ts         # spoken-math → SymPy normalizer
```

## Auth

JWT stored in localStorage on signup/login. The `<AuthProvider>` hydrates
the cached user on mount and verifies the token by calling `/auth/me`. If
the token is invalid/expired, the cached user is cleared and the user
falls back to the public state.

This will move to httpOnly cookies in Phase 8 (production hardening).
