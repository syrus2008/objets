from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import List
import uvicorn
import os
import sys
from dotenv import load_dotenv

# Ajouter le dossier backend au PATH Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api import api
from app.storage import Storage

# Charger les variables d'environnement
load_dotenv()

app = FastAPI(title="Festival Lost & Found API")
app.include_router(api.router, prefix="/api")

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
