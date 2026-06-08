// Application State
const State = {
    activeCategory: 'tiffins',
    currentView: 'home',
    theme: 'light',
    cart: [],
    orders: [],
    selectedOrder: null
};

// Menu Database (5 Partitions - Cashews Removed)
const MenuItems = [
    // 1. Tiffins (Morning)
    {
        id: 'tif-idly',
        name: 'Steam Idly (4 Pcs)',
        category: 'tiffins',
        price: 30,
        desc: 'Soft, fluffy, steaming hot rice cakes served with ginger chutney, peanut chutney, and aromatic sambar.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-plain-dosa',
        name: 'Crispy Plain Dosa',
        category: 'tiffins',
        price: 30,
        desc: 'Crisp golden crepe made from fermented rice-lentil batter, served with chutneys and warm sambar.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-onion-dosa',
        name: 'Onion Dosa',
        category: 'tiffins',
        price: 40,
        desc: 'Crispy golden dosa topped with finely chopped onions, green chilies, and fresh coriander leaves.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-puri',
        name: 'Puri Bhaji (2 Pcs)',
        category: 'tiffins',
        price: 30,
        desc: 'Golden-fried puffy wheat flatbreads served with a spiced potato gravy (bhaji) and coconut chutney.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-bonda',
        name: 'Mysore Bonda (4 Pcs)',
        category: 'tiffins',
        price: 30,
        desc: 'Crispy outside, fluffy inside fried dumplings made of flour, yogurt, and spices, served with coconut chutney.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-pesarattu',
        name: 'Pesarattu Dosa',
        category: 'tiffins',
        price: 45,
        desc: 'Healthy, protein-rich crepe made of whole green gram (moong dal) batter, topped with ginger and onions.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-egg-dosa',
        name: 'Egg Dosa',
        category: 'tiffins',
        price: 50,
        desc: 'Crispy dosa roasted with a freshly cracked egg, local spices, and onions. High protein breakfast.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-double-egg-dosa',
        name: 'Double Egg Dosa',
        category: 'tiffins',
        price: 60,
        desc: 'Loaded dosa roasted with two cracked eggs, crushed black pepper, green chilies, and coriander.',
        image: 'assets/tiffins.jpg',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },

    // 2. Water Plant
    {
        id: 'wat-normal-can',
        name: 'Normal Water Can (20L)',
        category: 'water',
        price: 25,
        desc: 'Clean, purified drinking water can. Standard safety sealed, perfect for family groups and travelers.',
        image: 'assets/water.png',
        badge: 'Ready Stock',
        icon: '💧'
    },
    {
        id: 'wat-cool-can',
        name: 'Cool Water Can (20L)',
        category: 'water',
        price: 40,
        desc: 'Chilled purified drinking water can. Keeps your tourist group refreshed under the hot coastal sun.',
        image: 'assets/water.png',
        badge: 'Ready Stock',
        icon: '❄️'
    },
    {
        id: 'wat-cool-bottle',
        name: 'Chilled Water Bottle (1L)',
        category: 'water',
        price: 20,
        desc: 'Chilled, sealed mineral water bottle for quick convenience while climbing the temple steps.',
        image: 'assets/water.png',
        badge: 'Ready Stock',
        icon: '💧'
    },

    // 3. Tea Time
    {
        id: 'tea-special',
        name: 'Special Cardamom Tea',
        category: 'tea',
        price: 15,
        desc: 'Freshly brewed strong milk tea infused with cardamom and organic ginger. Rejuvenating taste.',
        image: 'assets/tea.png',
        badge: 'Freshly Brewed',
        icon: '☕'
    },
    {
        id: 'tea-coffee',
        name: 'Filter Coffee',
        category: 'tea',
        price: 20,
        desc: 'Authentic South Indian chicory-infused filter coffee frothed with thick hot milk in traditional brass cups.',
        image: 'assets/tea.png',
        badge: 'Freshly Brewed',
        icon: '☕'
    },
    {
        id: 'tea-lemon',
        name: 'Hot Lemon Tea',
        category: 'tea',
        price: 15,
        desc: 'Light black tea brewed with fresh lemon extract and a touch of honey for a refreshing temple break.',
        image: 'assets/tea.png',
        badge: 'Freshly Brewed',
        icon: '🍋'
    },
    {
        id: 'tea-badam',
        name: 'Hot Badam Milk',
        category: 'tea',
        price: 25,
        desc: 'Creamy hot milk simmered with ground almonds, saffron, and cardamom, garnished with almond flakes.',
        image: 'assets/tea.png',
        badge: 'Freshly Brewed',
        icon: '🥛'
    },

    // 4. Cool Drinks, Icecreams & Kirana
    {
        id: 'ext-soft-drink',
        name: 'Chilled Soft Drink (500ml)',
        category: 'drinks',
        price: 40,
        desc: 'Assorted cold sodas (Thums Up, Sprite, Coca-Cola) straight from the refrigerator.',
        image: 'assets/drinks.png',
        badge: 'Ready Stock',
        icon: '🥤'
    },
    {
        id: 'ext-icecream',
        name: 'Butterscotch Ice Cream Cup',
        category: 'drinks',
        price: 30,
        desc: 'Rich and creamy butterscotch cup ice cream with crunchy cashew praline bites.',
        image: 'assets/drinks.png',
        badge: 'Ready Stock',
        icon: '🍦'
    },
    {
        id: 'ext-paper-plates',
        name: 'Disposable Paper Plates (50 Pcs)',
        category: 'drinks',
        price: 80,
        desc: 'Biodegradable premium paper plates, highly useful for temple visitors having group lunch.',
        image: 'assets/drinks.png',
        badge: 'Kirana Stock',
        icon: '🍽️'
    },
    {
        id: 'ext-paper-glasses',
        name: 'Disposable Glasses (100 Pcs)',
        category: 'drinks',
        price: 50,
        desc: 'Disposable paper glasses for water, tea, and drinks. Eco-friendly and highly durable.',
        image: 'assets/drinks.png',
        badge: 'Kirana Stock',
        icon: '🥤'
    },

    // 5. Evening Snacks (afternoon/evening)
    {
        id: 'snk-pakodi',
        name: 'Crispy Onion Pakodi (Plate)',
        category: 'snacks',
        price: 20,
        desc: 'Deep-fried crispy onion fritters coated with chickpea flour and local spices, served hot with mint chutney.',
        image: 'assets/snacks.png',
        badge: 'Hot & Fresh',
        icon: '🍢'
    },
    {
        id: 'snk-bajji',
        name: 'Green Chili Bajji (3 Pcs)',
        category: 'snacks',
        price: 20,
        desc: 'Thick green chilies dipped in spiced gram batter, deep-fried to perfection, and stuffed with chopped onions.',
        image: 'assets/snacks.png',
        badge: 'Hot & Fresh',
        icon: '🍢'
    },
    {
        id: 'snk-gari',
        name: 'Bobari Gari (3 Pcs)',
        category: 'snacks',
        price: 20,
        desc: 'Crispy golden vada made from Bobbarlu (black-eyed peas) batter with ginger, black pepper, and curry leaves.',
        image: 'assets/snacks.png',
        badge: 'Hot & Fresh',
        icon: '🍢'
    },
    {
        id: 'snk-samosa',
        name: 'Hot Onion Samosa (4 Pcs)',
        category: 'snacks',
        price: 20,
        desc: 'Crunchy triangular pastry shells filled with spiced caramelized onion and green peas stuffing.',
        image: 'assets/snacks.png',
        badge: 'Hot & Fresh',
        icon: '🍢'
    }
];

