
# Objets Perdus - Festival

Ce site permet de référencer les objets perdus et trouvés lors de festivals.

## Structure du projet

- `/backend` : contient l'API FastAPI, les fichiers JSON (`found.json`, `lost.json`), et les images dans `/uploads`.
- `/frontend` : interface utilisateur en HTML/CSS/JS.

## Lancement local

1. Assurez-vous d'avoir Python 3.9+ et `fastapi`, `uvicorn`, `python-multipart` installés.
2. Allez dans le dossier backend :
```bash
cd backend
python start_server.py
```
3. Ouvrez `frontend/index.html` dans votre navigateur.
