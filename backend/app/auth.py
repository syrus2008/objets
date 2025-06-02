from fastapi import HTTPException
from passlib.context import CryptContext
import json
from pathlib import Path
import os
from datetime import datetime

class AuthManager:
    def __init__(self, users_file: str = "users.json"):
        self.users_file = Path(users_file)
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.ensure_users_file()

    def ensure_users_file(self):
        if not self.users_file.exists():
            # Créer l'admin par défaut
            users = {
                "admin": {
                    "hashed_password": self.hash_password("admin"),
                    "role": "admin",
                    "created_at": datetime.now().isoformat()
                }
            }
            with open(self.users_file, "w") as f:
                json.dump(users, f, indent=2)

    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_user(self, username: str) -> dict:
        with open(self.users_file, "r") as f:
            users = json.load(f)
        return users.get(username)

    def create_user(self, username: str, password: str):
        if self.get_user(username):
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_password = self.hash_password(password)
        
        with open(self.users_file, "r") as f:
            users = json.load(f)
        
        users[username] = {
            "hashed_password": hashed_password,
            "role": "user",
            "created_at": datetime.now().isoformat()
        }
        
        with open(self.users_file, "w") as f:
            json.dump(users, f, indent=2)

    def verify_credentials(self, username: str, password: str) -> bool:
        user = self.get_user(username)
        if not user:
            return False
        return self.verify_password(password, user["hashed_password"])

    def generate_session_token(self, username: str) -> str:
        return f"session_{username}_{datetime.now().timestamp()}"

    def validate_session(self, token: str) -> str:
        if not token.startswith("session_"):
            return None
        
        parts = token.split("_")
        if len(parts) != 3:
            return None
        
        username = parts[1]
        if self.get_user(username):
            return username
        return None

    def get_user_role(self, username: str) -> str:
        user = self.get_user(username)
        return user.get("role", "user") if user else "user"

    def update_user_role(self, username: str, role: str, admin_username: str):
        # Seul un admin peut modifier les rôles
        if self.get_user_role(admin_username) != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
        
        user = self.get_user(username)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        if role not in ["user", "admin"]:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        with open(self.users_file, "r") as f:
            users = json.load(f)
        
        users[username]["role"] = role
        
        with open(self.users_file, "w") as f:
            json.dump(users, f, indent=2)

    def is_admin(self, username: str) -> bool:
        return self.get_user_role(username) == "admin"

    def ensure_users_file(self):
        if not self.users_file.exists():
            with open(self.users_file, "w") as f:
                json.dump({}, f)

    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)

    def get_user(self, username: str) -> dict:
        with open(self.users_file, "r") as f:
            users = json.load(f)
        return users.get(username)

    def create_user(self, username: str, password: str):
        if self.get_user(username):
            raise HTTPException(status_code=400, detail="Username already registered")
        
        hashed_password = self.hash_password(password)
        
        with open(self.users_file, "r") as f:
            users = json.load(f)
        
        users[username] = {
            "hashed_password": hashed_password,
            "created_at": datetime.now().isoformat()
        }
        
        with open(self.users_file, "w") as f:
            json.dump(users, f, indent=2)

    def verify_credentials(self, username: str, password: str) -> bool:
        user = self.get_user(username)
        if not user:
            return False
        return self.verify_password(password, user["hashed_password"])

    def generate_session_token(self, username: str) -> str:
        return f"session_{username}_{datetime.now().timestamp()}"

    def validate_session(self, token: str) -> str:
        # Pour une implémentation plus robuste, utiliser Redis ou une base de données
        # Ici, on fait une validation simple basée sur le format du token
        if not token.startswith("session_"):
            return None
        
        parts = token.split("_")
        if len(parts) != 3:
            return None
        
        username = parts[1]
        if self.get_user(username):
            return username
        return None
