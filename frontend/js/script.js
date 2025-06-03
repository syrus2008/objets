// Configuration
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : "https://objets-objects2.up.railway.app";
let isAdmin = false;

// DOM Elements
const foundItemsContainer = document.getElementById('foundItems');
const lostItemsContainer = document.getElementById('lostItems');
const showReturnedFound = document.getElementById('showReturnedFound');
const showReturnedLost = document.getElementById('showReturnedLost');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminDropdown = document.getElementById('adminDropdown');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
let adminLoginModal = null;
let itemDetailsModal = null;
const exportJsonBtn = document.getElementById('exportJson');
const exportCsvBtn = document.getElementById('exportCsv');

// Current selected item
let currentItem = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Bootstrap modals after DOM is loaded
    const adminLoginModalElem = document.getElementById('adminLoginModal');
    if (adminLoginModalElem) {
        try {
            adminLoginModal = new bootstrap.Modal(adminLoginModalElem);
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du modal adminLogin:', error);
        }
    } else {
        console.warn('adminLoginModal element not found - probablement pas sur la page principale');
    }
    
    const itemDetailsModalElem = document.getElementById('itemDetailsModal');
    if (itemDetailsModalElem) {
        try {
            itemDetailsModal = new bootstrap.Modal(itemDetailsModalElem);
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du modal itemDetails:', error);
        }
    } else {
        console.warn('itemDetailsModal element not found - probablement pas sur la page principale');
    }
    
    // Initialisations à effectuer uniquement sur les pages concernées
    if (foundItemsContainer || lostItemsContainer) {
        loadItems(); // Charger les items uniquement si on est sur une page qui les affiche
    }
    
    setupEventListeners();
    checkAuth();
});

// Event Listeners
function setupEventListeners() {
    // Toggle returned items
    showReturnedFound?.addEventListener('change', () => loadItems('found'));
    showReturnedLost?.addEventListener('change', () => loadItems('lost'));
    
    // Admin login/logout
    adminLoginBtn?.addEventListener('click', () => {
        if (adminLoginModal) {
            adminLoginModal.show();
        } else {
            console.warn('adminLoginModal n\'est pas disponible');
        }
    });
    loginBtn?.addEventListener('click', handleLogin);
    logoutBtn?.addEventListener('click', handleLogout);
    passwordInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Export buttons
    exportJsonBtn?.addEventListener('click', () => exportData('json'));
    exportCsvBtn?.addEventListener('click', () => exportData('csv'));
}

// Export Data
async function exportData(type) {
    if (!isAdmin) {
        showNotification('Vous devez être connecté en tant qu\'administrateur', 'warning');
        return;
    }
    
    try {
        // Récupérer toutes les données
        const [foundResponse, lostResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/found`),
            fetch(`${API_BASE_URL}/api/lost`)
        ]);
        
        const foundData = await foundResponse.json();
        const lostData = await lostResponse.json();
        
        // Combiner les items
        const items = [...foundData.items, ...lostData.items];
        
        if (type === 'json') {
            // Export JSON
            const dataStr = JSON.stringify(items, null, 2);
            downloadFile(dataStr, 'objets-perdus-trouves.json', 'application/json');
        } else if (type === 'csv') {
            // Export CSV avec champs dynamiques
            exportToCsv(items);
        }
        
        showNotification(`Export en ${type.toUpperCase()} réussi`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Erreur lors de l\'exportation des données', 'danger');
    }
}

function exportToCsv(items) {
    // Construire dynamiquement la liste des champs
    const fieldsSet = new Set();
    
    // Collecter tous les champs possibles de tous les objets
    items.forEach(item => {
        Object.keys(item).forEach(key => fieldsSet.add(key));
    });
    
    const fields = Array.from(fieldsSet);
    
    // Créer l'entête CSV
    let csv = fields.join(',') + '\n';
    
    // Ajouter les lignes
    items.forEach(item => {
        const values = fields.map(field => {
            const value = item[field] || '';
            // Gérer les valeurs qui contiennent des virgules ou des guillemets
            return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                ? `"${value.replace(/"/g, '""')}"` 
                : value;
        });
        csv += values.join(',') + '\n';
    });
    
    downloadFile(csv, 'objets-perdus-trouves.csv', 'text/csv;charset=utf-8');
}

function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}

// Authentication
async function checkAuth() {
    // In a real app, you would verify the token with the server
    isAdmin = localStorage.getItem('isAdmin') === 'true';
    updateUIBasedOnAuth();
}

