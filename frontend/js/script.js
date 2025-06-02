// Configuration
const API_BASE_URL = 'http://localhost:8000';
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
const adminLoginModal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
const itemDetailsModal = new bootstrap.Modal(document.getElementById('itemDetailsModal'));
const exportJsonBtn = document.getElementById('exportJson');
const exportCsvBtn = document.getElementById('exportCsv');

// Current selected item
let currentItem = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
    setupEventListeners();
    checkAuth();
});

// Event Listeners
function setupEventListeners() {
    // Toggle returned items
    showReturnedFound.addEventListener('change', () => loadItems('found'));
    showReturnedLost.addEventListener('change', () => loadItems('lost'));
    
    // Admin login/logout
    adminLoginBtn.addEventListener('click', () => adminLoginModal.show());
    loginBtn.addEventListener('click', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Export buttons
    exportJsonBtn?.addEventListener('click', () => exportData('json'));
    exportCsvBtn?.addEventListener('click', () => exportData('csv'));
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
        const [foundResponse, lostResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/api/found`),
            fetch(`${API_BASE_URL}/api/lost`)
        ]);
        
        const foundData = await foundResponse.json();
        const lostData = await lostResponse.json();
        
        // Filter returned items based on checkbox state
        const showReturnedFoundValue = showReturnedFound.checked;
        const showReturnedLostValue = showReturnedLost.checked;
        
        const filteredFound = foundData.items.filter(item => showReturnedFoundValue || !item.returned);
        const filteredLost = lostData.items.filter(item => showReturnedLostValue || !item.returned);
        
        // Display items
        if (!type || type === 'found') {
            displayItems(filteredFound, foundItemsContainer, 'found');
        }
        
        if (!type || type === 'lost') {
            displayItems(filteredLost, lostItemsContainer, 'lost');
        }
    } catch (error) {
        console.error('Error loading items:', error);
        showNotification('Erreur lors du chargement des objets', 'danger');
    }
}

// Display Items
function displayItems(items, container, type) {
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    Aucun objet ${type === 'found' ? 'trouvé' : 'perdu'} pour le moment.
                </div>
            </div>`;
        return;
    }
    
    container.innerHTML = items.map(item => createItemCard(item, type)).join('');
    
    // Add event listeners to view buttons
    document.querySelectorAll(`.view-item-${type}`).forEach(btn => {
        btn.addEventListener('click', () => showItemDetails(btn.dataset.id, type));
    });
}

// Create Item Card
function createItemCard(item, type) {
    const isReturned = item.returned ? 'RESTITUÉ' : (type === 'found' ? 'TROUVÉ' : 'PERDU');
    const badgeClass = item.returned ? 'bg-secondary' : (type === 'found' ? 'bg-success' : 'bg-warning text-dark');
    const date = new Date(item.date).toLocaleString('fr-FR');
    
    return `
        <div class="col-md-6 col-lg-4 mb-4 fade-in">
            <div class="card item-card h-100">
                ${item.photo_path ? `
                    <img src="${API_BASE_URL}/${item.photo_path}" class="card-img-top" alt="${item.description}" 
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Image+non+disponible'">
                ` : `
                    <div class="text-center p-5 bg-light">
                        <i class="bi bi-image fs-1 text-muted"></i>
                        <p class="mt-2 mb-0 text-muted">Aucune image</p>
                    </div>
                `}
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">${item.description}</h5>
                        <span class="badge ${badgeClass}">${isReturned}</span>
                    </div>
                    <p class="card-text text-muted small mb-3">
                        <i class="bi bi-calendar3"></i> ${date}
                    </p>
                    <p class="card-text flex-grow-1">
                        ${item.details ? item.details.substring(0, 100) + (item.details.length > 100 ? '...' : '') : 'Aucun détail supplémentaire'}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <button class="btn btn-sm btn-outline-primary view-item-${type}" data-id="${item.id}">
                            <i class="bi bi-eye"></i> Voir les détails
                        </button>
                        ${isAdmin ? `
                            <div class="btn-group">
                                <button class="btn btn-sm btn-outline-success mark-returned" data-id="${item.id}" ${item.returned ? 'disabled' : ''}>
                                    <i class="bi bi-check-lg"></i> Restitué
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-item" data-id="${item.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Show Item Details
async function showItemDetails(itemId, type) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/items/${itemId}`);
        if (!response.ok) throw new Error('Item not found');
        
        const item = await response.json();
        currentItem = item;
        
        // Update modal content
        document.getElementById('itemModalTitle').textContent = item.description;
        document.getElementById('itemDescription').textContent = item.description;
        document.getElementById('itemDate').textContent = new Date(item.date).toLocaleString('fr-FR');
        document.getElementById('itemDetails').textContent = item.details || 'Aucun détail supplémentaire';
        
        // Update image
        const imgContainer = document.getElementById('itemImageContainer');
        const imgElement = document.getElementById('itemImage');
        
        if (item.photo_path) {
            imgElement.src = `${API_BASE_URL}/${item.photo_path}`;
            imgElement.style.display = 'block';
        } else {
            imgContainer.innerHTML = `
                <div class="text-center p-5 bg-light w-100">
                    <i class="bi bi-image fs-1 text-muted"></i>
                    <p class="mt-2 mb-0 text-muted">Aucune image disponible</p>
                </div>`;
        }
        
        // Update status badge
        const statusBadge = document.createElement('span');
        statusBadge.className = `badge ${item.returned ? 'bg-secondary' : (type === 'found' ? 'bg-success' : 'bg-warning text-dark')}`;
        statusBadge.textContent = item.returned ? 'RESTITUÉ' : (type === 'found' ? 'TROUVÉ' : 'PERDU');
        document.getElementById('itemStatus').innerHTML = '';
        document.getElementById('itemStatus').appendChild(statusBadge);
        
        // Show/hide admin actions
        document.getElementById('adminActions').style.display = isAdmin ? 'block' : 'none';
        
        // Setup action buttons
        document.getElementById('markReturnedBtn').onclick = () => markAsReturned(itemId);
        document.getElementById('deleteItemBtn').onclick = () => deleteItem(itemId);
        
        // Show modal
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

// Call initUI when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initUI);
