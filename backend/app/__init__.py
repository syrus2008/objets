<<<<<<< HEAD
from .api import router as api_router
from .storage import Storage
from .auth import AuthManager

__all__ = ['api_router', 'Storage', 'AuthManager']

# Initialiser le stockage
storage = Storage()
=======
from api import api
from storage import Storage
from auth import AuthManager

__all__ = ['api', 'Storage', 'AuthManager']
>>>>>>> 4b6f3fc372f3cc88130fc9a515a05ef70f4d3d6f
