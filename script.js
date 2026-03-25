// script.js
let PHONE_NUMBER = '5518991578073'; 

// --- LOGIN LOGIC ---
function checkLogin() {
    // Busca qualquer indício de sessão persistente para clientes
    const savedUser = localStorage.getItem('moveis_client_user');
    const isGuest = localStorage.getItem('moveis_guest');
    const isAdmin = sessionStorage.getItem('moveis_admin_mode');

    // Se existe um usuário salvo, garante que a sessão esteja ativa
    if (savedUser && !localStorage.getItem('moveis_session_active')) {
        localStorage.setItem('moveis_session_active', 'true');
    }

    const hasSession = localStorage.getItem('moveis_session_active');
    
    if (isAdmin) {
        document.getElementById('adminTopBar').style.display = 'block';
        if(document.getElementById('chatWidget')) document.getElementById('chatWidget').style.display = 'none';
    } else {
        if(document.getElementById('adminTopBar')) document.getElementById('adminTopBar').style.display = 'none';
        if(document.getElementById('chatWidget')) {
            document.getElementById('chatWidget').style.display = 'flex';
            document.getElementById('chatWidget').style.zIndex = '500';
        }
    }

    if(!hasSession && !isAdmin && !isGuest) {
        document.getElementById('loginOverlay').style.display = 'flex';
        showLoginStep('Initial');
        document.body.style.overflow = 'hidden';
    } else {
        document.getElementById('loginOverlay').style.display = 'none';
        document.body.style.overflow = '';
        
        const user = getLoggedUser();
        const icon = document.getElementById('headerProfileIcon');
        const img = document.getElementById('headerProfileImg');
        if(user && user.photo && img && icon) {
            img.src = user.photo;
            img.style.display = 'block';
            icon.style.display = 'none';
        } else if(img && icon) {
            img.style.display = 'none';
            icon.style.display = 'block';
        }
    }
}

window.showLoginStep = function(step) {
    const steps = ['Initial', '1', '2'];
    steps.forEach(s => {
        const el = document.getElementById('loginStep' + s);
        if(el) el.style.display = 'none';
    });
    const target = document.getElementById('loginStep' + step);
    if(target) target.style.display = 'block';
}

let tempUserObj = null;
let currentVerificationCode = "";

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const location = document.getElementById('loginLocation') ? document.getElementById('loginLocation').value.trim() : '';
    
    if(!name) { alert('Por favor, informe seu nome.'); return; }
    
    tempUserObj = { name, email, location };
    
    const photoInput = document.getElementById('loginPhoto');
    if(photoInput && photoInput.files && photoInput.files[0]) {
        compressImage(photoInput.files[0], 400, (b64) => {
            tempUserObj.photo = b64;
            finishLogin(tempUserObj);
        });
    } else {
        const oldUser = getLoggedUser();
        if(oldUser && oldUser.photo) tempUserObj.photo = oldUser.photo;
        finishLogin(tempUserObj);
    }
});

function finishLogin(userObj) {
    // Garante que cada nova identificação tenha um canal de chat único
    const newClientId = 'client_' + Date.now() + Math.random().toString(36).substr(2, 5);
    localStorage.setItem('client_id', newClientId);
    
    localStorage.setItem('moveis_client_user', JSON.stringify(userObj));
    localStorage.setItem('moveis_session_active', 'true');
    localStorage.removeItem('moveis_guest');
    
    // Força o chat a recarregar para o novo ID
    if(window.loadChatHistory) window.loadChatHistory();
    
    checkLogin();
}

window.enterAsGuest = function() {
    localStorage.setItem('moveis_session_active', 'true');
    localStorage.setItem('moveis_guest', 'true');
    checkLogin();
}

window.enterAsAdmin = function() {
    const pass = prompt("Digite a senha do administrador:");
    if (pass === 'sacodejujubas') {
        sessionStorage.setItem('moveis_admin_mode', 'true');
        sessionStorage.setItem('moveis_admin_auth', 'true'); // Também autoriza o acesso ao admin.html
        sessionStorage.removeItem('moveis_guest');
        sessionStorage.removeItem('moveis_session_active');
        document.getElementById('loginOverlay').style.display = 'none';
        document.body.style.overflow = '';
        checkLogin();
        alert("Modo administrador ativado com sucesso!");
    } else if (pass !== null) {
        alert("Senha incorreta!");
    }
}

window.simulateClient = function() {
    sessionStorage.removeItem('moveis_admin_mode');
    sessionStorage.setItem('moveis_guest', 'true');
    sessionStorage.setItem('moveis_session_active', 'true');
    alert("Visualizando o site 100% como cliente!");
    checkLogin();
}

window.logoutUser = function() {
    if(!confirm("Deseja realmente sair?")) return;
    
    // Clear Admin
    sessionStorage.removeItem('moveis_admin_mode');
    sessionStorage.removeItem('moveis_admin_auth');
    
    // Clear Client
    localStorage.removeItem('moveis_session_active');
    localStorage.removeItem('moveis_guest');
    localStorage.removeItem('moveis_client_user');
    
    // Refresh
    location.reload();
}

