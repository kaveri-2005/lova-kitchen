# Lova Darshan Kitchen - Sri Thalupulamma Temple Tiffins & Snacks

A premium, responsive Single-Page Web Application built for a local tiffin and snack shop located on **Sri Thalupulamma Temple Road (near the Petrol Bunk), Lova, Andhra Pradesh**. 

The application serves two primary roles: helping pilgrim groups and temple visitors order fresh food easily, and solving the shop's main business pain point—**morning tiffin food waste** due to unpredictable visitor demand.

---

## 🚀 Key Features

### 1. Customer Ordering & Pre-Orders
* **Flexible Date Selection**: Customers can order food for **Today**, **Tomorrow**, or any future date.
* **Temple-Area Delivery (10+ Items)**: If an order contains **10 or more items** (ideal for large pilgrim groups, tourist buses, or families), a dedicated **Temple Delivery Location** input unlocks. Customers specify their location (e.g. hill steps, choultry, main parking lot) and get free delivery. Orders under 10 items default to convenient pickup at the stall near the Petrol Bunk.
* **Payment Simulation**: Fully functional, interactive payment checkout featuring simulated **UPI QR code scanning**, **Credit/Debit Card** inputs, and **Cash on Pickup/Delivery** terms.
* **Token Receipt Generator**: Upon order submission, a unique pickup token (e.g., `#T-102`) is generated alongside a printable invoice and verification barcode/QR code.

### 2. Owner Demand & Prep Dashboard
* **Consolidated Ingredient Checklist**: The kitchen manager/chef can select any date (defaulting to today) and see the exact consolidated counts of all dishes ordered (e.g., *Steam Idly: 40 portions, Onion Dosa: 12 portions*). This allows the shop to prepare exactly what is needed, **reducing food waste to zero**.
* **Live Bookings Tracking**: Provides a detailed breakdown of individual customer details, phone numbers, scheduled pickup/delivery times, and payment status, sorted chronologically.
* **Order Management**: Allows the owner to mark orders as "Completed" or cancel bookings in real-time.

---

## 🥞 Shop Partitions & Menu Prices

* **Morning Tiffins**:
  * Steam Idly (4 Pcs) — `₹30`
  * Crispy Plain Dosa — `₹30`
  * Onion Dosa — `₹40`
  * Puri Bhaji (2 Pcs) — `₹30`
  * Mysore Bonda (4 Pcs) — `₹30`
  * Pesarattu Dosa — `₹45`
  * Egg Dosa — `₹50`
  * Double Egg Dosa — `₹60`
* **Evening Snacks**:
  * Crispy Onion Pakodi (Plate) — `₹20`
  * Green Chili Bajji (3 Pcs) — `₹20`
  * Bobari Gari (3 Pcs) — `₹20` (Special black-eyed peas/bobbarlu recipe)
* **Tea Time**: Cardamom Tea, Filter Coffee, Lemon Tea, Badam Milk.
* **Water Plant**: Purified 20L water cans (Normal & Chilled) and 1L cold bottles.
* **Cool Drinks & Kirana**: Cold soft drinks, ice creams, and disposable paper plates & glasses for picnics.

---

## 🛠️ Technology Stack

1. **Frontend**: Pure HTML5 (semantic structure), Vanilla CSS3 (custom variable themes, glassmorphism, responsive grids, custom animations), and ES6 JavaScript (client-side router, state/cart manager, local storage database).
2. **Assets**: Custom-generated high-quality South Indian breakfast photography (`assets/tiffins.png`).
3. **Local Dev Server**: Serves files via Python HTTP server to bypass local browser CORS/file policy restrictions.

---

## 💻 How to Run Locally

Since the project uses client-side routing and local storage, you can serve it using a lightweight server:

1. Clone or download the repository to your machine.
2. Open terminal inside the project directory and run the built-in Python server:
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to:
   ```url
   http://localhost:8000
   ```

---

## 👥 Contact & Support
* **Owner**: Kaliboyina Ramakrishna (+91 7780334755)
* **Support Email**: [thalupulammakitchen@gmail.com](mailto:thalupulammakitchen@gmail.com)
* **Location**: Temple Road, Near Petrol Bunk, Lova, Andhra Pradesh
