# Personal AI Seller Hub

Private AI-powered seller operations hub for Amazon and Flipkart.

## Backend

The backend is built with Python 3.12+, FastAPI, SQLAlchemy, and Alembic.

```bash
cd backend
python -m venv .venv
# activate the virtual environment
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Health check: `GET /health`
API status: `GET /api/v1/status`

Configuration is supplied through environment variables; see `.env.example`.
