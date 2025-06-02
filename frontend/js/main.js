document.addEventListener('DOMContentLoaded', () => {
    let cameraStream = null;
    const cameraPreview = document.getElementById('cameraPreview');
    const takePhotoBtn = document.getElementById('takePhoto');
    const foundPhotoInput = document.getElementById('foundPhoto');

    // Gestion de la caméra
    async function startCamera() {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = cameraStream;
            video.setAttribute('playsinline', true);
            video.play();
            cameraPreview.innerHTML = '';
            cameraPreview.appendChild(video);
            cameraPreview.classList.add('active');
            takePhotoBtn.textContent = 'Prendre la photo';
        } catch (err) {
            console.error('Erreur de caméra:', err);
            alert('Impossible d\'accéder à la caméra');
        }
    }

    async function takePhoto() {
        if (!cameraStream) {
            await startCamera();
            return;
        }

        const video = cameraPreview.querySelector('video');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        // Convertir en fichier
        canvas.toBlob((blob) => {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.files = [file];
            foundPhotoInput.files = fileInput.files;
            
            // Arrêter la caméra
            cameraStream.getTracks().forEach(track => track.stop());
            cameraPreview.innerHTML = '';
            cameraPreview.classList.remove('active');
            takePhotoBtn.textContent = 'Prendre une photo';
        }, 'image/jpeg');
    }

    takePhotoBtn.addEventListener('click', takePhoto);
    const foundBtn = document.getElementById('foundBtn');
    const lostBtn = document.getElementById('lostBtn');
    const listBtn = document.getElementById('listBtn');
    const matchesBtn = document.getElementById('matchesBtn');
    const foundForm = document.getElementById('foundForm');
    const lostForm = document.getElementById('lostForm');
    const listSection = document.getElementById('listSection');
    const matchesSection = document.getElementById('matchesSection');
    const exportBtn = document.getElementById('exportBtn');

    // Gestion des boutons de navigation
    foundBtn.addEventListener('click', () => showSection(foundForm));
    lostBtn.addEventListener('click', () => showSection(lostForm));
    listBtn.addEventListener('click', () => showSection(listSection));
    matchesBtn.addEventListener('click', () => showSection(matchesSection));

    // Formulaire d'objet trouvé
    document.getElementById('foundItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await fetch('/api/found', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert('Objet trouvé déclaré avec succès !');
            e.target.reset();
        } else {
            alert('Erreur lors de la déclaration');
        }
    });

    // Formulaire d'objet perdu
    document.getElementById('lostItemForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const response = await fetch('/api/lost', {
            method: 'POST',
            body: formData
        });
        if (response.ok) {
            alert('Objet perdu déclaré avec succès !');
            e.target.reset();
        } else {
            alert('Erreur lors de la déclaration');
        }
    });

    // Filtrage et recherche
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchInput');
    const itemsList = document.getElementById('itemsList');

    async function loadItems() {
        const response = await fetch('/api/found');
        const foundItems = await response.json();
        
        const response2 = await fetch('/api/lost');
        const lostItems = await response2.json();

        displayItems([...foundItems, ...lostItems]);
    }

    function displayItems(items) {
        itemsList.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            
            if (item.type === 'trouvé') {
                card.innerHTML = `
                    <h3>Objet trouvé</h3>
                    <img src="/uploads/${item.photo_filename}" alt="Objet trouvé">
                    <p><strong>Description:</strong> ${item.description}</p>
                    <p><strong>Date trouvée:</strong> ${new Date(item.date_found).toLocaleString()}</p>
                    ${item.additional_info ? `<p><strong>Informations:</strong> ${item.additional_info}</p>` : ''}
                    <button onclick="markAsReturned('${item.id}', 'found')">Marquer comme restitué</button>
                `;
            } else {
                card.innerHTML = `
                    <h3>Objet perdu</h3>
                    <p><strong>Description:</strong> ${item.description}</p>
                    <p><strong>Date estimée:</strong> ${new Date(item.estimated_loss_date).toLocaleString()}</p>
                    ${item.additional_info ? `<p><strong>Informations:</strong> ${item.additional_info}</p>` : ''}
                    <button onclick="markAsReturned('${item.id}', 'lost')">Marquer comme restitué</button>
                `;
            }
            itemsList.appendChild(card);
        });
    }

    // Chargement initial des items
    loadItems();

    // Export des données
    exportBtn.addEventListener('click', async () => {
        const params = {
            format: 'csv',
            date_range: null,
            status: statusFilter.value,
            type: typeFilter.value
        };
        
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
        
        if (response.ok) {
            const data = await response.json();
            window.location.href = `/uploads/${data.filename}`;
        }
    });

    // Associations possibles
    async function loadMatches() {
        const response = await fetch('/api/matches');
        const matches = await response.json();
        
        const matchesList = document.getElementById('matchesList');
        matchesList.innerHTML = '';
        
        matches.forEach(match => {
            const matchCard = document.createElement('div');
            matchCard.className = 'item-card';
            matchCard.innerHTML = `
                <h3>Association possible (${(match.confidence * 100).toFixed(1)}%)</h3>
                <div class="match-pair">
                    <div class="match-item">
                        <h4>Objet trouvé</h4>
                        <img src="/uploads/${match.found_item.photo_filename}" alt="Objet trouvé">
                        <p>${match.found_item.description}</p>
                    </div>
                    <div class="match-item">
                        <h4>Objet perdu</h4>
                        <p>${match.lost_item.description}</p>
                    </div>
                </div>
                <button onclick="markAsReturned('${match.found_item.id}', 'found')">Marquer comme restitué</button>
            `;
            matchesList.appendChild(matchCard);
        });
    }

    // Chargement initial des matches
    loadMatches();
});

function showSection(section) {
    const sections = document.querySelectorAll('.form-section, .list-section, .matches-section');
    sections.forEach(s => s.classList.add('hidden'));
    section.classList.remove('hidden');
}

async function markAsReturned(itemId, itemType) {
    try {
        const response = await fetch(`/api/mark_as_returned/${itemId}/${itemType}`, {
            method: 'POST',
            credentials: 'include' // Inclure les cookies pour l'authentification
        });
        
        if (response.ok) {
            alert('Objet marqué comme restitué');
            window.location.reload();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur lors de la mise à jour');
    }
}
