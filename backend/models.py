from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class FoundItem(BaseModel):
    id: Optional[int]
    description: str
    location: str
    found_date: datetime
    image_path: Optional[str]
    contact_email: EmailStr
    status: str = "active"

class LostItem(BaseModel):
    id: Optional[int]
    description: str
    location: str
    lost_date: datetime
    contact_email: EmailStr
    status: str = "active"

class SearchResult(BaseModel):
    found_items: List[FoundItem]
    lost_items: List[LostItem]

class ExportParams(BaseModel):
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    location: Optional[str]
    status: Optional[str]
