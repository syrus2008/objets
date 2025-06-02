# Festival Objets Perdus/Trouvés

Ce projet est une application web moderne pour la gestion des objets perdus et trouvés lors d’un festival. Elle propose un backend FastAPI et un frontend HTML/CSS/JS responsive.

## Fonctionnalités principales
- Signalement d’objets trouvés (avec photo, description, date/heure, détails)
- Signalement d’objets perdus (sans photo, description, date/heure estimée, détails)
- Association automatique entre objets perdus/trouvés (mots-clés + date)
- Liste publique des objets (filtre restitué)
- Marquage comme restitué (admin)
- Suppression (admin)
- Authentification admin simple (mot de passe : `thibaut7120`)
- Export JSON et CSV (Excel compatible)
- Stockage local : fichiers JSON et images dans `/backend/uploads`

## Structure du projet
```
backend/
  main.py           # API FastAPI
  models.py         # Modèles Pydantic
  storage.json      # Données objets
  uploads/          # Images objets trouvés
  requirements.txt  # Dépendances Python
  ...
frontend/
  index.html        # Page d’accueil
  signaler.html     # Formulaire signalement
  css/style.css     # Styles responsive
  js/script.js      # Logique frontend
Procfile            # Lancement Railway
railway.json        # Config Railway
start_server.py     # Lancement local
README.md           # Ce fichier
```

## Installation locale
1. **Installer les dépendances Python**
   ```bash
   pip install -r backend/requirements.txt
   ```
2. **Lancer le serveur**
   ```bash
   python start_server.py
   ```
3. **Accéder à l’application**
   - Frontend : Ouvrir `frontend/index.html` dans votre navigateur
   - API docs : http://localhost:8000/docs

## Déploiement Railway
1. Pousser le projet sur GitHub
2. Connecter le repo à Railway (https://railway.app/)
3. Railway détecte automatiquement `Procfile` et `requirements.txt`
4. Déploiement automatique (FastAPI sur le port `$PORT`)

## Configuration Railway
- `Procfile` :
  ```
  web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
  ```
- `railway.json` :
  ```json
  {
    "build": { "builder": "NIXPACKS", "buildCommand": "pip install -r backend/requirements.txt" },
    "deploy": { "startCommand": "uvicorn backend.main:app --host 0.0.0.0 --port $PORT" }
  }
  ```

## Sécurité admin
- Login admin : bouton en haut à droite
- Identifiant : `admin`
- Mot de passe : `thibaut7120`

## Notes
- Les images sont stockées dans `/backend/uploads` (non versionnées)
- Les objets restitués sont masqués par défaut
- Code compatible Windows/Linux/Mac

---

Pour toute question ou amélioration, ouvrez une issue sur le dépôt GitHub du projet.