// Helper: Format price to Indian Rupees
function formatRupees(amount) {
    return '₹' + amount;
}

// Helper: Get Today's Date String (YYYY-MM-DD)
function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

// Helper: Get Tomorrow's Date String (YYYY-MM-DD)
function getTomorrowDateString() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

// Router Navigation
function navigate(viewName) {
    State.currentView = viewName;

    // Hide all views
    document.querySelectorAll('.app-view').forEach(view => {
        view.style.display = 'none';
    });

    // Show selected view
    const viewEl = document.getElementById(`${viewName}-view`);
    if (viewEl) {
        viewEl.style.display = 'block';
    }

    // Update nav links activation status
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Specific View Logic
    if (viewName === 'menu') {
        renderMenu();
    } else if (viewName === 'dashboard') {
        renderDashboard();
    } else if (viewName === 'receipt') {
        renderReceipt();
    }

    // Scroll to top
    window.scrollTo(0, 0);
    closeCart();
}

// Theme Management
function toggleTheme() {
    State.theme = State.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', State.theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    themeBtn.innerHTML = State.theme === 'light' ? '🌙' : '☀️';
}

// Cart UI Operations
function openCart() {
    document.getElementById('cart-drawer').classList.add('open');
    document.getElementById('backdrop').classList.add('show');
}

