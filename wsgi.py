from fastapi import FastAPI
from uvicorn import run

from backend.start_server import app

if __name__ == "__main__":
    run("wsgi:app", host="0.0.0.0", port=8000, reload=True)
