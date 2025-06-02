class AdminPanel {
    constructor() {
        this.usersList = document.createElement('div');
        this.usersList.className = 'admin-panel';
        this.usersList.style.display = 'none';
        document.body.appendChild(this.usersList);

        this.initUI();
        this.loadUsers();
    }

    initUI() {
        this.usersList.innerHTML = `
            <h2>Gestion des utilisateurs</h2>
            <div class="users-container"></div>
            <button id="refreshUsers">Rafraîchir</button>
        `;

        document.getElementById('refreshUsers').addEventListener('click', () => this.loadUsers());
    }

    async loadUsers() {
        try {
            const response = await fetch('/api/users', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des utilisateurs');
            }

            const users = await response.json();
            this.displayUsers(users);
        } catch (error) {
            console.error('Error:', error);
            alert('Erreur lors du chargement des utilisateurs');
        }
    }

    displayUsers(users) {
        const container = document.querySelector('.users-container');
        container.innerHTML = '';

        Object.entries(users).forEach(([username, userData]) => {
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <div class="user-info">
                    <h3>${username}</h3>
                    <p><strong>Rôle:</strong> ${userData.role}</p>
                    <p><strong>Créé le:</strong> ${new Date(userData.created_at).toLocaleString()}</p>
                </div>
                <div class="user-actions">
                    <select class="role-select" data-username="${username}">
                        <option value="user" ${userData.role === 'user' ? 'selected' : ''}>Utilisateur</option>
                        <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Administrateur</option>
                    </select>
                </div>
            `;
            container.appendChild(userCard);

            // Ajouter l'écouteur pour le changement de rôle
            const roleSelect = userCard.querySelector('.role-select');
            roleSelect.addEventListener('change', async (e) => {
                const newRole = e.target.value;
                const username = e.target.dataset.username;
                
                try {
                    const response = await fetch(`/api/users/${username}/role`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ role: newRole }),
                        credentials: 'include'
                    });

                    if (response.ok) {
                        alert(`Rôle de ${username} mis à jour avec succès`);
                    } else {
                        throw new Error('Erreur lors de la mise à jour du rôle');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Erreur lors de la mise à jour du rôle');
                }
            });
        });
    }

    show() {
        this.usersList.style.display = 'block';
    }

    hide() {
        this.usersList.style.display = 'none';
    }
}

// Vérifier si l'utilisateur est admin et afficher le bouton de gestion
async function checkAdminStatus() {
    try {
        const response = await fetch('/api/users', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const adminPanelBtn = document.createElement('button');
            adminPanelBtn.textContent = 'Gestion des utilisateurs';
            adminPanelBtn.style.cssText = 'margin-left: 1rem;';
            adminPanelBtn.addEventListener('click', () => {
                adminPanel.show();
            });
            document.querySelector('header').appendChild(adminPanelBtn);
        }
    } catch (error) {
        // L'utilisateur n'est pas admin
    }
}

// Ajouter le style pour le panneau d'administration
const style = document.createElement('style');
style.textContent = `
    .admin-panel {
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        position: fixed;
        top: 100px;
        right: 20px;
        width: 400px;
        z-index: 1000;
    }
    .users-container {
        margin-top: 1rem;
    }
    .user-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    .user-info h3 {
        margin: 0 0 0.5rem 0;
    }
    .user-actions {
        display: flex;
        gap: 1rem;
    }
    .role-select {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
    }
`;
document.head.appendChild(style);

// Initialiser le panneau d'administration
const adminPanel = new AdminPanel();
checkAdminStatus();
