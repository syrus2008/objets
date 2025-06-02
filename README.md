# Système de Gestion des Objets Perdus et Trouvés pour Festivals

Un système web complet pour gérer les objets perdus et trouvés lors d'événements et festivals.

## Fonctionnalités

- Déclaration d'objets trouvés (avec photos)
- Déclaration d'objets perdus
- Association automatique entre objets perdus/trouvés
- Authentification admin pour gestion
- Export des données en JSON et CSV
- Interface responsive

## Installation Locale

1. Cloner le repository
2. Installer les dépendances Python :
```bash
pip install -r requirements.txt
```
3. Lancer le serveur :
```bash
python backend/start_server.py
```
4. Ouvrir le frontend dans votre navigateur :
```bash
python -m http.server 8000
```

## Déploiement sur Railway

1. Créer un compte sur Railway
2. Connecter votre repository
3. Déployer l'application
4. Configurer les variables d'environnement dans Railway :
   - ADMIN_USERNAME=admin
   - ADMIN_PASSWORD=votre_mot_de_passe_sécurisé
   - PORT=8000
   - STORAGE_PATH=storage/storage.json

## Structure du Projet

```
objetsperdu/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── models.py
│   │   ├── storage.py
│   │   └── utils.py
│   ├── storage/
│   │   └── storage.json
│   ├── uploads/
│   │   └── .gitkeep
│   └── start_server.py
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── auth.js
│       └── admin.js
├── Procfile
├── requirements.txt
├── .env.example
└── README.md

## Structure du Projet

```
objetsperdu/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api.py
│   │   ├── models.py
│   │   ├── storage.py
│   │   └── utils.py
│   ├── storage/
│   │   └── storage.json
│   ├── uploads/
│   └── start_server.py
└── frontend/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── main.js
        ├── auth.js
        └── utils.js
```

## Technologies Utilisées

- Backend : FastAPI
- Frontend : HTML5, CSS3, JavaScript
- Stockage : JSON local
- Authentification : Basic Auth

## Sécurité

- Authentification admin pour les opérations de gestion
- Protection des fichiers de configuration
- Validation des données côté serveur
- Gestion sécurisée des fichiers uploadés

## Contribuer

1. Fork le projet
2. Créez votre branche de fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Créez un Pull Request

## Licence

Ce projet est sous licence MIT.
