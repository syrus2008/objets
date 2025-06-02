import json
from typing import List, Optional
from datetime import datetime
from models import FoundItem, LostItem, ExportParams
from storage import Storage

def export_to_csv(storage: Storage, params: ExportParams) -> dict:
    found_items = storage.get_found_items()
    lost_items = storage.get_lost_items()

    # Filtrer selon les paramètres
    if params.date_range:
        found_items = [item for item in found_items 
                      if params.date_range[0] <= item.date_found <= params.date_range[1]]
        lost_items = [item for item in lost_items 
                     if params.date_range[0] <= item.estimated_loss_date <= params.date_range[1]]

    if params.status:
        found_items = [item for item in found_items if item.status == params.status]
        lost_items = [item for item in lost_items if item.status == params.status]

    # Préparer les données pour le CSV
    data = []
    for item in found_items:
        data.append({
            "id": item.id,
            "type": "trouvé",
            "description": item.description,
            "date": item.date_found.isoformat(),
            "status": item.status,
            "additional_info": item.additional_info,
            "photo_filename": item.photo_filename
        })

    for item in lost_items:
        data.append({
            "id": item.id,
            "type": "perdu",
            "description": item.description,
            "date": item.estimated_loss_date.isoformat(),
            "status": item.status,
            "additional_info": item.additional_info
        })

    # Créer le CSV
    filename = f"objets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    with open(filename, 'w', encoding='utf-8') as f:
        # Écrire l'en-tête
        f.write("id,type,description,date,status,additional_info,photo_filename\n")
        # Écrire les données
        for row in data:
            f.write(",".join([
                str(row["id"]),
                row["type"],
                row["description"].replace(",", "").replace("\n", " "),
                row["date"],
                row["status"],
                row["additional_info"].replace(",", "").replace("\n", " ") if row["additional_info"] else "",
                row.get("photo_filename", "")
            ]) + "\n")
    
    return {"filename": filename}

def export_to_json(storage: Storage, params: ExportParams) -> dict:
    found_items = storage.get_found_items()
    lost_items = storage.get_lost_items()

    # Filtrer selon les paramètres
    if params.date_range:
        found_items = [item for item in found_items 
                      if params.date_range[0] <= item.date_found <= params.date_range[1]]
        lost_items = [item for item in lost_items 
                     if params.date_range[0] <= item.estimated_loss_date <= params.date_range[1]]

    if params.status:
        found_items = [item for item in found_items if item.status == params.status]
        lost_items = [item for item in lost_items if item.status == params.status]

    # Préparer les données
    data = []
    for item in found_items:
        data.append({
            "id": item.id,
            "type": "trouvé",
            "description": item.description,
            "date": item.date_found.isoformat(),
            "status": item.status,
            "additional_info": item.additional_info,
            "photo_filename": item.photo_filename
        })

    for item in lost_items:
        data.append({
            "id": item.id,
            "type": "perdu",
            "description": item.description,
            "date": item.estimated_loss_date.isoformat(),
            "status": item.status,
            "additional_info": item.additional_info
        })

    # Créer le JSON
    filename = f"objets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return {"filename": filename}