window.openAccountModal = function() {
    const user = getLoggedUser();
    const isGuest = localStorage.getItem('moveis_guest');
    
    if (isGuest) {
        showLoginStep('Initial');
        document.getElementById('loginOverlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        return;
    }

    if (!user) return;

    document.getElementById('accModalName').textContent = user.name;
    document.getElementById('accModalEmail').textContent = user.email;
    document.getElementById('accModalLocation').textContent = user.location || 'Não informada';
    
    const img = document.getElementById('accModalImg');
    const icon = document.getElementById('accModalIcon');
    if (user.photo) {
        img.src = user.photo;
        img.style.display = 'block';
        icon.style.display = 'none';
    } else {
        img.style.display = 'none';
        icon.style.display = 'block';
    }

    document.getElementById('accountModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

window.closeAccountModal = function() {
    document.getElementById('accountModal').classList.remove('active');
    document.body.style.overflow = '';
}

function getLoggedUser() {
    const data = localStorage.getItem('moveis_client_user');
    return data ? JSON.parse(data) : null;
}

// --- GLOBAL SETTINGS ---
function loadGlobalSettings() {
    const data = localStorage.getItem('moveis_valentim_settings');
    if (data) {
        const sets = JSON.parse(data);
        if (sets.wpp) {
            PHONE_NUMBER = sets.wpp.replace(/\D/g, '');
        }
        const banner = document.getElementById('promoBanner');
        if (banner) {
            if (sets.banner && sets.banner.trim() !== '') {
                banner.textContent = sets.banner;
                banner.style.display = 'block';
            } else {
                banner.style.display = 'none';
            }
        }
        
        const addressDisplay = document.getElementById('companyAddressDisplay');
        const locationSection = document.getElementById('localizacao');
        if (addressDisplay && locationSection) {
            if (sets.address && sets.address.trim() !== '') {
                addressDisplay.textContent = sets.address;
                locationSection.style.display = 'block';
            } else {
                locationSection.style.display = 'none';
            }
        }
    }
}

const defaultProducts = [
    { id: 1, title: 'Mesa de Jantar Rústica', category: 'Mesas', price: 2500.00, description: 'Mesa de jantar robusta feita em madeira maciça.', image: 'https://images.unsplash.com/photo-1604578762246-41134e37f9cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', bestSeller: true, tags: ['Madeira Maciça'] },
    { id: 2, title: 'Cadeira Anatômica', category: 'Cadeiras', price: 450.00, description: 'Desenhada para oferecer conforto.', image: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Design Autoral'] },
    { id: 3, title: 'Rack Moderno c/ Palhinha', category: 'Racks', price: 1800.00, description: 'Mistura sofisticada de madeira louro freijó.', image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', bestSeller: true, tags: ['Palhinha Indiana'] },
    { id: 4, title: 'Armário Multiuso Clássico', category: 'Armários', price: 3200.00, description: 'Armário imponente com detalhes entalhados a mão.', image: 'https://images.unsplash.com/photo-1595514535314-f86419747cd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Clássico'] },
    { id: 5, title: 'Cama King Size Jatobá', category: 'Camas', price: 4100.00, description: 'Cama resistente em madeira de Jatobá.', image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['King Size'] },
    { id: 6, title: 'Aparador Vintage', category: 'Aparadores', price: 1200.00, description: 'Aparador para hall de entrada.', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Vintage'] },
    { id: 7, title: 'Banqueta Alta', category: 'Bancos', price: 380.00, description: 'Banqueta ideal para ilhas de cozinha.', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', bestSeller: true, tags: ['Giratória'] },
    { id: 8, title: 'Cristaleira Clássica', category: 'Armários', price: 3500.00, description: 'Cristaleira com portas de vidro transparente.', image: 'https://images.unsplash.com/photo-1620242203929-798889ff2270?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Vidro'] },
    { id: 9, title: 'Poltrona de Couro', category: 'Poltronas', price: 2800.00, description: 'Clássica e confortável.', image: 'https://images.unsplash.com/photo-1528699633788-424224dc89b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Couro Legítimo'] },
    { id: 10, title: 'Guarda-Roupa Rústico', category: 'Armários', price: 5400.00, description: 'Guarda-roupa em madeira maciça.', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['4 Portas'] },
    { id: 11, title: 'Mesa de Centro', category: 'Mesas', price: 950.00, description: 'Mesa com tampo orgânico.', image: 'https://plus.unsplash.com/premium_photo-1670869814407-1d5d1c0b31e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', bestSeller: true, tags: ['Orgânico'] },
    { id: 12, title: 'Estante Industrial', category: 'Estantes', price: 2100.00, description: 'Ferro e madeira.', image: 'https://images.unsplash.com/photo-1594620302200-9a762244a156?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Ferro Preto'] },
    { id: 13, title: 'Cama Queen Estofada', category: 'Camas', price: 3800.00, description: 'Cama com cabeceira estofada em linho de alta durabilidade.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Queen Size', 'Linho'] },
    { id: 14, title: 'Armário Planejado em L', category: 'Armários', price: 8500.00, description: 'Armário projetado para espaços grandes com portas de correr espelhadas.', image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', bestSeller: true, tags: ['Porta de Correr'] },
    { id: 15, title: 'Cama Solteiro Montessoriana', category: 'Camas', price: 1600.00, description: 'Cama infantil no estilo montessoriano, para dar autonomia com segurança.', image: 'https://plus.unsplash.com/premium_photo-1681980016147-3be46706e57d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Infantil', 'Solteiro'] },
    { id: 16, title: 'Roupeiro 6 Portas Ocultas', category: 'Armários', price: 4700.00, description: 'Roupeiro espaçoso em MDF com dobradiças importadas.', image: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Roupeiro'] },
    { id: 17, title: 'Mesa Lateral Redonda', category: 'Mesas', price: 450.00, description: 'Mesa lateral compacta, estilosa para salas e quartos.', image: 'https://images.unsplash.com/photo-1532372576444-ea62be023fd3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Mesa de Canto'] },
    { id: 18, title: 'Cama Box Baú Casal Premium', category: 'Camas', price: 2900.00, description: 'Cama casal super resistente com baú revestido em suede.', image: 'https://plus.unsplash.com/premium_photo-1681980019685-6140ccf8b8ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', mediaType: 'image', tags: ['Baú', 'Casal', 'Organização'] },
    { id: 19, title: 'Armário Aéreo para Cozinha', category: 'Armários', price: 1100.00, description: 'Aproveitamento de espaço para aéreos modulares.', image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop', mediaType: 'image', tags: ['Cozinha'] }
];

function getProducts() {
    const data = localStorage.getItem('moveis_valentim_products');
    let parsed = data ? JSON.parse(data) : null;
    if (!parsed || parsed.length < 15) {
        parsed = defaultProducts;
        localStorage.setItem('moveis_valentim_products', JSON.stringify(defaultProducts));
    }
    return parsed;
}

function getHiddenCategories() {
    const data = localStorage.getItem('moveis_valentim_hidden_filters');
    return data ? JSON.parse(data) : [];
}

let currentCategory = 'Todos';

function initFilters(products, hiddenCategories) {
    const filtersContainer = document.getElementById('catalogFilters');
    if(!filtersContainer) return;
    
    const allCategories = [...new Set(products.map(p => p.category))];
    const visibleCategories = ['Todos'];
    
    allCategories.forEach(cat => {
        if(!hiddenCategories.includes(cat)) visibleCategories.push(cat);
    });

    filtersContainer.innerHTML = '';
    
    if (currentCategory !== 'Todos' && hiddenCategories.includes(currentCategory)) {
        currentCategory = 'Todos';
    }
    
    visibleCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (cat === currentCategory ? ' active' : '');
        btn.textContent = cat;
        btn.onclick = () => {
            currentCategory = cat;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            initCatalog();
        };
        filtersContainer.appendChild(btn);
    });
}

function getYouTubeEmbedHtml(url) {
    try {
        let videoId = '';
        if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
        else if (url.includes('youtube.com/watch?v=')) videoId = url.split('?v=')[1].split('&')[0];
        
        if (videoId) {
            return `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}" 
                     class="product-video-tag" frameborder="0" allow="autoplay; encrypted-media" 
                     allowfullscreen style="pointer-events:none;"></iframe>`;
        }
    } catch(e) {}
    return `<video src="${url}" controls class="product-video-tag"></video>`;
}

function createProductCardToHtml(product, isBestSellerContext = false) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openModal(product);
    const priceFormatted = parseFloat(product.price).toFixed(2).replace('.', ',');
    
    let mediaHtml = '';
    if(product.mediaType === 'video') {
        if(product.image.includes('youtu')) mediaHtml = getYouTubeEmbedHtml(product.image);
        else mediaHtml = `<video src="${product.image}" autoplay muted loop playsinline class="product-video-tag"></video>`;
    } else {
        mediaHtml = `<img src="${product.image}" alt="${product.title}" class="product-img" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';">`;
    }

    const badgeHtml = isBestSellerContext ? `<div class="bestseller-badge">⭐ Mais Vendido</div>` : '';

    card.innerHTML = `
        <div class="product-img-container">
            ${badgeHtml}
            ${mediaHtml}
            <div class="product-overlay">
                <span>Ver Detalhes</span>
            </div>
        </div>
        <div class="product-info">
            <div class="product-category">${product.category}</div>
            <h3 class="product-title">${product.title}</h3>
            <div class="product-price">R$ ${priceFormatted}</div>
        </div>
    `;
    return card;
}