function updateUIBasedOnAuth() {
    if (isAdmin) {
        adminLoginBtn.style.display = 'none';
        adminDropdown.style.display = 'block';
    } else {
        adminLoginBtn.style.display = 'block';
        adminDropdown.style.display = 'none';
    }
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
        // In a real app, you would make an API call to verify credentials
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(`${username}:${password}`)
            }
        });
        
        if (response.ok) {
            isAdmin = true;
            localStorage.setItem('isAdmin', 'true');
            updateUIBasedOnAuth();
            adminLoginModal.hide();
            loadItems();
        } else {
            showError('Identifiants incorrects');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Erreur de connexion');
    }
}

function handleLogout() {
    isAdmin = false;
    localStorage.removeItem('isAdmin');
    updateUIBasedOnAuth();
    loadItems();
}

function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('d-none');
    setTimeout(() => {
        loginError.classList.add('d-none');
    }, 3000);
}

// Load Items
async function loadItems(type = null) {
    try {
        const showReturnedFoundChecked = showReturnedFound?.checked ?? false;
        const showReturnedLostChecked = showReturnedLost?.checked ?? false;
        
        // Vérifier si les conteneurs existent sur cette page
        const shouldLoadFound = foundItemsContainer !== null && (type === 'found' || type === null);
        const shouldLoadLost = lostItemsContainer !== null && (type === 'lost' || type === null);
        
        // Préparer les promesses à exécuter
        const promises = [];
        const results = {};
        
        if (shouldLoadFound) {
            promises.push(
                fetch(`${API_BASE_URL}/api/found`)
                    .then(response => response.json())
                    .then(data => { results.foundData = data; })
            );
        }
        
        if (shouldLoadLost) {
            promises.push(
                fetch(`${API_BASE_URL}/api/lost`)
                    .then(response => response.json())
                    .then(data => { results.lostData = data; })
            );
        }
        
        if (promises.length === 0) {
            return; // Aucun conteneur n'existe sur cette page
        }
        
        await Promise.all(promises);
        
        // Traiter les résultats
        if (shouldLoadFound && results.foundData) {
            const filteredFoundItems = results.foundData.items.filter(item => showReturnedFoundChecked || !item.returned);
            displayItems(filteredFoundItems, foundItemsContainer, 'found');
        }
        
        if (shouldLoadLost && results.lostData) {
            const filteredLostItems = results.lostData.items.filter(item => showReturnedLostChecked || !item.returned);
            displayItems(filteredLostItems, lostItemsContainer, 'lost');
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showNotification('Erreur lors du chargement des objets', 'danger');
    }
}

// Display Items
function displayItems(items, container, type) {
    // Vérifier que le conteneur existe
    if (!container) {
        console.warn(`Conteneur pour les objets ${type} introuvable`);
        return;
    }
    
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i> Aucun objet ${type === 'lost' ? 'perdu' : 'trouvé'} pour le moment.
            </div>
        `;
        return;
    }
    
    const row = document.createElement('div');
    row.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
    
    items.forEach(item => {
        const card = createItemCard(item, type);
        row.appendChild(card);
    });
    
    container.appendChild(row);
}

// Create Item Card
function createItemCard(item, type) {
    const isReturned = item.returned ? 'RESTITUÉ' : (type === 'found' ? 'TROUVÉ' : 'PERDU');
    const badgeClass = item.returned ? 'bg-secondary' : (type === 'found' ? 'bg-success' : 'bg-warning text-dark');
    const date = new Date(item.date).toLocaleString('fr-FR');
    
    // Créer un élément DOM
    const colDiv = document.createElement('div');
    colDiv.className = 'col mb-4';
    
    // Construire le contenu de la carte
    colDiv.innerHTML = `
        <div class="card h-100">
            ${item.photo_path ? `
                <img src="${API_BASE_URL}/${item.photo_path}" class="card-img-top" alt="${item.description}" 
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+non+disponible'">
            ` : `
                <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style="height: 200px;">
                    <i class="bi ${type === 'found' ? 'bi-check-circle' : 'bi-search'} text-${type === 'found' ? 'success' : 'warning'}" style="font-size: 3rem;"></i>
                </div>
            `}
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0">${item.description}</h5>
                    <span class="badge ${badgeClass}">${isReturned}</span>
                </div>
                <p class="card-text">
                    <small><i class="bi bi-calendar"></i> ${date}</small>
                </p>
                <button class="btn btn-sm btn-outline-primary view-item-${type}" data-id="${item.id}">
                    <i class="bi bi-eye"></i> Voir détails
                </button>
            </div>
        </div>
    `;
    
    // Ajouter l'event listener pour le bouton de détails
    const viewButton = colDiv.querySelector(`.view-item-${type}`);
    if (viewButton) {
        viewButton.addEventListener('click', function() {
            if (typeof showItemDetails === 'function') {
                showItemDetails(this.getAttribute('data-id'), type);
            }
        });
    }
    
    return colDiv;
}

// Show Item Details
async function showItemDetails(itemId, type) {
    // Vérifier que le modal est disponible
    if (!itemDetailsModal) {
        console.warn('itemDetailsModal n\'est pas disponible sur cette page');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`);
        if (!response.ok) throw new Error('Failed to fetch item details');
        
        const item = await response.json();
        
        // Vérifier l'existence des éléments DOM avant de les manipuler
        const itemDetailsTitle = document.getElementById('itemDetailsTitle');
        const itemDetailsDescription = document.getElementById('itemDetailsDescription'); 
        const itemDetailsDate = document.getElementById('itemDetailsDate');
        const itemDetailsStatus = document.getElementById('itemDetailsStatus');
        const contactElement = document.getElementById('itemDetailsContact');
        const contactRow = document.getElementById('contactRow');
        const markReturnedBtn = document.getElementById('markReturnedBtn');
        const deleteItemBtn = document.getElementById('deleteItemBtn');
        
        // Mettre à jour le contenu seulement si les éléments existent
        if (itemDetailsTitle) itemDetailsTitle.textContent = type === 'found' ? 'Objet trouvé' : 'Objet perdu';
        if (itemDetailsDescription) itemDetailsDescription.textContent = item.description;
        if (itemDetailsDate) itemDetailsDate.textContent = new Date(item.date).toLocaleString('fr-FR');
        
        if (itemDetailsStatus) {
            itemDetailsStatus.textContent = item.returned ? 'Restitué' : 'Non restitué';
            itemDetailsStatus.className = `badge ${item.returned ? 'bg-secondary' : 'bg-primary'}`;
        }
        
        // Afficher les infos de contact si disponibles
        if (contactElement && contactRow) {
            if (item.contact) {
                contactElement.textContent = item.contact;
                contactRow.style.display = 'flex';
            } else {
                contactRow.style.display = 'none';
            }
        }
        
        // Configurer les boutons d'action s'ils existent
        if (markReturnedBtn) markReturnedBtn.onclick = () => markAsReturned(itemId);
        if (deleteItemBtn) deleteItemBtn.onclick = () => deleteItem(itemId);
        
        // Afficher le modal
        itemDetailsModal.show();
        
    } catch (error) {
        console.error('Error fetching item details:', error);
        showNotification('Erreur lors du chargement des détails', 'danger');
    }
}

