.PHONY: help install seed run-backend run-frontend test docker-up docker-down

help:
	@echo "VayuIndex Build & Execution Commands:"
	@echo "  make install       - Install backend and frontend dependencies"
	@echo "  make seed          - Seed database with 45+ days of historical data"
	@echo "  make run-backend   - Start FastAPI backend dev server"
	@echo "  make run-frontend  - Start Vite React frontend dev server"
	@echo "  make test          - Run backend pytest unit test suite"
	@echo "  make docker-up     - Launch full stack via Docker Compose"
	@echo "  make docker-down   - Stop Docker Compose services"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

seed:
	cd backend && python -m app.seed

run-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

run-frontend:
	cd frontend && npm run dev

test:
	cd backend && python -m pytest

docker-up:
	docker compose up --build

docker-down:
	docker compose down
