.PHONY: api frontend up build

api:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev -- --host 0.0.0.0 --port 5173

up:
	docker compose up --build

build:
	cd frontend && npm run build
