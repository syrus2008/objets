from fastapi import APIRouter, HTTPException, Depends, File, UploadFile, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from typing import List, Optional
import os
from datetime import datetime
from models import FoundItem, LostItem, SearchResult, ExportParams
from storage import Storage
from utils import export_to_csv, export_to_json
from auth import AuthManager

router = APIRouter()
storage = Storage()
auth_manager = AuthManager()

# Fonction de vérification de session
async def get_current_user(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    username = auth_manager.validate_session(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid session")
    return username

# Fonction de vérification d'admin
async def is_admin(user: str = Depends(get_current_user)):
    return auth_manager.is_admin(user)

# Endpoint pour lister les utilisateurs
@router.get("/users")
async def list_users(user: str = Depends(is_admin)):
    with open("users.json", "r") as f:
        users = json.load(f)
    # Ne pas exposer les mots de passe
    return {
        username: {
            "role": user_data["role"],
            "created_at": user_data["created_at"]
        }
        for username, user_data in users.items()
    }

# Endpoint pour mettre à jour le rôle d'un utilisateur
@router.post("/users/{username}/role")
async def update_user_role(
    username: str,
    role: str,
    current_user: str = Depends(is_admin)
):
    try:
        auth_manager.update_user_role(username, role, current_user)
        return {"message": f"Role of {username} updated to {role}"}
    except HTTPException as e:
        raise e

router = APIRouter()
storage = Storage()
security = HTTPBasic()

# Fonction d'authentification
async def get_current_username(credentials: HTTPBasicCredentials = Depends(security)):
    from dotenv import load_dotenv
    load_dotenv()
    correct_username = os.getenv("ADMIN_USERNAME", "admin")
    correct_password = os.getenv("ADMIN_PASSWORD", "")
    if not (credentials.username == correct_username and credentials.password == correct_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@router.post("/register")
async def register_user(username: str, password: str):
    try:
        auth_manager.create_user(username, password)
        return {"message": "User registered successfully"}
    except HTTPException as e:
        raise e

@router.post("/login")
async def login(username: str, password: str):
    if auth_manager.verify_credentials(username, password):
        token = auth_manager.generate_session_token(username)
        return {
            "token": token,
            "message": "Login successful"
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/logout")
async def logout(user: str = Depends(get_current_user)):
    # Pour une implémentation plus robuste, invalider le token dans Redis
    return {"message": "Logged out successfully"}

@router.post("/found", response_model=FoundItem)
async def declare_found_item(
    description: str,
    date_found: datetime,
    additional_info: Optional[str] = None,
    photo: UploadFile = File(...),
    user: str = Depends(get_current_user)
):
    # Sauvegarder la photo
    photo_path = os.path.join("uploads", f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{photo.filename}")
    with open(photo_path, "wb") as buffer:
        content = await photo.read()
        buffer.write(content)
    
    item = FoundItem(
        description=description,
        date_found=date_found,
        photo_filename=photo_path,
        additional_info=additional_info
    )
    return storage.add_found_item(item)

@router.post("/lost", response_model=LostItem)
async def declare_lost_item(
    description: str,
    estimated_loss_date: datetime,
    additional_info: Optional[str] = None
):
    item = LostItem(
        description=description,
        estimated_loss_date=estimated_loss_date,
        additional_info=additional_info
    )
    return storage.add_lost_item(item)

@router.get("/found", response_model=List[FoundItem])
async def get_found_items():
    return storage.get_found_items()

@router.get("/lost", response_model=List[LostItem])
async def get_lost_items():
    return storage.get_lost_items()

@router.get("/uploads/{filename}")
async def get_upload(filename: str):
    path = os.path.join("uploads", filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)

@router.post("/mark_as_returned/{item_id}/{item_type}")
async def mark_as_returned(
    item_id: str,
    item_type: str,
    user: str = Depends(is_admin)
):
    if item_type not in ["found", "lost"]:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    storage.update_item_status(item_id, item_type, "returned")
    return {"message": "Item marked as returned"}

@router.post("/export")
async def export_data(
    params: ExportParams,
    username: str = Depends(get_current_username)
):
    if params.format == "csv":
        return export_to_csv(storage, params)
    else:
        return export_to_json(storage, params)

@router.get("/matches", response_model=List[SearchResult])
async def find_matches():
    return storage.search_matching_items()
