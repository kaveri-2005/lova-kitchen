// Application State
const State = {
    activeCategory: 'tiffins',
    currentView: 'home',
    theme: 'light',
    cart: [],
    orders: [],
    selectedOrder: null,
    isAdminAuthenticated: false,
    currentUser: null,
    dbConfig: null,
    users: [],
    isCloudSynced: false
};

// DATABASE INTERFACE LAYER (DUAL-MODE: FIREBASE CLOUD / LOCALSTORAGE FALLBACK)
const DB = {
    db: null,
    isInitialized: false,
    
    async init() {
        // 1. Try to load config from localStorage
        const storedConfig = localStorage.getItem('thalupulamma_firebase_config');
        if (!storedConfig) {
            console.log("DB: Running in LocalStorage mode (No Cloud config).");
            this.isInitialized = false;
            State.isCloudSynced = false;
            this.updateStatusBadge();
            
            // Seed local storage with defaults if not present
            if (!localStorage.getItem('thalupulamma_users')) {
                localStorage.setItem('thalupulamma_users', JSON.stringify([]));
            }
            State.users = JSON.parse(localStorage.getItem('thalupulamma_users') || '[]');
            State.orders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
            return;
        }
        
        try {
            const config = JSON.parse(storedConfig);
            if (!config.apiKey || !config.projectId) {
                throw new Error("Invalid config keys.");
            }
            
            // Initialize Firebase App if not initialized
            if (firebase.apps.length === 0) {
                firebase.initializeApp(config);
            }
            
            this.db = firebase.firestore();
            this.isInitialized = true;
            State.isCloudSynced = true;
            console.log("DB: Successfully connected to Firebase Cloud Firestore.");
            this.updateStatusBadge();
            
            // Setup real-time listeners for live updates
            this.setupListeners();
            
            // Sync offline/local items to cloud if there are any
            await this.syncOfflineData();
            
        } catch (e) {
            console.error("DB: Firebase Init failed, falling back to LocalStorage.", e);
            this.isInitialized = false;
            State.isCloudSynced = false;
            this.updateStatusBadge();
            
            State.users = JSON.parse(localStorage.getItem('thalupulamma_users') || '[]');
            State.orders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
        }
    },
    
    updateStatusBadge() {
        const badge = document.getElementById('firebase-status-text');
        if (badge) {
            if (State.isCloudSynced) {
                badge.className = 'status-badge online';
                badge.innerText = '● Connected & Synced (Cloud Mode)';
            } else {
                badge.className = 'status-badge offline';
                badge.innerText = '● Local Storage Mode (Cloud Offline)';
            }
        }
    },
    
    setupListeners() {
        if (!this.isInitialized || !this.db) return;
        
        // Listen to orders
        this.db.collection('orders')
            .onSnapshot(snapshot => {
                let changed = false;
                let isNewOrderAdded = false;
                const newOrdersList = [];
                
                snapshot.forEach(doc => {
                    newOrdersList.push({ id: doc.id, ...doc.data() });
                });
                
                // Sort by createdAt to match order of entry
                newOrdersList.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
                
                // Check if a new order was added
                if (State.orders.length > 0 && newOrdersList.length > State.orders.length) {
                    isNewOrderAdded = true;
                }
                
                State.orders = newOrdersList;
                localStorage.setItem('thalupulamma_orders', JSON.stringify(State.orders));
                
                // If new order, play sound alert!
                if (isNewOrderAdded && State.currentView === 'dashboard' && State.isAdminAuthenticated) {
                    playNewOrderSound();
                }
                
                // If dashboard is currently showing, re-render it
                if (State.currentView === 'dashboard') {
                    renderDashboard();
                    renderCustomerDirectory();
                }
            }, error => {
                console.error("Firestore orders listen error:", error);
            });
            
        // Listen to reviews
        this.db.collection('reviews')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const newReviewsList = [];
                snapshot.forEach(doc => {
                    newReviewsList.push({ id: doc.id, ...doc.data() });
                });
                
                if (newReviewsList.length > 0) {
                    localStorage.setItem('thalupulamma_reviews', JSON.stringify(newReviewsList));
                    renderReviews();
                }
            }, error => {
                console.error("Firestore reviews listen error:", error);
            });
            
        // Listen to users
        this.db.collection('users')
            .onSnapshot(snapshot => {
                const newUsersList = [];
                snapshot.forEach(doc => {
                    newUsersList.push({ id: doc.id, ...doc.data() });
                });
                State.users = newUsersList;
                localStorage.setItem('thalupulamma_users', JSON.stringify(State.users));
                
                if (State.currentView === 'dashboard') {
                    renderCustomerDirectory();
                }
            }, error => {
                console.error("Firestore users listen error:", error);
            });
    },
    
    async syncOfflineData() {
        if (!this.isInitialized || !this.db) return;
        
        // 1. Sync orders (that are not yet in Firestore)
        const localOrders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
        for (const order of localOrders) {
            // Check if exists in remote
            const querySnapshot = await this.db.collection('orders').where('token', '==', order.token).get();
            if (querySnapshot.empty) {
                await this.db.collection('orders').add(order);
                console.log(`DB: Synced local order ${order.token} to cloud.`);
            }
        }
        
        // 2. Sync reviews
        const localReviews = JSON.parse(localStorage.getItem('thalupulamma_reviews') || '[]');
        for (const review of localReviews) {
            // Check if exists in remote by matching comment and name
            const querySnapshot = await this.db.collection('reviews')
                .where('name', '==', review.name)
                .where('comment', '==', review.comment)
                .get();
            if (querySnapshot.empty) {
                review.createdAt = review.createdAt || new Date().toISOString();
                await this.db.collection('reviews').add(review);
                console.log(`DB: Synced local review from ${review.name} to cloud.`);
            }
        }
        
        // 3. Sync users
        const localUsers = JSON.parse(localStorage.getItem('thalupulamma_users') || '[]');
        for (const user of localUsers) {
            const querySnapshot = await this.db.collection('users').where('phone', '==', user.phone).get();
            if (querySnapshot.empty) {
                await this.db.collection('users').add(user);
                console.log(`DB: Synced local user ${user.name} to cloud.`);
            }
        }
    },
    
    async getOrders() {
        if (this.isInitialized && this.db) {
            const snapshot = await this.db.collection('orders').get();
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } else {
            return JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
        }
    },
    
    async addOrder(order) {
        if (this.isInitialized && this.db) {
            await this.db.collection('orders').add(order);
        } else {
            const orders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
            orders.push(order);
            localStorage.setItem('thalupulamma_orders', JSON.stringify(orders));
            State.orders = orders;
            
            if (State.currentView === 'dashboard' && State.isAdminAuthenticated) {
                playNewOrderSound();
                renderDashboard();
            }
        }
    },
    
    async getReviews() {
        if (this.isInitialized && this.db) {
            const snapshot = await this.db.collection('reviews').orderBy('createdAt', 'desc').get();
            const list = [];
            snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
            return list;
        } else {
            return JSON.parse(localStorage.getItem('thalupulamma_reviews') || '[]');
        }
    },
    
    async addReview(review) {
        review.createdAt = review.createdAt || new Date().toISOString();
        if (this.isInitialized && this.db) {
            await this.db.collection('reviews').add(review);
        } else {
            const reviews = JSON.parse(localStorage.getItem('thalupulamma_reviews') || '[]');
            reviews.unshift(review);
            localStorage.setItem('thalupulamma_reviews', JSON.stringify(reviews));
            renderReviews();
        }
    },
    
    async addUser(user) {
        if (this.isInitialized && this.db) {
            const querySnapshot = await this.db.collection('users').where('phone', '==', user.phone).get();
            if (querySnapshot.empty) {
                await this.db.collection('users').add(user);
                console.log(`DB: Registered user ${user.name} on Firestore.`);
            } else {
                const docId = querySnapshot.docs[0].id;
                await this.db.collection('users').doc(docId).update({
                    lastLoggedIn: new Date().toISOString(),
                    name: user.name
                });
            }
        } else {
            const users = JSON.parse(localStorage.getItem('thalupulamma_users') || '[]');
            const idx = users.findIndex(u => u.phone === user.phone);
            if (idx === -1) {
                users.push(user);
            } else {
                users[idx].lastLoggedIn = new Date().toISOString();
                users[idx].name = user.name;
            }
            localStorage.setItem('thalupulamma_users', JSON.stringify(users));
            State.users = users;
        }
    },
    
    async updateOrderPaymentStatus(token, status) {
        if (this.isInitialized && this.db) {
            const querySnapshot = await this.db.collection('orders').where('token', '==', token).get();
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                await this.db.collection('orders').doc(docId).update({ paymentStatus: status });
            }
        } else {
            const orders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
            const idx = orders.findIndex(o => o.token === token);
            if (idx !== -1) {
                orders[idx].paymentStatus = status;
                localStorage.setItem('thalupulamma_orders', JSON.stringify(orders));
                State.orders = orders;
                renderDashboard();
            }
        }
    },
    
    async deleteOrder(token) {
        if (this.isInitialized && this.db) {
            const querySnapshot = await this.db.collection('orders').where('token', '==', token).get();
            if (!querySnapshot.empty) {
                const docId = querySnapshot.docs[0].id;
                await this.db.collection('orders').doc(docId).delete();
            }
        } else {
            const orders = JSON.parse(localStorage.getItem('thalupulamma_orders') || '[]');
            const filtered = orders.filter(o => o.token !== token);
            localStorage.setItem('thalupulamma_orders', JSON.stringify(filtered));
            State.orders = filtered;
            renderDashboard();
        }
    }
};