function initBestSellers() {
    const section = document.getElementById('destaques');
    const grid = document.getElementById('bestSellersGrid');
    const navItem = document.getElementById('navDestaques');
    if(!section || !grid) return;

    const products = getProducts();
    const hiddenCategories = getHiddenCategories();
    const bests = products.filter(p => p.bestSeller && !hiddenCategories.includes(p.category));

    if(bests.length === 0) {
        section.style.display = 'none';
        if(navItem) navItem.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    if(navItem) navItem.style.display = 'inline-block';
    grid.innerHTML = '';
    
    // Sort randomly or newest first, slice top 4
    bests.slice(0, 4).forEach(product => {
        grid.appendChild(createProductCardToHtml(product, true));
    });
}

function initCatalog() {
    initBestSellers();
    
    const products = getProducts();
    const hiddenCategories = getHiddenCategories();
    
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    initFilters(products, hiddenCategories);
    grid.innerHTML = '';
    
    const visibleProducts = products.filter(p => !hiddenCategories.includes(p.category));
    const filteredProducts = currentCategory === 'Todos' ? visibleProducts : visibleProducts.filter(p => p.category === currentCategory);
    
    filteredProducts.forEach(product => {
        grid.appendChild(createProductCardToHtml(product));
    });
}

// Modal Logic
const modal = document.getElementById('productModal');
const closeModalBtn = document.querySelector('.close-modal');
let currentlyOpenProduct = null;

function getYouTubeEmbedHtmlNormal(url) {
    let videoId = '';
    if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('youtube.com/watch?v=')) videoId = url.split('?v=')[1].split('&')[0];
    if (videoId) return `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" class="modal-img" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    return `<video src="${url}" controls class="modal-img" autoplay></video>`;
}

function renderSuggestions(baseProduct) {
    const products = getProducts();
    const hiddenCategories = getHiddenCategories();
    const visibleProducts = products.filter(p => !hiddenCategories.includes(p.category));
    
    let suggestions = visibleProducts.filter(p => p.category === baseProduct.category && p.id !== baseProduct.id);
    
    // Fill up to 4 if we don't have enough in the category
    if(suggestions.length < 4) {
        const others = visibleProducts.filter(p => p.category !== baseProduct.category && p.id !== baseProduct.id);
        // Shuffle others
        others.sort(() => 0.5 - Math.random());
        suggestions = suggestions.concat(others.slice(0, 4 - suggestions.length));
    }
    
    suggestions = suggestions.slice(0, 4);
    const grid = document.getElementById('modalSuggestionsGrid');
    
    if(suggestions.length === 0) {
        grid.parentElement.style.display = 'none';
        return;
    }
    
    grid.parentElement.style.display = 'block';
    grid.innerHTML = '';
    
    suggestions.forEach(s => {
        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.onclick = () => { 
            document.querySelector('.modal-content').scrollTop = 0; 
            openModal(s); 
        };
        
        let mediaHtml = '';
        if(s.mediaType === 'video') {
            if(s.image.includes('youtu')) mediaHtml = getYouTubeEmbedHtml(s.image);
            else mediaHtml = `<video src="${s.image}" class="suggestion-img"></video>`;
        } else {
            mediaHtml = `<img src="${s.image}" class="suggestion-img" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80';">`;
        }
        
        card.innerHTML = `
            ${mediaHtml}
            <div class="suggestion-title">${s.title}</div>
            <div class="suggestion-price">R$ ${parseFloat(s.price).toFixed(2).replace('.',',')}</div>
        `;
        grid.appendChild(card);
    });
}

