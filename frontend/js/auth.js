document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est déjà authentifié
    const isAuthenticated = () => {
        const token = document.cookie.replace(/(?:(?:^|.*;)\s*session_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        return token !== '';
    };

    // Afficher la modal d'authentification
    const showAuthModal = () => {
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-content">
                <div class="auth-tabs">
                    <button class="tab-btn active" data-tab="login">Connexion</button>
                    <button class="tab-btn" data-tab="register">Inscription</button>
                </div>
                <div class="auth-forms">
                    <form id="loginForm" class="auth-form active">
                        <h2>Connexion</h2>
                        <div class="form-group">
                            <label for="loginUsername">Nom d'utilisateur</label>
                            <input type="text" id="loginUsername" required>
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Mot de passe</label>
                            <input type="password" id="loginPassword" required>
                        </div>
                        <button type="submit">Se connecter</button>
                    </form>
                    <form id="registerForm" class="auth-form">
                        <h2>Inscription</h2>
                        <div class="form-group">
                            <label for="registerUsername">Nom d'utilisateur</label>
                            <input type="text" id="registerUsername" required>
                        </div>
                        <div class="form-group">
                            <label for="registerPassword">Mot de passe</label>
                            <input type="password" id="registerPassword" required>
                        </div>
                        <button type="submit">S'inscrire</button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Gérer les onglets
        const tabBtns = modal.querySelectorAll('.tab-btn');
        const forms = modal.querySelectorAll('.auth-form');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                tabBtns.forEach(b => b.classList.toggle('active', b === btn));
                forms.forEach(f => f.classList.toggle('active', f.id === `${tab}Form`));
            });
        });
    };

    // Gérer la soumission du formulaire d'inscription
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
                // Changer automatiquement vers le formulaire de connexion
                document.querySelector('.tab-btn[data-tab="login"]').click();
            } else {
                alert('Erreur lors de l\'inscription');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de l\'inscription');
        }
    });

    // Gérer la soumission du formulaire de connexion
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                document.cookie = `session_token=${data.token}; path=/; SameSite=Lax`;
                document.querySelector('.auth-modal').remove();
            } else {
                alert('Identifiants incorrects');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de la connexion');
        }
    });

    // Gérer la déconnexion
    const logout = async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            document.cookie = 'session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
            showAuthModal();
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors de la déconnexion');
        }
    };

    // Ajouter un bouton de déconnexion dans le header
    const header = document.querySelector('header');
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Déconnexion';
    logoutBtn.style.cssText = 'margin-left: 1rem;';
    logoutBtn.addEventListener('click', logout);
    header.appendChild(logoutBtn);

    // Vérifier l'authentification au chargement
    if (!isAuthenticated()) {
        showAuthModal();
    }

    // Styles pour la modal d'authentification
    const style = document.createElement('style');
    style.textContent = `
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        .auth-content {
            background-color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 400px;
            width: 90%;
        }
        .auth-tabs {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        .tab-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            cursor: pointer;
            background-color: white;
        }
        .tab-btn.active {
            background-color: #3498db;
            color: white;
            border-color: #3498db;
        }
        .auth-forms {
            position: relative;
        }
        .auth-form {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        .auth-form.active {
            opacity: 1;
            pointer-events: all;
        }
        .auth-form h2 {
            margin-bottom: 1rem;
            text-align: center;
        }
        .auth-form .form-group {
            margin-bottom: 1rem;
        }
        .auth-form label {
            display: block;
            margin-bottom: 0.5rem;
        }
        .auth-form input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .auth-form button {
            width: 100%;
            padding: 0.5rem;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .auth-form button:hover {
            background-color: #2980b9;
        }
    `;
    document.head.appendChild(style);
});
