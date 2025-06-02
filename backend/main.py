import os
import json
import shutil
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import hashlib
import secrets
from pathlib import Path

from models import Item, LostItemCreate, FoundItemCreate, ItemType

# Configuration
UPLOAD_FOLDER = "uploads"
DATA_FILE = "storage.json"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD_HASH = hashlib.sha256("thibaut7120".encode()).hexdigest()  # In production, use environment variables

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize FastAPI
app = FastAPI(title="Objets Perdus - Festival API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBasic()

def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(
        hashlib.sha256(credentials.password.encode()).hexdigest(),
        ADMIN_PASSWORD_HASH
    )
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

# Helper functions
def load_data() -> dict:
    if not os.path.exists(DATA_FILE):
        return {"items": []}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def save_data(data: dict):
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)

def find_matching_items(item: dict) -> List[dict]:
    data = load_data()
    target_type = "lost" if item["type"] == "found" else "found"
    
    # Simple keyword matching (in a real app, you'd want something more sophisticated)
    keywords = set(word.lower() for word in item["description"].split() if len(word) > 3)
    
    matches = []
    for stored_item in data["items"]:
        if stored_item["type"] == target_type and not stored_item.get("returned", False):
            # Check if any keyword matches
            stored_desc = stored_item["description"].lower()
            if any(keyword in stored_desc for keyword in keywords):
                matches.append(stored_item)
    
    return matches

# Auth route
@app.post("/api/auth/login")
def login(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, ADMIN_USERNAME)
    correct_password = secrets.compare_digest(
        hashlib.sha256(credentials.password.encode()).hexdigest(),
        ADMIN_PASSWORD_HASH
    )
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return {"message": "Authenticated"}

# API Routes
@app.post("/api/found")
async def create_found_item(
    description: str = Form(...),
    date: str = Form(...),
    details: str = Form(None),
    photo: UploadFile = File(...)
):
    # Save photo
    file_ext = Path(photo.filename).suffix
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)
    
    # Create item
    item = {
        "id": str(uuid.uuid4()),
        "type": "found",
        "description": description,
        "date": date,
        "details": details,
        "photo_path": file_path,
        "returned": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Save to storage
    data = load_data()
    data["items"].append(item)
    save_data(data)
    
    # Find potential matches
    matches = find_matching_items(item)
    
    return {"item": item, "matches": matches}

@app.post("/api/lost")
async def create_lost_item(
    description: str = Form(...),
    date: str = Form(...),
    details: str = Form(None)
):
    # Create item
    item = {
        "id": str(uuid.uuid4()),
        "type": "lost",
        "description": description,
        "date": date,
        "details": details,
        "returned": False,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Save to storage
    data = load_data()
    data["items"].append(item)
    save_data(data)
    
    # Find potential matches
    matches = find_matching_items(item)
    
    return {"item": item, "matches": matches}

@app.get("/api/found")
async def get_found_items(returned: bool = None):
    data = load_data()
    items = [item for item in data["items"] if item["type"] == "found"]
    
    if returned is not None:
        items = [item for item in items if item.get("returned", False) == returned]
    
    return {"items": items}

@app.get("/api/lost")
async def get_lost_items(returned: bool = None):
    data = load_data()
    items = [item for item in data["items"] if item["type"] == "lost"]
    
    if returned is not None:
        items = [item for item in items if item.get("returned", False) == returned]
    
    return {"items": items}

@app.get("/api/items/{item_id}")
async def get_item(item_id: str):
    data = load_data()
    for item in data["items"]:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.patch("/api/items/{item_id}/return")
async def mark_as_returned(item_id: str, username: str = Depends(get_current_username)):
    data = load_data()
    for item in data["items"]:
        if item["id"] == item_id:
            item["returned"] = True
            item["updated_at"] = datetime.utcnow().isoformat()
            save_data(data)
            return {"status": "success", "message": "Item marked as returned"}
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/api/items/{item_id}")
async def delete_item(item_id: str, username: str = Depends(get_current_username)):
    data = load_data()
    for i, item in enumerate(data["items"]):
        if item["id"] == item_id:
            # Delete associated photo if exists
            if "photo_path" in item and item["photo_path"]:
                try:
                    os.remove(item["photo_path"])
                except OSError:
                    pass
            
            # Remove item from list
            del data["items"][i]
            save_data(data)
            return {"status": "success", "message": "Item deleted"}
    
    raise HTTPException(status_code=404, detail="Item not found")

@app.get("/api/export/json")
async def export_json(returned: bool = None):
    data = load_data()
    if returned is not None:
        data["items"] = [item for item in data["items"] if item.get("returned", False) == returned]
    return JSONResponse(content=data, media_type="application/json")

@app.get("/api/export/csv")
async def export_csv(returned: bool = None):
    import csv
    from io import StringIO
    
    data = load_data()
    items = data["items"]
    
    if returned is not None:
        items = [item for item in items if item.get("returned", False) == returned]
    
    output = StringIO()
    if items:
        fieldnames = list(items[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(items)
    
    return {"csv": output.getvalue()}

# Serve uploaded files
@app.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