function openModal(product) {
    currentlyOpenProduct = product;
    const container = document.getElementById('modalMediaContainer');
    
    if(product.mediaType === 'video') {
        if(product.image.includes('youtu')) {
            container.innerHTML = getYouTubeEmbedHtmlNormal(product.image);
        } else {
            container.innerHTML = `<video src="${product.image}" controls class="modal-img" autoplay></video>`;
        }
    } else {
        container.innerHTML = `<img src="${product.image}" alt="Produto" id="modalImage" class="modal-img" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80';">`;
    }

    document.getElementById('modalTitle').textContent = product.title;
    document.getElementById('modalDesc').textContent = product.description;
    document.getElementById('modalPrice').textContent = `R$ ${parseFloat(product.price).toFixed(2).replace('.', ',')}`;
    
    const pixPrice = parseFloat(product.price) * 0.95;
    const pixContainer = document.getElementById('modalPixDiscount');
    if (pixContainer) {
        pixContainer.textContent = `ou R$ ${pixPrice.toFixed(2).replace('.', ',')} no PIX (5% off)`;
        pixContainer.style.display = 'block';
    }

    const tagsContainer = document.getElementById('modalTags');
    tagsContainer.innerHTML = '';
    product.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        tagsContainer.appendChild(span);
    });
    
    // Clear custom sizes
    document.getElementById('modalWidth').value = '';
    document.getElementById('modalDepth').value = '';
    if(document.getElementById('modalPayment')) {
        document.getElementById('modalPayment').value = '';
    }
    
    renderSuggestions(product);
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    const container = document.getElementById('modalMediaContainer');
    container.innerHTML = ''; // stops video 
}

if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('active')) closeModal(); });

function generateOrderText() {
    if(!currentlyOpenProduct) return '';
    const w = document.getElementById('modalWidth').value.trim();
    const d = document.getElementById('modalDepth').value.trim();
    const payment = document.getElementById('modalPayment') ? document.getElementById('modalPayment').value : '';
    const user = getLoggedUser();
    
    let text = `Olá, `;
    if(user && user.name) {
        text += `sou o ${user.name}`;
        if(user.location) text += ` (de ${user.location})`;
        text += `. Gostaria de fazer o pedido deste móvel: *${currentlyOpenProduct.title}*.`;
    } else {
        text += `gostaria de fazer o pedido deste móvel: *${currentlyOpenProduct.title}*.`;
    }
    
    if(w || d) {
        text += `\nMedidas desejadas:` + (w ? ` Largura: ${w}` : '') + (w && d ? ',' : '') + (d ? ` Alt./Prof.: ${d}` : '') + ``;
    }

    if(payment) {
        text += `\nForma de pagamento escolhida: *${payment}*`;
    }
    
    return text;
}

