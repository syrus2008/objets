import json
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import os
from models import FoundItem, LostItem, SearchResult

class Storage:
    def __init__(self, storage_path: str = "storage/storage.json"):
        self.storage_path = Path(storage_path)
        self.uploads_dir = Path("uploads")
        self.ensure_directories()
        self.data = self.load_data()

    def ensure_directories(self):
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        self.uploads_dir.mkdir(exist_ok=True)

    def load_data(self):
        if not self.storage_path.exists():
            return {"found": [], "lost": []}
        with open(self.storage_path, "r") as f:
            return json.load(f)

    def save_data(self):
        with open(self.storage_path, "w") as f:
            json.dump(self.data, f, default=str, indent=2)

    def add_found_item(self, item: FoundItem):
        item.id = str(len(self.data["found"]) + 1)
        self.data["found"].append(item.dict())
        self.save_data()
        return item

    def add_lost_item(self, item: LostItem):
        item.id = str(len(self.data["lost"]) + 1)
        self.data["lost"].append(item.dict())
        self.save_data()
        return item

    def get_found_items(self) -> List[FoundItem]:
        return [FoundItem(**item) for item in self.data["found"]]

    def get_lost_items(self) -> List[LostItem]:
        return [LostItem(**item) for item in self.data["lost"]]

    def get_item_by_id(self, item_id: str, item_type: str) -> Optional[dict]:
        items = self.data["found"] if item_type == "found" else self.data["lost"]
        return next((item for item in items if item["id"] == item_id), None)

    def update_item_status(self, item_id: str, item_type: str, status: str):
        items = self.data["found"] if item_type == "found" else self.data["lost"]
        for item in items:
            if item["id"] == item_id:
                item["status"] = status
                break
        self.save_data()

    def search_matching_items(self) -> List[SearchResult]:
        results = []
        for found in self.data["found"]:
            for lost in self.data["lost"]:
                # Simple matching based on description and date
                if found["status"] == "active" and lost["status"] == "active":
                    confidence = self.calculate_match_confidence(found, lost)
                    if confidence > 0.5:
                        results.append({
                            "found_item": found,
                            "lost_item": lost,
                            "confidence": confidence
                        })
        return results

    def calculate_match_confidence(self, found: dict, lost: dict) -> float:
        # Simple matching based on description and date
        desc_match = 1.0 if found["description"] == lost["description"] else 0.0
        date_diff = abs((found["date_found"] - lost["estimated_loss_date"]).total_seconds())
        max_date_diff = 86400  # 24 hours
        date_match = max(0, 1 - (date_diff / max_date_diff))
        return (desc_match + date_match) / 2