// CUSTOMER AUTHENTICATION INTERACTIVE LOGIC
let customerLoginCallback = null;

function showCustomerLoginModal(callback = null) {
    customerLoginCallback = callback;
    const modal = document.getElementById('customer-login-modal');
    if (modal) {
        modal.classList.add('open');
        document.getElementById('customer-login-phone').focus();
    }
}

function closeCustomerLoginModal() {
    const modal = document.getElementById('customer-login-modal');
    if (modal) {
        modal.classList.remove('open');
        document.getElementById('customer-login-form').reset();
        const regFields = document.getElementById('customer-register-fields');
        if (regFields) {
            regFields.style.maxHeight = '0px';
            regFields.style.opacity = '0';
        }
        const statusMsg = document.getElementById('customer-login-status-msg');
        if (statusMsg) statusMsg.style.display = 'none';
        
        const submitBtn = document.getElementById('customer-login-submit-btn');
        if (submitBtn) submitBtn.innerText = 'Verify Phone';
    }
    customerLoginCallback = null;
}

function initCustomerLoginListeners() {
    const phoneInput = document.getElementById('customer-login-phone');
    if (!phoneInput) return;
    
    phoneInput.addEventListener('input', (e) => {
        const phone = e.target.value.trim();
        const regFields = document.getElementById('customer-register-fields');
        const nameInput = document.getElementById('customer-login-name');
        const submitBtn = document.getElementById('customer-login-submit-btn');
        const statusMsg = document.getElementById('customer-login-status-msg');
        
        if (phone.length === 10 && /^[0-9]+$/.test(phone)) {
            const existingUser = State.users.find(u => u.phone === phone);
            
            if (existingUser) {
                if (statusMsg) {
                    statusMsg.style.color = 'var(--primary-color)';
                    statusMsg.innerText = `Welcome back, ${existingUser.name}!`;
                    statusMsg.style.display = 'block';
                }
                if (regFields) {
                    regFields.style.maxHeight = '0px';
                    regFields.style.opacity = '0';
                }
                if (nameInput) {
                    nameInput.removeAttribute('required');
                    nameInput.value = '';
                }
                if (submitBtn) submitBtn.innerText = 'Confirm & Log In';
            } else {
                if (statusMsg) {
                    statusMsg.style.color = 'var(--accent-color)';
                    statusMsg.innerText = 'New mobile number. Please enter your name to register.';
                    statusMsg.style.display = 'block';
                }
                if (regFields) {
                    regFields.style.maxHeight = '150px';
                    regFields.style.opacity = '1';
                }
                if (nameInput) {
                    nameInput.setAttribute('required', 'true');
                    nameInput.focus();
                }
                if (submitBtn) submitBtn.innerText = 'Register & Log In';
            }
        } else {
            if (regFields) {
                regFields.style.maxHeight = '0px';
                regFields.style.opacity = '0';
            }
            if (nameInput) {
                nameInput.removeAttribute('required');
            }
            if (statusMsg) statusMsg.style.display = 'none';
            if (submitBtn) submitBtn.innerText = 'Verify Phone';
        }
    });
}

async function handleCustomerLoginSubmit(event) {
    event.preventDefault();
    const phone = document.getElementById('customer-login-phone').value.trim();
    const nameInput = document.getElementById('customer-login-name');
    
    let name = '';
    const existingUser = State.users.find(u => u.phone === phone);
    if (existingUser) {
        name = existingUser.name;
    } else {
        name = nameInput.value.trim();
    }
    
    if (!name || phone.length !== 10) return;
    
    const userObj = {
        name: name,
        phone: phone,
        createdAt: new Date().toISOString(),
        lastLoggedIn: new Date().toISOString()
    };
    
    await DB.addUser(userObj);
    
    State.currentUser = userObj;
    localStorage.setItem('thalupulamma_user', JSON.stringify(userObj));
    
    syncUserUI();
    closeCustomerLoginModal();
    
    if (customerLoginCallback) {
        customerLoginCallback();
    }
}