function closeCart() {
    document.getElementById('cart-drawer').classList.remove('open');
    document.getElementById('backdrop').classList.remove('show');
}

// Add Item to Cart
function addToCart(itemId) {
    const item = MenuItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = State.cart.find(c => c.item.id === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        State.cart.push({ item, quantity: 1 });
    }

    updateCartUI();
    openCart();

    const cardBtn = document.querySelector(`[data-add-id="${itemId}"]`);
    if (cardBtn) {
        cardBtn.innerHTML = '✓ Added';
        cardBtn.style.background = 'linear-gradient(135deg, var(--success-color), #2e7d32)';
        setTimeout(() => {
            cardBtn.innerHTML = `<span>+</span> Add to Cart`;
            cardBtn.style.background = '';
        }, 1500);
    }
}

// Change Quantity in Cart
function changeCartQuantity(itemId, delta) {
    const cartIndex = State.cart.findIndex(c => c.item.id === itemId);
    if (cartIndex === -1) return;

    State.cart[cartIndex].quantity += delta;
    if (State.cart[cartIndex].quantity <= 0) {
        State.cart.splice(cartIndex, 1);
    }

    updateCartUI();
}

// Update Cart Badge and Render items
function updateCartUI() {
    const totalCount = State.cart.reduce((sum, entry) => sum + entry.quantity, 0);
    document.getElementById('cart-count-badge').innerText = totalCount;

    const cartBody = document.getElementById('cart-items-container');
    const cartFooter = document.getElementById('cart-footer-section');

    if (State.cart.length === 0) {
        cartBody.innerHTML = `
            <div class="cart-empty-state">
                <div class="cart-empty-icon">🛒</div>
                <p>Your cart is empty</p>
                <p style="font-size: 0.8rem; margin-top: 0.5rem;">Choose fresh delicious items to order!</p>
            </div>
        `;
        cartFooter.style.display = 'none';
    } else {
        let itemsHtml = '';
        let subtotal = 0;

        State.cart.forEach(entry => {
            const itemTotal = entry.item.price * entry.quantity;
            subtotal += itemTotal;

            itemsHtml += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${entry.item.name}</div>
                        <div class="cart-item-price">${formatRupees(entry.item.price)} × ${entry.quantity}</div>
                    </div>
                    <div class="qty-selector">
                        <button class="qty-btn" onclick="changeCartQuantity('${entry.item.id}', -1)">-</button>
                        <span class="qty-val">${entry.quantity}</span>
                        <button class="qty-btn" onclick="changeCartQuantity('${entry.item.id}', 1)">+</button>
                    </div>
                    <button class="cart-item-remove" onclick="changeCartQuantity('${entry.item.id}', -${entry.quantity})">🗑️</button>
                </div>
            `;
        });

        cartBody.innerHTML = itemsHtml;
        cartFooter.style.display = 'block';
        document.getElementById('cart-subtotal').innerText = formatRupees(subtotal);

        // Dynamic Delivery Alert text in cart drawer
        const disclaimerEl = document.getElementById('tiffin-preorder-disclaimer');
        if (totalCount >= 10) {
            disclaimerEl.style.display = 'flex';
            disclaimerEl.innerHTML = `<span>⚡</span> <span><strong>Temple Delivery Eligible!</strong> You have ${totalCount} items. We can deliver directly to your temple location.</span>`;
            disclaimerEl.style.backgroundColor = '#e8f5e9';
            disclaimerEl.style.color = '#2e7d32';
        } else {
            disclaimerEl.style.display = 'flex';
            disclaimerEl.innerHTML = `<span>💡</span> <span>Order 10+ items for free delivery/pickup service at your temple location. Currently: ${totalCount} items (Stall pickup).</span>`;
            disclaimerEl.style.backgroundColor = 'var(--accent-light)';
            disclaimerEl.style.color = '#8c5d00';
        }
    }

    if (State.currentView === 'menu') {
        renderMenu();
    }
}

// Render Menu Cards
function renderMenu() {
    const grid = document.getElementById('menu-items-grid');
    if (!grid) return;

    const filtered = MenuItems.filter(item => item.category === State.activeCategory);

    let html = '';
    filtered.forEach(item => {
        const cartEntry = State.cart.find(c => c.item.id === item.id);
        const qtyInCart = cartEntry ? cartEntry.quantity : 0;

        let badgeClass = '';
        if (item.category === 'water') badgeClass = 'water-badge';

        let itemActionHtml = '';
        if (qtyInCart > 0) {
            itemActionHtml = `
                <div class="qty-selector" style="border: 1px solid var(--primary-color);">
                    <button class="qty-btn" onclick="changeCartQuantity('${item.id}', -1)">-</button>
                    <span class="qty-val">${qtyInCart}</span>
                    <button class="qty-btn" onclick="changeCartQuantity('${item.id}', 1)">+</button>
                </div>
            `;
        } else {
            itemActionHtml = `
                <button class="add-to-cart-btn" data-add-id="${item.id}" onclick="addToCart('${item.id}')">
                    <span>+</span> Add to Cart
                </button>
            `;
        }

        const imageSrc = item.image;

        html += `
            <div class="menu-card" data-id="${item.id}">
                <div class="menu-card-img-wrapper" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--accent-light), #ffe3b3); color: var(--primary-color);">
                    <img src="${imageSrc}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" alt="${item.name}">
                    <div class="menu-icon-placeholder" style="display: none; font-size: 4rem; justify-content: center; align-items: center; width: 100%; height: 100%;">${item.icon}</div>
                    <span class="menu-badge ${badgeClass}">${item.badge}</span>
                </div>
                <div class="menu-card-body">
                    <h3 class="menu-card-title">${item.name}</h3>
                    <p class="menu-card-desc">${item.desc}</p>
                    <div class="menu-card-footer">
                        <span class="menu-price">${formatRupees(item.price)}</span>
                        ${itemActionHtml}
                    </div>
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;

    document.querySelectorAll('.category-pill').forEach(pill => {
        if (pill.getAttribute('data-category') === State.activeCategory) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
}

// Category Selection
function selectCategory(category) {
    State.activeCategory = category;
    renderMenu();
}

// Checkout Form Display Setup
function proceedToCheckout() {
    if (State.cart.length === 0) return;

    const dateInput = document.getElementById('checkout-date');
    const todayStr = getTodayDateString();

    // Allow ordering for any day starting today
    dateInput.value = todayStr;
    dateInput.min = todayStr;

    // Check delivery eligibility (based on quantity)
    updateCheckoutDeliveryUI();

    // Listen to changes in date/time/quantity to dynamically update delivery status
    dateInput.addEventListener('change', updateCheckoutDeliveryUI);

    const subtotal = State.cart.reduce((sum, entry) => sum + (entry.item.price * entry.quantity), 0);
    document.getElementById('checkout-subtotal').innerText = formatRupees(subtotal);
    document.getElementById('checkout-total').innerText = formatRupees(subtotal);

    const summaryList = document.getElementById('checkout-items-list');
    summaryList.innerHTML = State.cart.map(entry => `
        <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.4rem; color:var(--text-muted);">
            <span>${entry.item.name} <strong>× ${entry.quantity}</strong></span>
            <span>${formatRupees(entry.item.price * entry.quantity)}</span>
        </div>
    `).join('');

    navigate('checkout');
}

// Update Delivery Input based on items count
function updateCheckoutDeliveryUI() {
    const totalItems = State.cart.reduce((sum, entry) => sum + entry.quantity, 0);
    const deliveryBox = document.getElementById('checkout-delivery-location-box');
    const deliveryInput = document.getElementById('checkout-delivery-location');

    if (totalItems >= 10) {
        deliveryBox.style.display = 'block';
        deliveryInput.setAttribute('required', 'true');
        document.getElementById('checkout-delivery-note').innerHTML = `
            🎉 <strong>10+ Items Special!</strong> Your order qualifies for free delivery directly to your temple location (parking lot, steps entrance, choultry, etc.). Please enter your location details below.
        `;
    } else {
        deliveryBox.style.display = 'none';
        deliveryInput.removeAttribute('required');
        deliveryInput.value = '';
    }
}

// Payment Tab Swapping
function switchPaymentMethod(method) {
    document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.payment-panel').forEach(p => p.classList.remove('active'));

    document.getElementById(`tab-${method}`).classList.add('active');
    document.getElementById(`panel-${method}`).classList.add('active');

    const cardInputs = document.querySelectorAll('#panel-card input');
    if (method === 'card') {
        cardInputs.forEach(i => i.setAttribute('required', 'true'));
    } else {
        cardInputs.forEach(i => i.removeAttribute('required'));
    }
}

// Form Submission & simulated Payment
function handleCheckoutSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const date = document.getElementById('checkout-date').value;
    const time = document.getElementById('checkout-time').value;
    
    // Delivery Location
    const deliveryLocation = document.getElementById('checkout-delivery-location') ? document.getElementById('checkout-delivery-location').value : '';

    let paymentMethod = 'Cash on Pickup';
    let paymentStatus = 'UNPAID';
    if (document.getElementById('tab-upi').classList.contains('active')) {
        paymentMethod = 'UPI';
        paymentStatus = 'PAID';
    } else if (document.getElementById('tab-card').classList.contains('active')) {
        paymentMethod = 'Card';
        paymentStatus = 'PAID';
    }

    const totalAmount = State.cart.reduce((sum, entry) => sum + (entry.item.price * entry.quantity), 0);
    const tokenNum = 'T-' + Math.floor(100 + Math.random() * 900);

    const newOrder = {
        token: tokenNum,
        name: name,
        phone: phone,
        date: date,
        time: time,
        deliveryLocation: deliveryLocation,
        items: State.cart.map(entry => ({
            id: entry.item.id,
            name: entry.item.name,
            price: entry.item.price,
            quantity: entry.quantity,
            category: entry.item.category
        })),
        total: totalAmount,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        createdAt: new Date().toISOString()
    };

    const checkoutContainer = document.querySelector('.checkout-layout');
    const headerTitle = document.querySelector('.checkout-header h2');
    headerTitle.innerText = 'Processing Pre-Order...';

    const originalContent = checkoutContainer.innerHTML;
    checkoutContainer.innerHTML = `
        <div class="payment-loading" style="grid-column: span 2; width: 100%;">
            <div class="spinner"></div>
            <h3>Securing Your Order</h3>
            <p style="color:var(--text-muted); margin-top:0.5rem; font-size:0.9rem;">
                Connecting to payment gateways. Please do not close this page...
            </p>
        </div>
    `;

    setTimeout(() => {
        const existingOrders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
        existingOrders.push(newOrder);
        localStorage.setItem('thalupulamma_orders', JSON.stringify(existingOrders));

        State.selectedOrder = newOrder;
        State.cart = [];
        updateCartUI();

        checkoutContainer.innerHTML = originalContent;
        headerTitle.innerText = 'Pre-Order Checkout';

        document.getElementById('checkout-form').reset();

        navigate('receipt');
    }, 1500);
}

// Render Receipt View
function renderReceipt() {
    const receiptContainer = document.getElementById('receipt-view');
    if (!receiptContainer || !State.selectedOrder) {
        receiptContainer.innerHTML = `
            <div style="text-align:center; padding: 4rem 2rem;">
                <h2>No Order Selected</h2>
                <p style="color:var(--text-muted); margin-bottom: 2rem;">You haven't submitted any pre-order in this session.</p>
                <button class="btn-primary" onclick="navigate('menu')">Browse Menu</button>
            </div>
        `;
        return;
    }

    const order = State.selectedOrder;

    let deliveryRowHtml = '';
    if (order.deliveryLocation) {
        deliveryRowHtml = `
            <div class="receipt-row" style="background:#e8f5e9; padding:0.4rem; border-radius:4px; margin-top:0.5rem;">
                <span style="color:#2e7d32; font-weight:700;">📍 Temple Delivery:</span>
                <strong style="color:#2e7d32;">${order.deliveryLocation}</strong>
            </div>
        `;
    } else {
        deliveryRowHtml = `
            <div class="receipt-row">
                <span style="color:var(--text-muted);">Stall Pickup:</span>
                <strong>Near Petrol Bunk Stall</strong>
            </div>
        `;
    }

    receiptContainer.innerHTML = `
        <div class="receipt-card">
            <div class="receipt-header">
                <div class="receipt-success-icon">✓</div>
                <h3>Order Confirmed!</h3>
                <div class="receipt-subheader">Order Token generated successfully</div>
                <div class="token-badge-large">${order.token}</div>
                <p style="font-size:0.85rem; color:#8c5d00; font-weight:700;">
                    ${order.deliveryLocation ? 'Relax! We will deliver to your temple location.' : 'Show this Token at our counter near the Petrol Bunk to collect your food.'}
                </p>
            </div>
            <div class="receipt-body">
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Customer:</span>
                    <strong style="color:var(--text-color);">${order.name}</strong>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Phone:</span>
                    <span>${order.phone}</span>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Pickup/Delivery Date:</span>
                    <strong>${order.date}</strong>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Pickup/Delivery Time:</span>
                    <strong>${order.time}</strong>
                </div>
                ${deliveryRowHtml}
                <div class="receipt-row" style="margin-top:0.5rem;">
                    <span style="color:var(--text-muted);">Payment Mode:</span>
                    <span>${order.paymentMethod}</span>
                </div>
                <div class="receipt-row">
                    <span style="color:var(--text-muted);">Payment Status:</span>
                    <span class="order-status-badge ${order.paymentStatus === 'PAID' ? 'status-paid' : 'status-unpaid'}">
                        ${order.paymentStatus}
                    </span>
                </div>

                <div class="receipt-items-list">
                    ${order.items.map(item => `
                        <div class="receipt-item-line">
                            <span>${item.name} <strong>× ${item.quantity}</strong></span>
                            <span>${formatRupees(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                    <div class="receipt-row total">
                        <span>Total:</span>
                        <span>${formatRupees(order.total)}</span>
                    </div>
                </div>

                <div style="display:flex; justify-content:center; margin-top:1.5rem;">
                    <div style="padding:10px; border:1px solid var(--border-color); background:white; display:inline-block; border-radius:8px;">
                        <div style="width:100px; height:100px; background:linear-gradient(45deg, #111, #444); border-radius:4px; display:flex; align-items:center; justify-content:center; color:white; font-size:0.5rem; text-align:center;">
                            TOKEN QR CODE<br>VERIFICATION
                        </div>
                    </div>
                </div>

                <div class="receipt-instructions">
                    <p style="font-weight:700; color:var(--text-color); margin-bottom:0.5rem;">🚩 Location Guide</p>
                    <p style="font-size:0.75rem; line-height:1.4;">
                        Our shop is located on the Sri Thalupulamma Temple Road, right next to the petrol bunk, Lova. If you need help, feel free to write to us at <strong style="color:var(--primary-color);">thalupulammakitchen@gmail.com</strong>.
                    </p>
                </div>
                
                <div style="margin-top:2rem; display:flex; gap:1rem;">
                    <button class="btn-secondary" style="flex:1;" onclick="window.print()">Print Receipt</button>
                    <button class="btn-primary" style="flex:1;" onclick="navigate('menu')">Order More</button>
                </div>
            </div>
        </div>
    `;
}

// OWNER DASHBOARD LOGIC
function renderDashboard() {
    const ordersListContainer = document.getElementById('dashboard-orders-container');
    const prepListContainer = document.getElementById('dashboard-prep-container');
    const datePicker = document.getElementById('dashboard-date-select');

    if (!datePicker.value) {
        datePicker.value = getTodayDateString(); // Default to today on dashboard load
    }

    const targetDate = datePicker.value;
    const allOrders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
    const dayOrders = allOrders.filter(o => o.date === targetDate);

    const prepCounts = {};
    let totalRevenue = 0;

    dayOrders.forEach(order => {
        totalRevenue += order.total;
        order.items.forEach(item => {
            if (prepCounts[item.name]) {
                prepCounts[item.name] += item.quantity;
            } else {
                prepCounts[item.name] = item.quantity;
            }
        });
    });

    document.getElementById('dash-total-bookings').innerText = dayOrders.length;
    document.getElementById('dash-total-revenue').innerText = formatRupees(totalRevenue);
    document.getElementById('dash-prep-items-count').innerText = Object.keys(prepCounts).length;

    if (Object.keys(prepCounts).length === 0) {
        prepListContainer.innerHTML = `
            <div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size:0.9rem;">
                No orders scheduled for this date.
            </div>
        `;
    } else {
        let prepHtml = '';
        for (const [itemName, quantity] of Object.entries(prepCounts)) {
            const menuItem = MenuItems.find(i => i.name === itemName);
            const icon = menuItem ? menuItem.icon : '🍽️';

            prepHtml += `
                <div class="prep-item">
                    <span class="prep-item-name"><span>${icon}</span> ${itemName}</span>
                    <span class="prep-item-count">${quantity} portions</span>
                </div>
            `;
        }
        prepListContainer.innerHTML = prepHtml;
    }

    if (dayOrders.length === 0) {
        ordersListContainer.innerHTML = `
            <div style="text-align:center; padding:4rem; color:var(--text-muted); border: 1px dashed var(--border-color); border-radius:12px;">
                <span style="font-size:2.5rem; display:block; margin-bottom:1rem;">📅</span>
                <h3>No Orders Found</h3>
                <p style="font-size:0.85rem; margin-top:0.4rem;">
                    Pre-orders submitted for ${targetDate} will appear here instantly.
                </p>
            </div>
        `;
    } else {
        const sortedOrders = [...dayOrders].sort((a,b) => a.time.localeCompare(b.time));

        ordersListContainer.innerHTML = sortedOrders.map(order => {
            const itemString = order.items.map(i => `${i.name} (${i.quantity})`).join(', ');
            let deliveryText = '';
            if (order.deliveryLocation) {
                deliveryText = `<div style="font-size:0.75rem; color:#2e7d32; font-weight:700; margin-top:0.25rem;">📍 Delivery: ${order.deliveryLocation}</div>`;
            } else {
                deliveryText = `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">🚶 Pickup at Petrol Bunk Stall</div>`;
            }

            return `
                <div class="order-row-card" id="order-card-${order.token}">
                    <div class="order-row-header">
                        <div>
                            <div class="order-cust-name">${order.name}</div>
                            <div class="order-cust-phone">📱 ${order.phone} | Time: <strong>${order.time}</strong></div>
                            ${deliveryText}
                        </div>
                        <div class="order-token">${order.token}</div>
                    </div>
                    <div class="order-row-body">
                        <div class="order-items-desc">🛒 ${itemString}</div>
                        <div>
                            <span class="order-status-badge ${order.paymentStatus === 'PAID' ? 'status-paid' : 'status-unpaid'}">
                                ${order.paymentStatus} (${order.paymentMethod})
                            </span>
                        </div>
                    </div>
                    <div class="order-row-actions">
                        <button class="btn-sm-action btn-complete" onclick="markOrderCompleted('${order.token}')">✓ Prepared / Delivered</button>
                        <button class="btn-sm-action btn-delete" onclick="deleteOrder('${order.token}')">Cancel Order</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Complete Order
function markOrderCompleted(token) {
    const card = document.getElementById(`order-card-${token}`);
    if (card) {
        card.style.opacity = '0.4';
        card.style.transform = 'scale(0.98)';
        const completeBtn = card.querySelector('.btn-complete');
        completeBtn.innerText = 'Completed';
        completeBtn.style.backgroundColor = '#6c757d';
        completeBtn.disabled = true;

        const allOrders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
        const idx = allOrders.findIndex(o => o.token === token);
        if (idx !== -1) {
            allOrders[idx].paymentStatus = 'PAID';
            localStorage.setItem('thalupulamma_orders', JSON.stringify(allOrders));
        }

        setTimeout(() => {
            renderDashboard();
        }, 1000);
    }
}

// Cancel / Delete Order from Dashboard
function deleteOrder(token) {
    if (confirm(`Are you sure you want to cancel order ${token}?`)) {
        const allOrders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
        const filtered = allOrders.filter(o => o.token !== token);
        localStorage.setItem('thalupulamma_orders', JSON.stringify(filtered));
        renderDashboard();
    }
}

// Pre-fill Sample Data for Demonstration
function seedSampleData() {
    const allOrders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
    
    if (allOrders.length === 0) {
        const todayStr = getTodayDateString();
        const tomorrowStr = getTomorrowDateString();
        const samples = [
            {
                token: 'T-102',
                name: 'Rama Krishna',
                phone: '9848022338',
                date: todayStr,
                time: '07:30',
                deliveryLocation: '',
                items: [
                    { id: 'tif-idly', name: 'Steam Idly (4 Pcs)', price: 30, quantity: 2, category: 'tiffins' },
                    { id: 'tif-plain-dosa', name: 'Crispy Plain Dosa', price: 30, quantity: 1, category: 'tiffins' },
                    { id: 'tea-special', name: 'Special Cardamom Tea', price: 15, quantity: 3, category: 'tea' }
                ],
                total: 135,
                paymentMethod: 'UPI',
                paymentStatus: 'PAID',
                createdAt: new Date().toISOString()
            },
            {
                token: 'T-205',
                name: 'Srinivas Murthy (Pilgrim group)',
                phone: '9440156722',
                date: tomorrowStr,
                time: '08:15',
                deliveryLocation: 'Hill Steps Rest Room Choultry',
                items: [
                    { id: 'tif-puri', name: 'Puri Bhaji (2 Pcs)', price: 30, quantity: 10, category: 'tiffins' },
                    { id: 'tif-bonda', name: 'Mysore Bonda (4 Pcs)', price: 30, quantity: 5, category: 'tiffins' },
                    { id: 'wat-cool-can', name: 'Cool Water Can (20L)', price: 40, quantity: 2, category: 'water' }
                ],
                total: 530,
                paymentMethod: 'Cash on Pickup',
                paymentStatus: 'UNPAID',
                createdAt: new Date().toISOString()
            }
        ];
        
        localStorage.setItem('thalupulamma_orders', JSON.stringify(samples));
    }
}

// Initialise Events
window.addEventListener('DOMContentLoaded', () => {
    seedSampleData();

    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme);
    document.getElementById('cart-trigger-btn').addEventListener('click', openCart);
    document.getElementById('cart-close-btn').addEventListener('click', closeCart);
    document.getElementById('backdrop').addEventListener('click', closeCart);

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.getAttribute('data-view');
            navigate(view);
        });
    });

    document.getElementById('cta-menu').addEventListener('click', () => navigate('menu'));
    document.getElementById('cta-dashboard').addEventListener('click', () => navigate('dashboard'));

    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-category');
            selectCategory(cat);
        });
    });

    document.getElementById('checkout-form').addEventListener('submit', handleCheckoutSubmit);
    document.getElementById('dashboard-date-select').addEventListener('change', renderDashboard);

    navigate('home');
    updateCartUI();
});
