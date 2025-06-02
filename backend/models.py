from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class ItemType(str, Enum):
    LOST = "lost"
    FOUND = "found"

class ItemBase(BaseModel):
    description: str
    date: datetime
    details: Optional[str] = None
    returned: bool = False

class LostItemCreate(ItemBase):
    contact: Optional[str] = None

class FoundItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: str
    type: ItemType
    photo_path: Optional[str] = None
    contact: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "type": "found",
                "description": "Portefeuille noir",
                "date": "2023-06-02T14:30:00",
                "details": "Contient des cartes de crédit et une pièce d'identité",
                "returned": False,
                "photo_path": "uploads/portefeuille.jpg",
                "created_at": "2023-06-02T15:00:00",
                "updated_at": "2023-06-02T15:00:00"
            }
        }
