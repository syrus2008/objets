import os
import sys
from dotenv import load_dotenv
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import List
from fastapi.staticfiles import StaticFiles

# Ajouter le dossier parent au PATH Python
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Charger les variables d'environnement
load_dotenv()

# Créer le dossier de stockage s'il n'existe pas
STORAGE_PATH = os.getenv("STORAGE_PATH", "storage/storage.json")
storage_dir = os.path.dirname(STORAGE_PATH)
if storage_dir and not os.path.exists(storage_dir):
    os.makedirs(storage_dir)

# Créer l'application
app = FastAPI(title="Festival Lost & Found API")

# Configurer CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serveur statique pour le frontend
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir), name="frontend")

# Inclure les routes de l'API
from .app import api_router
app.include_router(api_router, prefix="/api")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.start_server:app", host="0.0.0.0", port=port, reload=True)