document.getElementById('modalBtnOrder').onclick = () => {
    const isAdmin = sessionStorage.getItem('moveis_admin_mode');
    if (isAdmin) {
        alert("Você está no modo Administrador. O link para o WhatsApp não será aberto.");
        return;
    }
    const text = generateOrderText();
    if(!text) return;
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
}

document.getElementById('modalBtnOrderSite').onclick = () => {
    const text = generateOrderText();
    if(!text) return;
    
    const isAdmin = sessionStorage.getItem('moveis_admin_mode');
    if (isAdmin) {
        alert("Atenção: Você está visualizando o site como Administrador. O pedido não será enviado. Use a opção 'Ver 100% como cliente' se quiser testar o chat real.");
        return;
    }
    
    // Send message to internal chat system
    sendChatMessage(text, currentlyOpenProduct.image, currentlyOpenProduct.mediaType);
    
    // Open chat widget
    if (chatWidget && !chatWidget.classList.contains('open')) {
        chatWidget.classList.add('open');
        chatToggleIcon.className = 'fas fa-chevron-down';
        chatOpen = true;
        loadChatHistory();
    }
    
    closeModal();
    alert("Pedido enviado com sucesso para a marcenaria! Acompanhe o status pelo chat.");
}

// REVIEWS LOGIC
function initReviews() {
    const defaultReviews = [
        { id: 1, name: 'Carlos', location: 'Araçatuba, SP', rating: 5, text: 'Excelente trabalho, móvel muito bem feito!' },
        { id: 2, name: 'Mariana', location: 'São Paulo, SP', rating: 5, text: 'A mesa de jantar transformou a minha sala. Muito cuidadosos em cada detalhe da madeira.' }
    ];
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;
    
    let data = localStorage.getItem('moveis_valentim_reviews');
    let reviews = data ? JSON.parse(data) : defaultReviews;
    if(!data) localStorage.setItem('moveis_valentim_reviews', JSON.stringify(defaultReviews));

    grid.innerHTML = '';
    reviews.forEach(r => {
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <i class="fas fa-quote-right review-icon"></i>
            <div class="review-stars">${'⭐'.repeat(r.rating)}</div>
            <div class="review-text">"${r.text}"</div>
            <div class="review-author">— ${r.name}</div>
            <div class="review-location">${r.location}</div>
        `;
        grid.appendChild(card);
    });
}

// CUSTOMER GALLERY LOGIC
function initCustomerGallery() {
    const data = localStorage.getItem('moveis_valentim_customer_photos');
    const section = document.getElementById('galeria-clientes');
    const grid = document.getElementById('customerGalleryGrid');
    const navItem = document.getElementById('navGaleria');
    if(!section || !grid) return;
    
    if(!data) { 
        section.style.display = 'none'; 
        if(navItem) navItem.style.display = 'none';
        return; 
    }
    
    const photos = JSON.parse(data);
    if(photos.length === 0) { 
        section.style.display = 'none'; 
        if(navItem) navItem.style.display = 'none';
        return; 
    }
    
    section.style.display = 'block';
    if(navItem) navItem.style.display = 'inline-block';
    
    grid.innerHTML = '';
    photos.forEach(ph => {
        const div = document.createElement('div');
        div.className = 'customer-photo-card';
        div.innerHTML = `
            <img class="customer-photo-img" src="${ph.image}">
            <div class="customer-photo-subtitle">${ph.subtitle}</div>
        `;
        grid.appendChild(div);
    });
}

// Mobile Menu
const mobileBtn = document.querySelector('.mobile-menu-btn');
const nav = document.querySelector('.nav');
if (mobileBtn && nav) {
    mobileBtn.addEventListener('click', () => {
        if (nav.style.display === 'flex') { nav.style.display = 'none'; } 
        else {
            nav.style.display = 'flex'; nav.style.flexDirection = 'column'; nav.style.position = 'absolute';
            nav.style.top = '100%'; nav.style.left = '0'; nav.style.width = '100%'; nav.style.backgroundColor = 'rgba(18, 13, 10, 0.98)';
            nav.style.padding = '1rem 0'; nav.style.boxShadow = '0 10px 10px rgba(0,0,0,0.05)';
            nav.querySelectorAll('a').forEach(link => link.style.margin = '1rem 2rem');
        }
    });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            if (window.innerWidth <= 768 && nav.style.display === 'flex') nav.style.display = 'none';
            window.scrollTo({ top: targetElement.getBoundingClientRect().top + window.pageYOffset - 80, behavior: 'smooth' });
        }
    });
});

// CLIENT CHAT
const chatWidget = document.getElementById('chatWidget');
const chatHeader = document.getElementById('chatHeader');
const chatToggleIcon = document.getElementById('chatToggleIcon');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const chatBody = document.getElementById('chatBody');
const chatAttachment = document.getElementById('chatAttachment');

if (!localStorage.getItem('client_id')) {
    localStorage.setItem('client_id', 'client_' + Date.now() + Math.floor(Math.random() * 1000));
}
const currentClientId = localStorage.getItem('client_id');

function getChats() {
    const data = localStorage.getItem('moveis_valentim_chats');
    return data ? JSON.parse(data) : {};
}

function saveChats(chats) {
    try {
        localStorage.setItem('moveis_valentim_chats', JSON.stringify(chats));
    } catch(e) {
        alert('As imagens da conversa ocuparam todo o limite da memória do seu navegador! Não é mais possível salvar essa imagem.');
    }
}

let lastChatMsgCount = -1;
function loadChatHistory() {
    if(!chatBody) return;
    const chats = getChats();
    const myChat = chats[currentClientId];
    const currentMsgCount = myChat ? myChat.messages.length : 0;
    
    if (lastChatMsgCount === currentMsgCount && chatBody.innerHTML !== '') return;
    lastChatMsgCount = currentMsgCount;
    
    chatBody.innerHTML = '<div class="chat-message received">Olá! Bem-vindo(a) à Móveis Valentim. Como podemos ajudar você hoje?</div>';
    
    if (myChat && myChat.messages) {
        myChat.messages.forEach(m => {
            const div = document.createElement('div');
            div.className = 'chat-message ' + (m.sender === 'user' ? 'sent' : 'received');
            
            let inner = m.text || '';
            if(m.media) {
                if(m.mediaType === 'video') inner += `<video src="${m.media}" class="chat-media" controls></video>`;
                else if(m.mediaType === 'audio') {
                    const audioId = 'audio_' + Date.now() + Math.floor(Math.random()*100);
                    inner += `
                        <div class="whatsapp-audio-container">
                            <i class="fas fa-play audio-play-icon" id="play_${audioId}" onclick="toggleAudio('${audioId}')"></i>
                            <div class="audio-track"><div class="audio-progress" id="prog_${audioId}"></div></div>
                            <span class="audio-duration" id="dur_${audioId}">0:00</span>
                            <audio src="${m.media}" id="${audioId}" ontimeupdate="updateAudioProgress('${audioId}')" onended="audioEnded('${audioId}')" style="display:none"></audio>
                        </div>
                    `;
                }
                else inner += `<img src="${m.media}" class="chat-media">`;
            }
            div.className = `chat-message ${m.sender}`;
            
            // Context Menu Events
            div.oncontextmenu = (e) => {
                e.preventDefault();
                showChatContextMenu(e, m, i);
            };
            
            // Mobile Long Press
            let touchTimer;
            div.ontouchstart = (e) => {
                touchTimer = setTimeout(() => showChatContextMenu(e.touches[0], m, i), 600);
            };
            div.ontouchend = () => clearTimeout(touchTimer);
            div.ontouchmove = () => clearTimeout(touchTimer);

            div.innerHTML = inner;
            chatBody.appendChild(div);
        });
        chatBody.scrollTop = chatBody.scrollHeight;
    }
}

let lastRefresh = 0;
let lastState = { prod: null, rev: null, gal: null, set: null, hid: null };

setInterval(() => {
    if(chatWidget && chatWidget.classList.contains('open')) {
        loadChatHistory();
    }
    
    // throttle heavy renders
    if(Date.now() - lastRefresh > 5000){
        const p = localStorage.getItem('moveis_valentim_products');
        const r = localStorage.getItem('moveis_valentim_reviews');
        const g = localStorage.getItem('moveis_valentim_customer_photos');
        const s = localStorage.getItem('moveis_valentim_settings');
        const h = localStorage.getItem('moveis_valentim_hidden_filters');
        
        if(s !== lastState.set) { lastState.set = s; loadGlobalSettings(); }
        if(p !== lastState.prod || h !== lastState.hid) { lastState.prod = p; lastState.hid = h; initCatalog(); }
        if(r !== lastState.rev) { lastState.rev = r; initReviews(); }
        if(g !== lastState.gal) { lastState.gal = g; initCustomerGallery(); }
        
        lastRefresh = Date.now();
    }
}, 1000);

let chatOpen = false;
if (chatHeader) {
    chatHeader.addEventListener('click', () => {
        // This will be handled inside makeDraggable to distinguish between click and drag
    });
}

window.toggleAudio = function(id) {
    const audio = document.getElementById(id);
    const icon = document.getElementById('play_' + id);
    if (audio.paused) {
        audio.play();
        icon.className = 'fas fa-pause audio-play-icon';
    } else {
        audio.pause();
        icon.className = 'fas fa-play audio-play-icon';
    }
}

window.updateAudioProgress = function(id) {
    const audio = document.getElementById(id);
    const progress = document.getElementById('prog_' + id);
    const durationLabel = document.getElementById('dur_' + id);
    
    if (audio.duration) {
        const percent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = percent + '%';
        
        const mins = Math.floor(audio.currentTime / 60);
        const secs = Math.floor(audio.currentTime % 60);
        durationLabel.textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
}

window.audioEnded = function(id) {
    const icon = document.getElementById('play_' + id);
    icon.className = 'fas fa-play audio-play-icon';
    document.getElementById('prog_' + id).style.width = '0%';
}

function compressImage(file, maxWidth, callback) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            let w = img.width;
            let h = img.height;

            if (w <= maxWidth) {
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                return callback(canvas.toDataURL('image/jpeg', 0.92));
            }

            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            canvas.width = w; 
            canvas.height = h;
            ctx.drawImage(img, 0, 0);

            let targetWidth = maxWidth;
            let targetHeight = Math.floor(h * (maxWidth / w));

            while (canvas.width * 0.5 > targetWidth) {
                let tmpCanvas = document.createElement('canvas');
                tmpCanvas.width = canvas.width * 0.5;
                tmpCanvas.height = canvas.height * 0.5;
                let tmpCtx = tmpCanvas.getContext('2d');
                tmpCtx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);
                canvas = tmpCanvas;
            }

            let finalCanvas = document.createElement('canvas');
            finalCanvas.width = targetWidth;
            finalCanvas.height = targetHeight;
            let finalCtx = finalCanvas.getContext('2d');
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = "high";
            finalCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
            
            callback(finalCanvas.toDataURL('image/jpeg', 0.88));
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function sendChatMessage(textOverwrite, mediaData, mType) {
    const text = textOverwrite !== undefined ? textOverwrite : (chatInput ? chatInput.value.trim() : '');
    if (!text && !mediaData) return;

    const chats = getChats();
    if (!chats[currentClientId]) chats[currentClientId] = { messages: [], userName: '' };
    
    const user = getLoggedUser();
    if(user && user.name) {
        let n = user.name;
        if(user.location) n += ` (${user.location})`;
        chats[currentClientId].userName = n;
        if(user.photo) chats[currentClientId].userPhoto = user.photo;
    }

    const msgObj = { sender: 'user', text: text, timestamp: Date.now() };
    if(mediaData) {
        msgObj.media = mediaData;
        msgObj.mediaType = mType || 'image';
    }

    chats[currentClientId].messages.push(msgObj);
    saveChats(chats);
    
    if(chatInput && textOverwrite === undefined) chatInput.value = '';
    loadChatHistory();

    // Simulate Admin Typing
    if (msgObj.sender === 'user') {
        setTimeout(() => {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'chat-message received typing';
            typingDiv.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
            chatBody.appendChild(typingDiv);
            chatBody.scrollTop = chatBody.scrollHeight;

            setTimeout(() => {
                typingDiv.remove();
                // Admin normally responds via admin.html, but we can add an auto-reply for better UX if needed
            }, 2000);
        }, 1000);
    }
}

if (sendChatBtn) sendChatBtn.addEventListener('click', () => sendChatMessage());
if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
}

function handleChatAttachment(file) {
    if(!file) return;
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    if(isVideo || isAudio) {
         if(file.size > 1000000) { alert('Mídia muito grande pro chat! Máx: 1MB'); return; }
         const reader = new FileReader();
         reader.onload = e => sendChatMessage('', e.target.result, isVideo ? 'video' : 'audio');
         reader.readAsDataURL(file);
    } else {
         compressImage(file, 1600, (b64) => sendChatMessage('', b64, 'image'));
    }
}

if (chatAttachment) {
    chatAttachment.addEventListener('change', (e) => {
        handleChatAttachment(e.target.files[0]);
        e.target.value = ''; // reset
    });
}

// Drag and Drop Logic for Chat Widget
function makeDraggable(element, header) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let dragThreshold = 5;
    let isClick = true;

    header.onmousedown = dragStart;
    header.ontouchstart = dragStart;

    function dragStart(e) {
        if (e.target.closest('#chatToggleIcon')) return;
        
        isClick = true;
        const event = e.type === 'touchstart' ? e.touches[0] : e;
        pos3 = event.clientX;
        pos4 = event.clientY;

        document.onmouseup = dragEnd;
        document.ontouchend = dragEnd;
        document.onmousemove = dragMove;
        document.ontouchmove = dragMove;

        // Get snapshot of current style to avoid jumps
        const rect = element.getBoundingClientRect();
        element.style.top = rect.top + 'px';
        element.style.left = rect.left + 'px';
        element.style.bottom = 'auto';
        element.style.right = 'auto';
        element.style.margin = '0';
        element.style.transition = 'none';
    }

    function dragMove(e) {
        const event = e.type === 'touchmove' ? e.touches[0] : e;
        
        pos1 = pos3 - event.clientX;
        pos2 = pos4 - event.clientY;

        if (Math.abs(pos1) > dragThreshold || Math.abs(pos2) > dragThreshold) {
            isClick = false;
        }

        if (isClick) return;

        pos3 = event.clientX;
        pos4 = event.clientY;

        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        const pad = 5;
        newTop = Math.max(pad, Math.min(newTop, window.innerHeight - element.offsetHeight - pad));
        newLeft = Math.max(pad, Math.min(newLeft, window.innerWidth - element.offsetWidth - pad));

        element.style.top = newTop + 'px';
        element.style.left = newLeft + 'px';
    }

    function dragEnd() {
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;
        
        if (isClick) {
            // Handle Toggle
            const isOpen = element.classList.contains('open');
            if (isOpen) {
                element.classList.remove('open');
                const icon = element.querySelector('#chatToggleIcon i') || element.querySelector('.fa-chevron-down');
                if(icon) icon.className = 'fas fa-chevron-up';
            } else {
                // Opening - Check if it fits downward
                const openHeight = 550; 
                const rect = element.getBoundingClientRect();
                if (rect.top + openHeight > window.innerHeight) {
                    // It will go off-screen. Shift it up.
                    let targetTop = window.innerHeight - openHeight - 20;
                    if(targetTop < 10) targetTop = 10;
                    element.style.top = targetTop + 'px';
                }
                element.classList.add('open');
                const icon = element.querySelector('#chatToggleIcon i') || element.querySelector('.fa-chevron-up');
                if(icon) icon.className = 'fas fa-chevron-down';
                loadChatHistory();
            }
        }
        
        // Ensure transition is restored only for height after a short delay
        setTimeout(() => {
            element.style.transition = 'height 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)';
        }, 10);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Draggability
    const chatWidget = document.getElementById('chatWidget');
    const chatHeader = document.querySelector('.chat-header');
    if(chatWidget && chatHeader) makeDraggable(chatWidget, chatHeader);

    lastState.prod = localStorage.getItem('moveis_valentim_products');
    lastState.rev = localStorage.getItem('moveis_valentim_reviews');
    lastState.gal = localStorage.getItem('moveis_valentim_customer_photos');
    lastState.set = localStorage.getItem('moveis_valentim_settings');
    lastState.hid = localStorage.getItem('moveis_valentim_hidden_filters');
    
    loadGlobalSettings();
    checkLogin();
    initCatalog();
    initReviews();
    initCustomerGallery();

    const recordBtn = document.getElementById('recordAudioClientBtn');
    if (recordBtn) {
        let clientMediaRecorder;
        let clientAudioChunks = [];
        let isClientRecording = false;

        recordBtn.addEventListener('click', async () => {
            if (!isClientRecording) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    clientMediaRecorder = new MediaRecorder(stream);
                    clientAudioChunks = [];
                    clientMediaRecorder.ondataavailable = e => { if(e.data.size > 0) clientAudioChunks.push(e.data); };
                    clientMediaRecorder.onstop = () => {
                        const audioBlob = new Blob(clientAudioChunks, { type: clientMediaRecorder.mimeType || 'audio/webm' });
                        if(audioBlob.size > 1000000) { alert('Áudio muito longo para envio (Máx: 1MB)!'); return; }
                        const reader = new FileReader();
                        reader.onload = e => sendChatMessage('', e.target.result, 'audio');
                        reader.readAsDataURL(audioBlob);
                    };
                    clientMediaRecorder.start();
                    isClientRecording = true;
                    recordBtn.innerHTML = '<i class="fas fa-stop" style="color: red;"></i>';
                    recordBtn.classList.add('recording');
                } catch(err) {
                    alert('Erro de microfone. Você negou a permissão ou está abrindo o arquivo direto no PC via "file://". Para usar o envio de voz, o seu site precisa estar hospedado numa Nuvem ou Servidor (HTTPS).');
                }
            } else {
                clientMediaRecorder.stop();
                clientMediaRecorder.stream.getTracks().forEach(t => t.stop());
                isClientRecording = false;
                recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                recordBtn.classList.remove('recording');
            }
        });
    }

    // Remove Preloader
    setTimeout(() => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
                document.body.classList.remove('loading');
            }, 600);
        }
    }, 1500);
});

// --- SHARE LOGIC ---
window.shareSite = async function() {
    const shareData = {
        title: 'Móveis Valentim - Marcenaria Fina',
        text: 'Conheça nossos móveis planejados e artesanais!',
        url: window.location.href.split('#')[0]
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            copyToClipboard(shareData.url, 'Link do site copiado para a área de transferência!');
        }
    } catch(e) {}
}

window.shareProduct = async function() {
    if(!currentlyOpenProduct) return;
    const shareData = {
        title: currentlyOpenProduct.title,
        text: `Veja este móvel incrível: ${currentlyOpenProduct.title} por R$ ${parseFloat(currentlyOpenProduct.price).toFixed(2).replace('.', ',')}!`,
        url: window.location.href.split('#')[0]
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            copyToClipboard(shareData.url, 'Link do móvel copiado para a área de transferência!');
        }
    } catch(e) {}
}

function copyToClipboard(text, msg) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert(msg);
        }).catch(() => {
            alert('Não foi possível copiar o link automaticamente.');
        });
    } else {
        alert('Não foi possível copiar o link.');
    }
}

// --- CONTEXT MENU LOGIC ---
window.showChatContextMenu = function(e, msg, index) {
    const menu = document.getElementById('customContextMenu');
    if(!menu) return;

    menu.style.display = 'block';
    
    // Position
    let x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    let y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    
    // Boundary check
    if (x + 220 > window.innerWidth) x = window.innerWidth - 230;
    if (y + 150 > window.innerHeight) y = window.innerHeight - 160;
    
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    // Actions
    document.getElementById('ctxCopy').onclick = () => {
        if(msg.text) {
            navigator.clipboard.writeText(msg.text);
            alert('Mensagem copiada!');
        }
        hideContextMenu();
    };

    document.getElementById('ctxForward').onclick = () => {
        if(msg.text) {
            const url = `https://wa.me/?text=${encodeURIComponent(msg.text)}`;
            window.open(url, '_blank');
        }
        hideContextMenu();
    };

    document.getElementById('ctxDelete').onclick = () => {
        if(confirm('Excluir esta mensagem?')) {
            const chats = getChats();
            if(chats[currentClientId]) {
                chats[currentClientId].messages.splice(index, 1);
                saveChats(chats);
                loadChatHistory();
            }
        }
        hideContextMenu();
    };

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', hideContextMenu, { once: true });
    }, 10);
};

function hideContextMenu() {
    const menu = document.getElementById('customContextMenu');
    if(menu) menu.style.display = 'none';
}