// Mark Item as Returned
async function markAsReturned(itemId) {
    if (!confirm('Marquer cet objet comme restitué ?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/items/${itemId}/return`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            showNotification('Objet marqué comme restitué avec succès', 'success');
            loadItems();
            itemDetailsModal.hide();
        } else {
            throw new Error('Failed to mark as returned');
        }
    } catch (error) {
        console.error('Error marking item as returned:', error);
        showNotification('Erreur lors de la mise à jour', 'danger');
    }
}

// Delete Item
async function deleteItem(itemId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet objet ? Cette action est irréversible.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });
        
        if (response.ok) {
            showNotification('Objet supprimé avec succès', 'success');
            loadItems();
            itemDetailsModal.hide();
        } else {
            throw new Error('Failed to delete item');
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showNotification('Erreur lors de la suppression', 'danger');
    }
}

// Export Data
function exportData(format) {
    const url = `${API_BASE_URL}/api/export/${format}`;
    
    if (format === 'json') {
        // For JSON, we can open in a new tab
        window.open(url, '_blank');
    } else if (format === 'csv') {
        // For CSV, we need to trigger a download
        const link = document.createElement('a');
        link.href = url;
        link.download = `objets-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alert.role = 'alert';
    alert.style.zIndex = '9999';
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize popovers
function initPopovers() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

// Initialize all UI components
function initUI() {
    initTooltips();
    initPopovers();
}

// Call initUI when the DOM is fully loaded - moved to main DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', function() {
    initUI();
});
