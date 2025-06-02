from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List

class FoundItem(BaseModel):
    id: Optional[str] = None
    description: str
    date_found: datetime
    photo_filename: str
    additional_info: Optional[str] = None
    status: str = "active"

class LostItem(BaseModel):
    id: Optional[str] = None
    description: str
    estimated_loss_date: datetime
    additional_info: Optional[str] = None
    status: str = "active"

class SearchResult(BaseModel):
    found_item: Optional[FoundItem] = None
    lost_item: Optional[LostItem] = None
    confidence: float = 0.0

class ExportFormat(str):
    JSON = "json"
    CSV = "csv"

class ExportParams(BaseModel):
    format: ExportFormat
    date_range: Optional[List[datetime]] = None
    status: Optional[str] = None
    type: Optional[str] = None
