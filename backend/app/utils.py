import pandas as pd
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

    # Créer les DataFrames
    found_df = pd.DataFrame([item.dict() for item in found_items])
    lost_df = pd.DataFrame([item.dict() for item in lost_items])

    # Ajouter une colonne de type
    found_df["type"] = "trouvé"
    lost_df["type"] = "perdu"

    # Concaténer les DataFrames
    combined_df = pd.concat([found_df, lost_df], ignore_index=True)

    # Convertir les dates en format lisible
    combined_df["date"] = combined_df.apply(
        lambda row: row["date_found"] if row["type"] == "trouvé" else row["estimated_loss_date"],
        axis=1
    )

    # Sélectionner les colonnes pertinentes
    columns = ["id", "type", "description", "date", "status", "additional_info"]
    if "photo_filename" in combined_df.columns:
        columns.append("photo_filename")

    # Exporter en CSV
    filename = f"objets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    combined_df[columns].to_csv(filename, index=False, encoding="utf-8", sep=",")
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

    # Ajouter le type à chaque élément
    found_items = [{**item.dict(), "type": "trouvé"} for item in found_items]
    lost_items = [{**item.dict(), "type": "perdu"} for item in lost_items]

    # Combiner les listes
    combined_items = found_items + lost_items

    # Exporter en JSON
    filename = f"objets_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(combined_items, f, ensure_ascii=False, indent=2, default=str)
    return {"filename": filename}
