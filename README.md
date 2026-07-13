# GEST — Group Expense Splitting Tool

A Splitwise-style app for tracking shared expenses within a group, splitting them equally/exactly/by percentage, and settling up. Built end-to-end (backend, database, frontend) as a full-stack learning project.

## Features

- [x] User authentication (register/login, JWT)
- [x] Create and join groups, with ownership transfer and membership management
- [x] Add expenses with equal / exact / percentage splitting
- [x] View per-group balances
- [x] Debt simplification (minimizes number of settling transactions)
- [x] Record settlements (manual or from a suggestion), with full history
- [x] Delete groups / leave groups, gated on being fully settled up

## Tech stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic
- **Database**: PostgreSQL (via Docker Compose)
- **Auth**: JWT (python-jose + passlib/bcrypt)

## Architecture

```
React (frontend/) → REST API (backend/, FastAPI) → PostgreSQL (Docker)
```

## Project structure

```
backend/
  app/
    api/routes/     # FastAPI route handlers (auth, groups, expenses, balances, settlements)
    core/           # config, security (JWT, password hashing)
    db/             # SQLAlchemy engine/session setup
    models/         # SQLAlchemy ORM models
    schemas/        # Pydantic request/response schemas
    services/       # business logic (split calculation, balance/debt-simplification, group helpers)
  alembic/          # database migrations
frontend/
  src/
    api/            # typed API client functions per resource
    context/        # AuthContext (session state)
    components/     # shared components (ProtectedRoute)
    pages/          # route-level pages
```

## Running locally

Requires Docker Desktop, Python 3.11+, and Node 18+.

1. Start Postgres:
   ```
   docker compose up -d db
   ```
2. Start the backend:
   ```
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1   # Windows
   pip install -r requirements.txt
   cp .env.example .env
   alembic upgrade head
   uvicorn app.main:app --reload
   ```
3. Start the frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Visit `http://localhost:5173`. API docs are at `http://localhost:8000/docs`.

## License
MIT — see [LICENSE](LICENSE)