function showCustomerProfileModal() {
    if (!State.currentUser) return;
    
    const modal = document.getElementById('customer-profile-modal');
    if (!modal) return;
    
    document.getElementById('profile-name').innerText = State.currentUser.name;
    document.getElementById('profile-phone').innerText = '+91 ' + State.currentUser.phone;
    document.getElementById('profile-avatar').innerText = State.currentUser.name.charAt(0).toUpperCase() || '👤';
    
    const userOrders = State.orders.filter(o => o.phone === State.currentUser.phone);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
    
    document.getElementById('profile-status-badge').innerText = `Placed ${userOrders.length} orders • Spent ₹${totalSpent}`;
    
    const ordersContainer = document.getElementById('profile-orders-list');
    if (ordersContainer) {
        if (userOrders.length === 0) {
            ordersContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 2rem 0;">No order history found yet.</p>`;
        } else {
            const sorted = [...userOrders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            ordersContainer.innerHTML = sorted.map(o => {
                const dateDisplay = new Date(o.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                return `
                    <div class="profile-order-card" style="margin-bottom:0.5rem;">
                        <div class="profile-order-header">
                            <span style="color:var(--primary-color); font-weight:700;">${o.token}</span>
                            <span>₹${o.total}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
                            <span>${dateDisplay} • ${o.time}</span>
                            <span style="font-weight:700; color:${o.paymentStatus === 'PAID' ? '#2e7d32' : 'var(--accent-color)'}">${o.paymentStatus}</span>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem; border-top:1px dashed var(--border-color); padding-top:0.4rem;">
                            ${o.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    modal.classList.add('open');
}

function closeCustomerProfileModal() {
    const modal = document.getElementById('customer-profile-modal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function handleCustomerLogout() {
    State.currentUser = null;
    localStorage.removeItem('thalupulamma_user');
    
    syncUserUI();
    closeCustomerProfileModal();
    
    alert('Logged out successfully.');
}

function syncUserUI() {
    const userContainer = document.getElementById('customer-profile-container');
    const checkoutName = document.getElementById('checkout-name');
    const checkoutPhone = document.getElementById('checkout-phone');
    const reviewName = document.getElementById('review-name');

    if (State.currentUser) {
        if (userContainer) {
            userContainer.innerHTML = `
                <button class="nav-btn" id="customer-profile-btn" onclick="showCustomerProfileModal()" style="display: inline-flex; align-items: center; gap: 0.25rem; font-weight:600; padding: 0.5rem 0.75rem;">
                    <span>${State.currentUser.name.split(' ')[0]} 👤</span>
                </button>
            `;
        }
        if (checkoutName) {
            checkoutName.value = State.currentUser.name;
            checkoutName.setAttribute('readonly', 'true');
            checkoutName.style.backgroundColor = 'var(--bg-card)';
            checkoutName.style.cursor = 'not-allowed';
        }
        if (checkoutPhone) {
            checkoutPhone.value = State.currentUser.phone;
            checkoutPhone.setAttribute('readonly', 'true');
            checkoutPhone.style.backgroundColor = 'var(--bg-card)';
            checkoutPhone.style.cursor = 'not-allowed';
        }
        if (reviewName) {
            reviewName.value = State.currentUser.name;
            reviewName.setAttribute('readonly', 'true');
            reviewName.style.backgroundColor = 'var(--bg-card)';
            reviewName.style.cursor = 'not-allowed';
        }
        
        let logoutLink = document.getElementById('checkout-logout-link');
        if (!logoutLink && checkoutPhone) {
            logoutLink = document.createElement('a');
            logoutLink.id = 'checkout-logout-link';
            logoutLink.href = '#';
            logoutLink.style.fontSize = '0.8rem';
            logoutLink.style.color = 'var(--danger-color)';
            logoutLink.style.display = 'block';
            logoutLink.style.marginTop = '0.5rem';
            logoutLink.innerText = 'Not you? Log Out Session';
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                handleCustomerLogout();
            });
            checkoutPhone.parentNode.appendChild(logoutLink);
        }
    } else {
        if (userContainer) {
            userContainer.innerHTML = `
                <button class="nav-btn" id="customer-login-btn" onclick="showCustomerLoginModal()" style="display: inline-flex; align-items: center; gap: 0.25rem; font-weight:600; padding: 0.5rem 0.75rem;">
                    <span>👤 Log In</span>
                </button>
            `;
        }
        if (checkoutName) {
            checkoutName.value = '';
            checkoutName.removeAttribute('readonly');
            checkoutName.style.backgroundColor = '';
            checkoutName.style.cursor = '';
        }
        if (checkoutPhone) {
            checkoutPhone.value = '';
            checkoutPhone.removeAttribute('readonly');
            checkoutPhone.style.backgroundColor = '';
            checkoutPhone.style.cursor = '';
        }
        if (reviewName) {
            reviewName.value = '';
            reviewName.removeAttribute('readonly');
            reviewName.style.backgroundColor = '';
            reviewName.style.cursor = '';
        }
        const logoutLink = document.getElementById('checkout-logout-link');
        if (logoutLink) logoutLink.remove();
    }
}

// Sound synthesized double ding chime using Web Audio API
function playNewOrderSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        const ctx = new AudioContext();
        
        const playTone = (freq, startTime, duration) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        playTone(523.25, ctx.currentTime, 0.15); // C5
        playTone(659.25, ctx.currentTime + 0.15, 0.3); // E5
        
    } catch (e) {
        console.warn("Audio Context sound failed to play", e);
    }
}


// Menu Database (5 Partitions - Cashews Removed)
const DefaultMenuItems = [
    // 1. Tiffins (Morning)
    {
        id: 'tif-idly',
        name: 'Steam Idly (4 Pcs)',
        category: 'tiffins',
        price: 30,
        desc: 'Soft, fluffy, steaming hot rice cakes served with ginger chutney and peanut chutney.',
        image: 'assets/idily.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-plain-dosa',
        name: 'Crispy Plain Dosa',
        category: 'tiffins',
        price: 30,
        desc: 'Crisp golden crepe made from fermented rice-lentil batter, served with spicy ginger chutney and peanut chutney.',
        image: 'assets/plaindosa.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-onion-dosa',
        name: 'Onion Dosa',
        category: 'tiffins',
        price: 40,
        desc: 'Crispy golden dosa topped with finely chopped onions, green chilies, and fresh coriander leaves.',
        image: 'assets/oniondosa.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-puri',
        name: 'Puri Bhaji (2 Pcs)',
        category: 'tiffins',
        price: 30,
        desc: 'Golden-fried puffy wheat flatbreads served with a spiced potato gravy (bhaji) and coconut chutney.',
        image: 'assets/puri.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-bonda',
        name: 'Mysore Bonda (4 Pcs)',
        category: 'tiffins',
        price: 30,
        desc: 'Crispy outside, fluffy inside fried dumplings made of flour, yogurt, and spices, served with coconut chutney.',
        image: 'assets/bonda.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-pesarattu',
        name: 'Pesarattu Dosa',
        category: 'tiffins',
        price: 45,
        desc: 'Healthy, protein-rich crepe made of whole green gram (moong dal) batter, topped with ginger and onions.',
        image: 'assets/pesattu.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-egg-dosa',
        name: 'Egg Dosa',
        category: 'tiffins',
        price: 50,
        desc: 'Crispy dosa roasted with a freshly cracked egg, local spices, and onions. High protein breakfast.',
        image: 'assets/eggdosa.webp',
        badge: 'Fresh & Hot',
        icon: '🥞'
    },
    {
        id: 'tif-double-egg-dosa',
        name: 'Double Egg Dosa',
        category: 'tiffins',
        price: 60,
        desc: 'Loaded dosa roasted with two cracked eggs, crushed black pepper, green chilies, and coriander.',
        image: 'assets/eggdosa.webp',
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
        image: 'assets/normalwater.webp',
        badge: 'Ready Stock',
        icon: '💧'
    },
    {
        id: 'wat-cool-can',
        name: 'Cool Water Can (20L)',
        category: 'water',
        price: 40,
        desc: 'Chilled purified drinking water can. Keeps your tourist group refreshed under the hot coastal sun.',
        image: 'assets/coolinwater.webp',
        badge: 'Ready Stock',
        icon: '❄️'
    },
    {
        id: 'wat-bottle-1l',
        name: 'Chilled Water Bottle (1L)',
        category: 'water',
        price: 20,
        desc: 'Chilled, sealed mineral water bottle for quick convenience while climbing the temple steps.',
        image: 'assets/20rswaterbottle.webp',
        badge: 'Ready Stock',
        icon: '💧'
    },
    {
        id: 'wat-bottle-2l',
        name: 'Chilled Water Bottle (2L)',
        category: 'water',
        price: 30,
        desc: 'Large chilled mineral water bottle, ideal for groups and pilgrim families.',
        image: 'assets/2lit.webp',
        badge: 'Ready Stock',
        icon: '💧'
    },
    {
        id: 'wat-bottle-500ml',
        name: 'Chilled Water Bottle (500ml)',
        category: 'water',
        price: 10,
        desc: 'Half-litre chilled mineral water bottle, easy to carry while visiting the temple.',
        image: 'assets/10rsbottle.webp',
        badge: 'Ready Stock',
        icon: '💧'
    },
    {
        id: 'wat-packet',
        name: 'Purified Water Packet',
        category: 'water',
        price: 2,
        desc: 'Single purified water packet for instant thirst quenching.',
        image: 'assets/waterpacket.webp',
        badge: 'Ready Stock',
        icon: '💧'
    },

    // 3. Tea Time
    {
        id: 'tea-normal',
        name: 'Tea',
        category: 'tea',
        price: 10,
        desc: 'Traditional freshly brewed hot milk tea. Perfect morning kick starter.',
        image: 'assets/tea_normal.png',
        badge: 'Hot & Fresh',
        icon: '☕'
    },
    {
        id: 'tea-special',
        name: 'Special Tea',
        category: 'tea',
        price: 15,
        desc: 'Premium rich milk tea brewed to perfection with select tea leaves.',
        image: 'assets/tea_special.png',
        badge: 'Stall Special',
        icon: '☕'
    },
    {
        id: 'tea-ginger',
        name: 'Ginger Tea',
        category: 'tea',
        price: 20,
        desc: 'Hot milk tea infused with freshly crushed zesty ginger root.',
        image: 'assets/tea_ginger.png',
        badge: 'Immunity Booster',
        icon: '☕'
    },
    {
        id: 'tea-cardamom',
        name: 'Cardamom Tea',
        category: 'tea',
        price: 20,
        desc: 'Fragrant and soothing hot tea flavored with crushed green cardamom pods.',
        image: 'assets/tea_cardamom.png',
        badge: 'Best Seller',
        icon: '☕'
    },
    {
        id: 'tea-bellam',
        name: 'Bellam Tea',
        category: 'tea',
        price: 20,
        desc: 'Healthy hot milk tea brewed with natural organic jaggery (bellam) instead of sugar.',
        image: 'assets/tea_jaggery.png',
        badge: 'Healthy Choice',
        icon: '☕'
    },
    {
        id: 'tea-allmix',
        name: 'All Mix Tea',
        category: 'tea',
        price: 25,
        desc: 'Ultimate hot blend of ginger, cardamom, and organic jaggery (bellam) tea.',
        image: 'assets/tea_allmix.png',
        badge: 'Stall Signature',
        icon: '☕'
    },
    {
        id: 'tea-coffee',
        name: 'Coffee',
        category: 'tea',
        price: 20,
        desc: 'Hot aromatic coffee frothed with thick hot milk.',
        image: 'assets/coffee_filter.png',
        badge: 'Aromatic',
        icon: '☕'
    },
    {
        id: 'tea-bellam-coffee',
        name: 'Bellam Coffee',
        category: 'tea',
        price: 20,
        desc: 'Traditional hot filter coffee brewed with healthy organic jaggery (bellam).',
        image: 'assets/coffee_bellam.png',
        badge: 'Jaggery Special',
        icon: '☕'
    },
    {
        id: 'tea-sugarless',
        name: 'Sugar Less Tea',
        category: 'tea',
        price: 15,
        desc: 'Freshly brewed hot milk tea prepared without any added sugar.',
        image: 'assets/tea_sugarless.png',
        badge: 'Diabetic Friendly',
        icon: '☕'
    },
    {
        id: 'tea-sugarless-coffee',
        name: 'Sugar Less Coffee',
        category: 'tea',
        price: 20,
        desc: 'Hot aromatic coffee frothed with thick hot milk, served without sugar.',
        image: 'assets/coffee_sugarless.png',
        badge: 'Diabetic Friendly',
        icon: '☕'
    },

    // 4. Cool Drinks, Icecreams & Kirana
    {
        id: 'drk-tu-2l',
        name: 'Thums Up (2 Litre)',
        category: 'drinks',
        price: 100,
        desc: 'Chilled, large family bottle of Thums Up cola. Perfect for group travelers.',
        image: 'assets/assets/thumsup2li.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-sp-2l',
        name: 'Sprite (2 Litre)',
        category: 'drinks',
        price: 100,
        desc: 'Chilled, refreshing green bottle of lemon-lime Sprite. Perfect for group travelers.',
        image: 'assets/assets/sprite2litr.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-fa-2l',
        name: 'Fanta (2 Litre)',
        category: 'drinks',
        price: 100,
        desc: 'Chilled, fizzy orange flavored Fanta bottle. Perfect for group travelers.',
        image: 'assets/assets/2litfanta.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-li-2l',
        name: 'Limca (2 Litre)',
        category: 'drinks',
        price: 100,
        desc: 'Chilled, fresh and tangy lemon-lime Limca bottle. Perfect for group travelers.',
        image: 'assets/assets/2litlimca.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-tu-1l',
        name: 'Thums Up (1 Litre)',
        category: 'drinks',
        price: 60,
        desc: 'Chilled bottle of strong, fizzy Thums Up cola.',
        image: 'assets/assets/1litthumsup.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-sp-1l',
        name: 'Sprite (1 Litre)',
        category: 'drinks',
        price: 60,
        desc: 'Chilled bottle of refreshing lemon-lime Sprite.',
        image: 'assets/assets/spritelitr.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-fa-1l',
        name: 'Fanta (1 Litre)',
        category: 'drinks',
        price: 60,
        desc: 'Chilled bottle of bubbly orange flavored Fanta.',
        image: 'assets/assets/1litfanta.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-li-1l',
        name: 'Limca (1 Litre)',
        category: 'drinks',
        price: 60,
        desc: 'Chilled bottle of classic tangy Limca.',
        image: 'assets/assets/1litrelimca.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-tu-500ml',
        name: 'Thums Up (500ml)',
        category: 'drinks',
        price: 40,
        desc: 'Chilled, convenient half-litre Thums Up bottle.',
        image: 'assets/assets/halflitthum.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-sp-500ml',
        name: 'Sprite (500ml)',
        category: 'drinks',
        price: 40,
        desc: 'Chilled, convenient half-litre Sprite bottle.',
        image: 'assets/assets/halflitsprite.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-fa-500ml',
        name: 'Fanta (500ml)',
        category: 'drinks',
        price: 40,
        desc: 'Chilled, convenient half-litre Fanta bottle.',
        image: 'assets/assets/halflitrefanata.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-li-500ml',
        name: 'Limca (500ml)',
        category: 'drinks',
        price: 40,
        desc: 'Chilled, convenient half-litre Limca bottle.',
        image: 'assets/assets/halflitrlimca.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-tu-250ml',
        name: 'Thums Up (250ml)',
        category: 'drinks',
        price: 20,
        desc: 'Small chilled bottle of Thums Up cola.',
        image: 'assets/assets/20rsthumpsup.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-sp-250ml',
        name: 'Sprite (250ml)',
        category: 'drinks',
        price: 20,
        desc: 'Small chilled bottle of Sprite.',
        image: 'assets/assets/sprite20rs.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-fa-250ml',
        name: 'Fanta (250ml)',
        category: 'drinks',
        price: 20,
        desc: 'Small chilled bottle of orange Fanta.',
        image: 'assets/assets/20rsfanta.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-li-250ml',
        name: 'Limca (250ml)',
        category: 'drinks',
        price: 20,
        desc: 'Small chilled bottle of tangy Limca.',
        image: 'assets/assets/20rskimca.webp',
        badge: 'Chilled',
        icon: '🥤'
    },
    {
        id: 'drk-soda',
        name: 'Chilled Soda',
        category: 'drinks',
        price: 10,
        desc: 'Chilled carbonated water (soda) in a bottle. Super refreshing.',
        image: 'assets/assets/limesoda.webp',
        badge: 'Ready Stock',
        icon: '🥤'
    },
    {
        id: 'drk-pulpy-orange',
        name: 'Minute Maid Pulpy Orange',
        category: 'drinks',
        price: 20,
        desc: 'Chilled orange juice drink packed with real fruit pulp.',
        image: 'assets/assets/pulpyorange.webp',
        badge: 'Popular',
        icon: '🥤'
    },
    {
        id: 'drk-arotos',
        name: 'Arotos',
        category: 'drinks',
        price: 20,
        desc: 'Chilled local soft drink. Highly refreshing carbonated beverage.',
        image: 'assets/assets/artos.webp',
        badge: 'Ready Stock',
        icon: '🥤'
    },
    {
        id: 'ext-paper-plates',
        name: 'Disposable Paper Plates (50 Pcs)',
        category: 'drinks',
        price: 80,
        desc: 'Biodegradable premium paper plates, highly useful for temple visitors having group lunch.',
        image: 'assets/assets/plates.webp',
        badge: 'Kirana Stock',
        icon: '🍽️'
    },
    {
        id: 'ext-paper-glasses',
        name: 'Disposable Glasses (100 Pcs)',
        category: 'drinks',
        price: 50,
        desc: 'Disposable paper glasses for water, tea, and drinks. Eco-friendly and highly durable.',
        image: 'assets/assets/waterglsses.webp',
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
        image: 'assets/pokadi.webp',
        badge: 'Hot & Fresh',
        icon: '🍢'
    },
    {
        id: 'snk-bajji',
        name: 'Green Chili Bajji (3 Pcs)',
        category: 'snacks',
        price: 20,
        desc: 'Thick green chilies dipped in spiced gram batter, deep-fried to perfection, and stuffed with chopped onions.',
        image: 'assets/bajji.webp',
        badge: 'Hot & Fresh',
        icon: '🍢'
    },
    {
        id: 'snk-gari',
        name: 'Bobari Gari (3 Pcs)',
        category: 'snacks',
        price: 20,
        desc: 'Crispy golden vada made from Bobbarlu (black-eyed peas) batter with ginger, black pepper, and curry leaves.',
        image: 'assets/gari.webp',
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
    if (viewName === 'dashboard' && !State.isAdminAuthenticated) {
        showOwnerLoginModal();
        return;
    }

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

    // Toggle Floating Cart Bar based on active view
    const floatingBar = document.getElementById('floating-cart-bar');
    if (floatingBar) {
        if (State.cart.length > 0 && (viewName === 'home' || viewName === 'menu')) {
            floatingBar.classList.add('visible');
        } else {
            floatingBar.classList.remove('visible');
        }
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
    const item = State.menuItems.find(i => i.id === itemId);
    if (!item) return;

    const existing = State.cart.find(c => c.item.id === itemId);
    if (existing) {
        existing.quantity++;
    } else {
        State.cart.push({ item, quantity: 1 });
    }

    updateCartUI();

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
            disclaimerEl.innerHTML = `<span>💡</span> <span>Order 10+ items for free delivery/pickup service at your temple location. Currently: ${totalCount} items (<a href="https://www.google.com/maps/search/?api=1&query=9F5W%2B7RP,+lovakothuru,+Andhra+Pradesh+533401" target="_blank" style="color:inherit; font-weight:700; text-decoration:underline;">Stall pickup near Petrol Bunk</a>).</span>`;
            disclaimerEl.style.backgroundColor = 'var(--accent-light)';
            disclaimerEl.style.color = '#8c5d00';
        }
    }

    // Update Floating Cart Bar (Swiggy/Zomato style)
    const floatingBar = document.getElementById('floating-cart-bar');
    if (floatingBar) {
        if (State.cart.length === 0) {
            floatingBar.classList.remove('visible');
        } else {
            const subtotal = State.cart.reduce((sum, entry) => sum + (entry.item.price * entry.quantity), 0);
            document.getElementById('floating-cart-count').innerText = `${totalCount} Item${totalCount > 1 ? 's' : ''}`;
            document.getElementById('floating-cart-total').innerText = formatRupees(subtotal);
            
            // Show only if customer is in home or menu view
            if (State.currentView === 'home' || State.currentView === 'menu') {
                floatingBar.classList.add('visible');
            } else {
                floatingBar.classList.remove('visible');
            }
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

    const filtered = State.menuItems.filter(item => item.category === State.activeCategory);

    let html = '';
    filtered.forEach(item => {
        const cartEntry = State.cart.find(c => c.item.id === item.id);
        const qtyInCart = cartEntry ? cartEntry.quantity : 0;

        let badgeClass = '';
        if (item.category === 'water') badgeClass = 'water-badge';

        const isOutOfStock = item.hasOwnProperty('inStock') && item.inStock === false;
        let itemActionHtml = '';
        let soldOutOverlay = '';
        let soldOutClass = '';

        if (isOutOfStock) {
            soldOutClass = 'sold-out-card';
            soldOutOverlay = `
                <div class="sold-out-overlay" style="position: absolute; top:0; left:0; right:0; bottom:0; background: rgba(255,255,255,0.7); backdrop-filter: blur(1px); z-index: 2; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--danger-color); font-size: 1.15rem; pointer-events: none; border-radius: inherit;">
                    🚫 Sold Out
                </div>
            `;
            itemActionHtml = `
                <button class="add-to-cart-btn" disabled style="background-color: #d7ccc8; color: #8d6e63; cursor: not-allowed; border-color: #d7ccc8; box-shadow: none;">
                    Unavailable
                </button>
            `;
        } else if (qtyInCart > 0) {
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
        const opacityStyle = isOutOfStock ? 'style="opacity: 0.65;"' : '';

        html += `
            <div class="menu-card ${soldOutClass}" data-id="${item.id}" style="position: relative;">
                ${soldOutOverlay}
                <div class="menu-card-img-wrapper" style="display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--accent-light), #ffe3b3); color: var(--primary-color);">
                    <img src="${imageSrc}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" alt="${item.name}">
                    <div class="menu-icon-placeholder" style="display: none; font-size: 4rem; justify-content: center; align-items: center; width: 100%; height: 100%;">${item.icon}</div>
                    <span class="menu-badge ${badgeClass}">${item.badge}</span>
                </div>
                <div class="menu-card-body" ${opacityStyle}>
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

    // Force frictionless login before checkout
    if (!State.currentUser) {
        showCustomerLoginModal(() => {
            proceedToCheckout();
        });
        return;
    }

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

    // Dynamically generate UPI QR Code
    generateUPIQRCode(subtotal);

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

    setTimeout(async () => {
        await DB.addOrder(newOrder);

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
                <strong><a href="https://www.google.com/maps/search/?api=1&query=9F5W%2B7RP,+lovakothuru,+Andhra+Pradesh+533401" target="_blank" style="color:var(--primary-color); text-decoration:underline; font-weight:700;">📍 Near Petrol Bunk Stall</a></strong>
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
                        Our shop is located on the <a href="https://www.google.com/maps/search/?api=1&query=9F5W%2B7RP,+lovakothuru,+Andhra+Pradesh+533401" target="_blank" style="color:var(--primary-color); text-decoration:underline; font-weight:700;">Sri Thalupulamma Temple Road, right next to the petrol bunk, Lovakothuru (9F5W+7RP)</a>. Click the link to open the exact location on Google Maps. If you need help, feel free to write to us at <strong style="color:var(--primary-color);">thalupulammakitchen@gmail.com</strong>.
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
    const allOrders = State.orders;
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
            const menuItem = State.menuItems.find(i => i.name === itemName);
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
                const encodedLoc = encodeURIComponent(order.deliveryLocation + ', Lovakothuru, Andhra Pradesh');
                deliveryText = `<div style="font-size:0.75rem; color:#2e7d32; font-weight:700; margin-top:0.25rem;">📍 Delivery: <a href="https://www.google.com/maps/search/?api=1&query=${encodedLoc}" target="_blank" style="color:#2e7d32; text-decoration:underline;">${order.deliveryLocation} ➔</a></div>`;
            } else {
                deliveryText = `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">🚶 Pickup: <a href="https://www.google.com/maps/search/?api=1&query=9F5W%2B7RP,+lovakothuru,+Andhra+Pradesh+533401" target="_blank" style="color:var(--text-muted); text-decoration:underline;">Petrol Bunk Stall (9F5W+7RP) ➔</a></div>`;
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

        await DB.updateOrderPaymentStatus(token, 'PAID');

        setTimeout(() => {
            renderDashboard();
        }, 1000);
    }
}

// Cancel / Delete Order from Dashboard
async function deleteOrder(token) {
    if (confirm(`Are you sure you want to cancel order ${token}?`)) {
        await DB.deleteOrder(token);
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
                    { id: 'tea-special', name: 'Special Tea', price: 15, quantity: 3, category: 'tea' }
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
// CUSTOMER REVIEWS & FEEDBACK DATABASE
const DefaultReviews = [
    {
        name: 'D. Rama Rao',
        tag: 'Pilgrim Group',
        rating: 5,
        comment: 'The Steam Idly is incredibly soft and fresh. Ginger chutney has the perfect spice! Best breakfast near the temple.',
        avatar: 'R'
    },
    {
        name: 'Kaveri Prasad',
        tag: 'Family Traveler',
        rating: 5,
        comment: 'We ordered 15 plates of Double Egg Dosa and Mysore Bonda for our group. They delivered it hot directly to the temple steps entrance. Outstanding service!',
        avatar: 'K'
    },
    {
        name: 'Suresh Kumar',
        tag: 'Local Resident',
        rating: 5,
        comment: 'Whenever we visit Sri Thalupulamma Temple, we pick up our water cans and cardamom tea from here. The Bellam Tea is a must-try for everyone!',
        avatar: 'S'
    },
    {
        name: 'Anitha Reddy',
        tag: 'Daily Customer',
        rating: 5,
        comment: 'Clean, hygienic, and very tasty. Highly recommend the onion pakodi and chili bajji in the evening. Friendly owner Kaliboyina Ramakrishna.',
        avatar: 'A'
    }
];

function initReviews() {
    if (!State.isCloudSynced) {
        let reviews = JSON.parse(localStorage.getItem('thalupulamma_reviews'));
        if (!reviews) {
            reviews = DefaultReviews;
            localStorage.setItem('thalupulamma_reviews', JSON.stringify(reviews));
        }
        renderReviews();
    }
    setupReviewRatingListeners();
}

function renderReviews() {
    const container = document.getElementById('reviews-container');
    if (!container) return;
    
    const reviews = JSON.parse(localStorage.getItem('thalupulamma_reviews')) || DefaultReviews;
    
    container.innerHTML = reviews.map(rev => {
        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rev.rating) {
                starsHtml += `<span class="star filled">★</span>`;
            } else {
                starsHtml += `<span class="star empty">★</span>`;
            }
        }
        
        return `
            <div class="review-card">
                <div class="review-stars">${starsHtml}</div>
                <p class="review-text">"${rev.comment}"</p>
                <div class="review-author">
                    <div class="review-avatar">${rev.avatar}</div>
                    <div class="review-author-info">
                        <span class="review-author-name">${rev.name}</span>
                        <span class="review-author-tag">${rev.tag}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupReviewRatingListeners() {
    const starBtns = document.querySelectorAll('#rating-stars-input .star-rating-btn');
    const ratingValueInput = document.getElementById('review-rating-value');
    if (!starBtns || !ratingValueInput) return;
    
    starBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedRating = parseInt(e.currentTarget.getAttribute('data-rating'));
            ratingValueInput.value = selectedRating;
            
            starBtns.forEach(b => {
                const r = parseInt(b.getAttribute('data-rating'));
                if (r <= selectedRating) {
                    b.classList.add('active');
                    b.textContent = '★'; // Fill the star
                } else {
                    b.classList.remove('active');
                    b.textContent = '☆'; // Empty the star
                }
            });
        });
    });
}

function handleReviewSubmit(event) {
    event.preventDefault();
    
    if (!State.currentUser) {
        showCustomerLoginModal(() => {
            handleReviewSubmit(event);
        });
        return;
    }
    
    const nameInput = document.getElementById('review-name');
    const tagSelect = document.getElementById('review-tag');
    const commentInput = document.getElementById('review-comment');
    const ratingInput = document.getElementById('review-rating-value');
    
    if (!nameInput || !commentInput) return;
    
    const rating = ratingInput ? parseInt(ratingInput.value) : 0;
    
    if (rating === 0) {
        alert('Please select a star rating by clicking the stars before submitting!');
        return;
    }
    
    const name = nameInput.value.trim();
    const tag = tagSelect ? tagSelect.value : 'Visitor';
    const comment = commentInput.value.trim();
    const avatar = name.charAt(0).toUpperCase() || '👤';
    
    const newReview = { name, tag, rating, comment, avatar, createdAt: new Date().toISOString() };
    
    DB.addReview(newReview);
    
    // Reset form fields except name which is readonly
    commentInput.value = '';
    if (ratingInput) ratingInput.value = '0';
    
    const starBtns = document.querySelectorAll('#rating-stars-input .star-rating-btn');
    starBtns.forEach(btn => {
        btn.classList.remove('active');
        btn.textContent = '☆';
    });
}

// Initialise Events
window.addEventListener('DOMContentLoaded', () => {
    // Load local storage session first
    const savedUser = localStorage.getItem('thalupulamma_user');
    if (savedUser) {
        try {
            State.currentUser = JSON.parse(savedUser);
        } catch (e) {
            console.error("Failed to parse saved customer session", e);
        }
    }

    initMenu();
    seedSampleData();
    
    // Initialize Database
    DB.init().then(() => {
        syncUserUI();
        initReviews();
        initCustomerLoginListeners();
    });

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

    // Form listener for customer login
    document.getElementById('customer-login-form').addEventListener('submit', handleCustomerLoginSubmit);

    navigate('home');
    updateCartUI();
});

// DYNAMIC MENU DATABASE INITIALIZATION
function initMenu() {
    let menu = JSON.parse(localStorage.getItem('thalupulamma_menu'));
    if (!menu) {
        menu = DefaultMenuItems;
        localStorage.setItem('thalupulamma_menu', JSON.stringify(menu));
    }
    State.menuItems = menu;
}

// DYNAMIC UPI QR CODE GENERATOR
function generateUPIQRCode(amount) {
    const qrImg = document.getElementById('checkout-upi-qr-img');
    const qrLoading = document.getElementById('upi-qr-loading');
    
    if (!qrImg || !qrLoading) return;
    
    qrImg.style.display = 'none';
    qrLoading.style.display = 'block';
    qrLoading.textContent = 'Generating QR Code...';
    
    const upiId = '7780334755@ybl';
    const payeeName = 'Sri Thalupulamma Tiffins';
    const note = 'Lova Kitchen Order';
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`;
    
    const qrCodeApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}&margin=10`;
    
    qrImg.src = qrCodeApiUrl;
    
    qrImg.onload = () => {
        qrLoading.style.display = 'none';
        qrImg.style.display = 'block';
    };
    
    qrImg.onerror = () => {
        qrLoading.textContent = 'Failed to load QR code. Please pay to UPI ID manually.';
    };
}

// OWNER PORTAL AUTHENTICATION
function showOwnerLoginModal(event) {
    if (event) event.preventDefault();
    const modal = document.getElementById('owner-login-modal');
    const pinInput = document.getElementById('owner-pin');
    const errorMsg = document.getElementById('login-error-msg');
    
    if (modal) {
        modal.classList.add('open');
        if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
        }
        if (errorMsg) errorMsg.style.display = 'none';
    }
}

function closeOwnerLoginModal() {
    const modal = document.getElementById('owner-login-modal');
    if (modal) {
        modal.classList.remove('open');
    }
}

function handleOwnerLogin(event) {
    if (event) event.preventDefault();
    const pinInput = document.getElementById('owner-pin');
    const errorMsg = document.getElementById('login-error-msg');
    const dashboardBtn = document.getElementById('cta-dashboard');
    
    if (!pinInput) return;
    
    const pin = pinInput.value.trim();
    const correctPin = '4755'; // Last 4 digits of Kaliboyina Ramakrishna's phone: +91 7780334755
    
    if (pin === correctPin) {
        State.isAdminAuthenticated = true;
        if (errorMsg) errorMsg.style.display = 'none';
        closeOwnerLoginModal();
        
        // Show dashboard nav button
        if (dashboardBtn) {
            dashboardBtn.style.display = 'inline-flex';
        }
        
        // Navigate to dashboard
        navigate('dashboard');
    } else {
        if (errorMsg) {
            errorMsg.style.display = 'block';
        }
        pinInput.value = '';
        pinInput.focus();
    }
}

// OWNER DASHBOARD TAB SWITCHING
function switchDashboardTab(tabName) {
    const tabs = {
        orders: document.getElementById('dash-tab-orders'),
        menu: document.getElementById('dash-tab-menu'),
        customers: document.getElementById('dash-tab-customers'),
        sync: document.getElementById('dash-tab-sync')
    };
    
    const panels = {
        orders: document.getElementById('dash-orders-panel'),
        menu: document.getElementById('dash-menu-panel'),
        customers: document.getElementById('dash-customers-panel'),
        sync: document.getElementById('dash-sync-panel')
    };
    
    // Switch active state for buttons
    Object.keys(tabs).forEach(name => {
        const tab = tabs[name];
        if (!tab) return;
        if (name === tabName) {
            tab.classList.add('active');
            tab.style.borderBottom = '3px solid var(--primary-color)';
            tab.style.color = 'var(--primary-color)';
        } else {
            tab.classList.remove('active');
            tab.style.borderBottom = '3px solid transparent';
            tab.style.color = 'var(--text-muted)';
        }
    });
    
    // Switch display for panels
    Object.keys(panels).forEach(name => {
        const panel = panels[name];
        if (!panel) return;
        if (name === tabName) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    });
    
    // Load data specific to the tab
    if (tabName === 'orders') {
        renderDashboard();
    } else if (tabName === 'menu') {
        renderAdminMenuList();
    } else if (tabName === 'customers') {
        renderCustomerDirectory();
    } else if (tabName === 'sync') {
        renderFirebaseSyncSettings();
    }
}

// RENDER CUSTOMER DIRECTORY FOR OWNER
function renderCustomerDirectory() {
    const tbody = document.getElementById('admin-customers-tbody');
    if (!tbody) return;
    
    if (State.users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 2rem; color:var(--text-muted);">
                    No customers registered yet.
                </td>
            </tr>
        `;
        return;
    }
    
    const sortedUsers = [...State.users].sort((a, b) => new Date(b.lastLoggedIn || b.createdAt) - new Date(a.lastLoggedIn || a.createdAt));
    
    tbody.innerHTML = sortedUsers.map(user => {
        const userOrders = State.orders.filter(o => o.phone === user.phone);
        const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
        const lastVisit = userOrders.length > 0 
            ? new Date(userOrders[userOrders.length - 1].createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : 'No orders yet';
            
        return `
            <tr class="customer-row" onclick="inspectCustomer('${user.phone}')">
                <td style="padding: 0.75rem 0.5rem; font-weight: 600; color:var(--text-color);">${user.name}</td>
                <td style="padding: 0.75rem 0.5rem; color: var(--text-muted);">${user.phone}</td>
                <td style="padding: 0.75rem 0.5rem; text-align: center; color:var(--text-color);">${userOrders.length}</td>
                <td style="padding: 0.75rem 0.5rem; text-align: right; font-weight: 600; color:var(--text-color);">₹${totalSpent}</td>
                <td style="padding: 0.75rem 0.5rem; color: var(--text-muted);">${lastVisit}</td>
            </tr>
        `;
    }).join('');
}

function inspectCustomer(phone) {
    const user = State.users.find(u => u.phone === phone);
    if (!user) return;
    
    const modal = document.getElementById('customer-profile-modal');
    if (!modal) return;
    
    document.getElementById('profile-name').innerText = user.name;
    document.getElementById('profile-phone').innerText = '+91 ' + user.phone;
    document.getElementById('profile-avatar').innerText = user.name.charAt(0).toUpperCase() || '👤';
    
    const userOrders = State.orders.filter(o => o.phone === user.phone);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
    
    document.getElementById('profile-status-badge').innerText = `Registered User • ${userOrders.length} orders • ₹${totalSpent} spent`;
    
    const ordersContainer = document.getElementById('profile-orders-list');
    if (ordersContainer) {
        if (userOrders.length === 0) {
            ordersContainer.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; text-align:center; padding: 2rem 0;">No order history found.</p>`;
        } else {
            const sorted = [...userOrders].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
            ordersContainer.innerHTML = sorted.map(o => {
                const dateDisplay = new Date(o.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                return `
                    <div class="profile-order-card" style="margin-bottom:0.5rem;">
                        <div class="profile-order-header">
                            <span style="color:var(--primary-color); font-weight:700;">${o.token}</span>
                            <span>₹${o.total}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">
                            <span>${dateDisplay} • ${o.time}</span>
                            <span style="font-weight:700; color:${o.paymentStatus === 'PAID' ? '#2e7d32' : 'var(--accent-color)'}">${o.paymentStatus}</span>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.4rem; border-top:1px dashed var(--border-color); padding-top:0.4rem;">
                            ${o.items.map(item => `${item.name} × ${item.quantity}`).join(', ')}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    modal.classList.add('open');
}

// RENDER CLOUD SYNC SETTINGS
function renderFirebaseSyncSettings() {
    const configStr = localStorage.getItem('thalupulamma_firebase_config');
    if (configStr) {
        try {
            const config = JSON.parse(configStr);
            document.getElementById('fb-apiKey').value = config.apiKey || '';
            document.getElementById('fb-projectId').value = config.projectId || '';
            document.getElementById('fb-authDomain').value = config.authDomain || '';
            document.getElementById('fb-appId').value = config.appId || '';
            document.getElementById('fb-storageBucket').value = config.storageBucket || '';
        } catch (e) {
            console.error("Failed to parse firebase config", e);
        }
    }
    DB.updateStatusBadge();
}

async function handleAdminSaveFirebase(event) {
    event.preventDefault();
    
    const config = {
        apiKey: document.getElementById('fb-apiKey').value.trim(),
        projectId: document.getElementById('fb-projectId').value.trim(),
        authDomain: document.getElementById('fb-authDomain').value.trim(),
        appId: document.getElementById('fb-appId').value.trim(),
        storageBucket: document.getElementById('fb-storageBucket').value.trim()
    };
    
    if (!config.apiKey || !config.projectId) {
        alert("Please enter at least API Key and Project ID.");
        return;
    }
    
    localStorage.setItem('thalupulamma_firebase_config', JSON.stringify(config));
    
    const statusText = document.getElementById('firebase-status-text');
    if (statusText) {
        statusText.className = 'status-badge';
        statusText.style.color = 'var(--text-muted)';
        statusText.innerText = "Connecting to Cloud Firestore...";
    }
    
    await DB.init();
    
    if (State.isCloudSynced) {
        alert("Success! Connected to Firebase Cloud Database.");
    } else {
        alert("Failed to connect. Double-check your config keys and Firestore database rules.");
    }
}

function handleAdminClearFirebase() {
    if (confirm("Disconnect from Firebase and fall back to local storage?")) {
        localStorage.removeItem('thalupulamma_firebase_config');
        
        DB.db = null;
        DB.isInitialized = false;
        State.isCloudSynced = false;
        
        DB.init();
        
        document.getElementById('fb-apiKey').value = '';
        document.getElementById('fb-projectId').value = '';
        document.getElementById('fb-authDomain').value = '';
        document.getElementById('fb-appId').value = '';
        document.getElementById('fb-storageBucket').value = '';
        
        alert("Disconnected from Firebase. Currently in Local Storage Mode.");
    }
}

// RENDER ADMIN MENU LIST
function renderAdminMenuList() {
    const tbody = document.getElementById('admin-menu-list-tbody');
    const filterCat = document.getElementById('dash-menu-filter-cat').value;
    const searchVal = document.getElementById('dash-menu-search').value.toLowerCase().trim();
    
    if (!tbody) return;
    
    let items = State.menuItems;
    
    // Filter
    if (filterCat !== 'all') {
        items = items.filter(i => i.category === filterCat);
    }
    
    // Search
    if (searchVal) {
        items = items.filter(i => i.name.toLowerCase().includes(searchVal) || i.desc.toLowerCase().includes(searchVal));
    }
    
    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No menu items found.</td></tr>`;
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const inStock = !item.hasOwnProperty('inStock') || item.inStock === true;
        const categoryLabels = {
            tiffins: 'Morning Tiffins',
            snacks: 'Evening Snacks',
            tea: 'Tea Time Varieties',
            water: 'Water Plant Cans',
            drinks: 'Drinks & Kirana'
        };
        
        return `
            <tr style="border-bottom: 1px solid var(--border-color);">
                <td style="padding: 0.75rem 0.5rem; display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">${item.icon}</span>
                    <div>
                        <div style="font-weight: 600; color: var(--text-color);">${item.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.desc}</div>
                    </div>
                </td>
                <td style="padding: 0.75rem 0.5rem; color: var(--text-muted); font-size: 0.85rem;">
                    ${categoryLabels[item.category] || item.category}
                </td>
                <td style="padding: 0.75rem 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <span>₹</span>
                        <input type="number" value="${item.price}" min="1" onchange="updateItemPrice('${item.id}', this.value)" style="width: 55px; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 0.85rem; font-weight: 600; text-align: center; color: var(--text-color); background: var(--bg-input);">
                    </div>
                </td>
                <td style="padding: 0.75rem 0.5rem;">
                    <label class="switch">
                        <input type="checkbox" ${inStock ? 'checked' : ''} onchange="toggleItemStock('${item.id}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </td>
                <td style="padding: 0.75rem 0.5rem; text-align: center;">
                    <button class="qty-btn" onclick="deleteMenuItem('${item.id}')" style="background: rgba(217, 56, 56, 0.08); color: var(--danger-color); border: 1px solid rgba(217, 56, 56, 0.2); padding: 0.35rem 0.65rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; font-weight: 600; font-family: inherit;">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// INLINE MENU EDITING HANDLERS
function updateItemPrice(itemId, newPrice) {
    const price = parseInt(newPrice);
    if (isNaN(price) || price <= 0) {
        alert("Please enter a valid price greater than ₹0!");
        renderAdminMenuList();
        return;
    }
    
    const item = State.menuItems.find(i => i.id === itemId);
    if (item) {
        item.price = price;
        localStorage.setItem('thalupulamma_menu', JSON.stringify(State.menuItems));
        updateCartItemPricesAfterMenuChange();
        renderAdminMenuList();
    }
}

function updateCartItemPricesAfterMenuChange() {
    State.cart.forEach(entry => {
        const item = State.menuItems.find(i => i.id === entry.item.id);
        if (item) {
            entry.item.price = item.price;
        }
    });
    updateCartUI();
}

function toggleItemStock(itemId, isChecked) {
    const item = State.menuItems.find(i => i.id === itemId);
    if (item) {
        item.inStock = isChecked;
        localStorage.setItem('thalupulamma_menu', JSON.stringify(State.menuItems));
        if (!isChecked) {
            State.cart = State.cart.filter(entry => entry.item.id !== itemId);
            updateCartUI();
        }
        renderAdminMenuList();
    }
}

function deleteMenuItem(itemId) {
    if (!confirm("Are you sure you want to delete this menu item? It will be permanently removed from the customer menu.")) {
        return;
    }
    
    State.menuItems = State.menuItems.filter(i => i.id !== itemId);
    localStorage.setItem('thalupulamma_menu', JSON.stringify(State.menuItems));
    
    State.cart = State.cart.filter(entry => entry.item.id !== itemId);
    updateCartUI();
    
    renderAdminMenuList();
}

function handleAdminAddItem(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('new-item-name');
    const categorySelect = document.getElementById('new-item-category');
    const priceInput = document.getElementById('new-item-price');
    const iconInput = document.getElementById('new-item-icon');
    const badgeInput = document.getElementById('new-item-badge');
    const descInput = document.getElementById('new-item-desc');
    const imageInput = document.getElementById('new-item-image');
    
    if (!nameInput || !priceInput || !descInput) return;
    
    const name = nameInput.value.trim();
    const category = categorySelect.value;
    const price = parseInt(priceInput.value);
    const icon = iconInput.value.trim() || '🍲';
    const badge = badgeInput.value.trim() || 'Ready Stock';
    const desc = descInput.value.trim();
    
    let image = imageInput.value.trim();
    if (!image) {
        if (category === 'tiffins') image = 'assets/idily.webp';
        else if (category === 'snacks') image = 'assets/pokadi.webp';
        else if (category === 'tea') image = 'assets/tea.png';
        else if (category === 'water') image = 'assets/20rswaterbottle.webp';
        else image = 'assets/drinks.png';
    }
    
    const id = `custom-${category}-${Date.now()}`;
    
    const newItem = {
        id,
        name,
        category,
        price,
        desc,
        image,
        badge,
        icon,
        inStock: true
    };
    
    State.menuItems.push(newItem);
    localStorage.setItem('thalupulamma_menu', JSON.stringify(State.menuItems));
    
    nameInput.value = '';
    priceInput.value = '';
    badgeInput.value = '';
    descInput.value = '';
    imageInput.value = '';
    iconInput.value = '🍛';
    
    alert(`Successfully added "${name}" to the menu!`);
    renderAdminMenuList();
}
