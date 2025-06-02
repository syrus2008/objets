
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from uuid import uuid4
import json, os, shutil
from datetime import datetime
from difflib import SequenceMatcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_LOST = "backend/lost.json"
DATA_FOUND = "backend/found.json"
UPLOAD_DIR = "backend/uploads"
ADMIN_PASSWORD = "festival2025"

os.makedirs(UPLOAD_DIR, exist_ok=True)

class LostItem(BaseModel):
    id: str
    description: str
    datetime: str
    content: Optional[str] = ""
    matches: Optional[List[str]] = []

class FoundItem(BaseModel):
    id: str
    description: str
    datetime: str
    content: Optional[str] = ""
    image_url: str

def load_data(path):
    if not os.path.exists(path):
        with open(path, "w") as f: json.dump([], f)
    with open(path, "r") as f:
        return json.load(f)

def save_data(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def similar(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

@app.get("/api/found", response_model=List[FoundItem])
def get_found():
    return load_data(DATA_FOUND)

@app.get("/api/lost", response_model=List[LostItem])
def get_lost():
    return load_data(DATA_LOST)

@app.post("/api/found")
async def post_found(description: str = Form(...), datetime: str = Form(...),
                     content: str = Form(""), file: UploadFile = File(...)):
    item_id = str(uuid4())
    filename = f"{item_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_url = f"/uploads/{filename}"
    item = {
        "id": item_id,
        "description": description,
        "datetime": datetime,
        "content": content,
        "image_url": image_url
    }
    data = load_data(DATA_FOUND)
    data.append(item)
    save_data(DATA_FOUND, data)
    return {"status": "success", "item": item}

@app.post("/api/lost")
def post_lost(item: LostItem):
    item.id = str(uuid4())
    data = load_data(DATA_LOST)
    found_items = load_data(DATA_FOUND)
    matches = []
    for f in found_items:
        if similar(f["description"], item.description) > 0.5:
            time_diff = abs(datetime.fromisoformat(item.datetime) - datetime.fromisoformat(f["datetime"]))
            if time_diff.days <= 2:
                matches.append(f["id"])
    item.matches = matches
    data.append(item.dict())
    save_data(DATA_LOST, data)
    return {"status": "success", "item": item.dict()}

@app.get("/uploads/{filename}")
def get_image(filename: str):
    path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)

@app.delete("/api/found/{item_id}")
def delete_found(item_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    data = load_data(DATA_FOUND)
    data = [d for d in data if d["id"] != item_id]
    save_data(DATA_FOUND, data)
    return {"status": "deleted"}

@app.delete("/api/lost/{item_id}")
def delete_lost(item_id: str, password: str):
    if password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Unauthorized")
    data = load_data(DATA_LOST)
    data = [d for d in data if d["id"] != item_id]
    save_data(DATA_LOST, data)
    return {"status": "deleted"}
