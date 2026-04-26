# 🌿 PT BioTeknologi Nasional

**Marketplace Produk Ramah Lingkungan & Platform Daur Ulang Limbah**

---

## 🧱 Stack Teknologi

| Layer       | Teknologi                              |
|-------------|----------------------------------------|
| Backend     | **Node.js + Express.js** (MVC pattern) |
| Template    | EJS (Embedded JavaScript Templates)   |
| Database    | **MySQL 8.0+**                         |
| Auth        | Session-based + bcryptjs               |
| Email       | Nodemailer (SMTP / Gmail)              |
| Upload      | express-fileupload + multer            |
| Security    | helmet, express-rate-limit, bcrypt     |
| Charts      | Chart.js (Admin dashboard)             |

---

## 📁 Struktur Proyek (MVC)

```
biotek/
├── server.js              # Entry point
├── .env.example           # Konfigurasi environment
├── package.json
├── config/
│   ├── db.js              # Koneksi MySQL
│   ├── schema.sql         # Schema & seed database
│   └── email.js           # Nodemailer service
├── middleware/
│   └── auth.js            # Auth middleware
├── controllers/           # Business Logic (C)
│   ├── HomeController.js
│   ├── AuthController.js
│   ├── ShopController.js
│   ├── RecycleController.js
│   ├── UserController.js
│   └── AdminController.js
├── routes/                # Routing (MVC Router)
│   ├── home.js
│   ├── auth.js
│   ├── shop.js
│   ├── recycle.js
│   ├── user.js
│   ├── admin.js
│   └── api.js
├── views/                 # Templates (V)
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── sidebar.ejs
│   │   └── admin-sidebar.ejs
│   └── pages/
│       ├── home.ejs
│       ├── about.ejs
│       ├── contact.ejs
│       ├── auth/          # Login & Register
│       ├── shop/          # Marketplace
│       ├── recycle/       # Daur Ulang
│       ├── user/          # User Dashboard
│       └── admin/         # Admin Panel
├── public/
│   ├── css/style.css      # Global stylesheet
│   ├── js/main.js         # Frontend JavaScript
│   └── images/products/   # Gambar produk
└── uploads/
    ├── proofs/            # Bukti pembayaran
    └── waste/             # Foto limbah
```

---

## ⚡ Cara Instalasi & Menjalankan

### 1. Prasyarat
- Node.js v18+
- MySQL 8.0+
- npm atau yarn

### 2. Clone & Install Dependencies
```bash
cd biotek
npm install
```

### 3. Setup Database MySQL
```sql
-- Di MySQL client / phpMyAdmin
SOURCE config/schema.sql;
```

### 4. Konfigurasi Environment
```bash
cp .env.example .env
# Edit .env sesuai konfigurasi lokal Anda
```

**Isi file `.env`:**
```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=your_random_secret_key

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=biotek_nasional

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=noreply@bioteknasional.id
EMAIL_NAME=PT BioTeknologi Nasional

APP_URL=http://localhost:3000
```

> **Gmail App Password**: Aktifkan 2FA di akun Google → Security → App Passwords → Generate untuk "Mail"

### 5. Jalankan Server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Buka browser: **http://localhost:3000**

---

## 🔐 Akun Default

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Admin    | admin@bioteknasional.id  | Admin@1234  |
| Customer | Daftar via /auth/register | — |

---

## 🌐 Halaman & Fitur

### Public
| URL                    | Keterangan              |
|------------------------|-------------------------|
| `/`                    | Beranda                 |
| `/about`               | Tentang Perusahaan      |
| `/shop`                | Marketplace Produk      |
| `/shop/:slug`          | Detail Produk           |
| `/daur-ulang`          | Info Layanan Daur Ulang |
| `/daur-ulang/form`     | Form Pengajuan          |
| `/daur-ulang/tracking` | Tracking Status         |
| `/contact`             | Kontak                  |

### Auth
| URL               | Keterangan |
|-------------------|------------|
| `/auth/login`     | Login      |
| `/auth/register`  | Registrasi |
| `/auth/logout`    | Logout     |

### Customer Dashboard
| URL                  | Keterangan            |
|----------------------|-----------------------|
| `/user/dashboard`    | Dashboard             |
| `/user/orders`       | Riwayat Pesanan       |
| `/user/recycles`     | Riwayat Daur Ulang    |
| `/user/wishlist`     | Produk Wishlist       |
| `/user/points`       | Poin & Reward         |
| `/user/profile`      | Profil                |

### Admin Panel
| URL                  | Keterangan               |
|----------------------|--------------------------|
| `/admin`             | Dashboard + Analytics    |
| `/admin/products`    | Kelola Produk            |
| `/admin/orders`      | Kelola Pesanan           |
| `/admin/recycles`    | Kelola Daur Ulang        |
| `/admin/users`       | Kelola Pengguna          |

---

## 🔒 Keamanan yang Diterapkan

- ✅ **bcryptjs** — Hash password (salt round 12)
- ✅ **Helmet.js** — HTTP security headers
- ✅ **express-rate-limit** — Rate limiting API (200 req/15 menit)
- ✅ **express-validator** — Input validation & sanitization
- ✅ **MySQL2 Prepared Statements** — Anti SQL Injection
- ✅ **Session-based Auth** — Secure session management
- ✅ **File type validation** — Upload file type checking
- ✅ **CSRF protection** — method-override

---

## 📧 Email Automation

Email otomatis dikirim saat:
1. **Registrasi berhasil** — Welcome email
2. **Pesanan dibuat** — Konfirmasi pesanan + detail pembayaran
3. **Pembayaran dikonfirmasi** — Notifikasi pembayaran diterima
4. **Pengajuan daur ulang** — Konfirmasi pengajuan

---

## ♻️ Sistem Poin Reward

| Aktivitas         | Poin    |
|-------------------|---------|
| Daur Ulang        | +50 poin|
| Setiap Rp10.000   | +10 poin|
| Review Produk     | +5 poin |
| **100 poin**      | = Rp 10.000 diskon |

---

## 🚀 Deployment Production

```bash
# Install PM2
npm install -g pm2

# Set NODE_ENV
export NODE_ENV=production

# Start dengan PM2
pm2 start server.js --name "biotek-nasional"
pm2 save
pm2 startup
```

**Nginx Reverse Proxy (opsional):**
```nginx
server {
    listen 80;
    server_name bioteknasional.id www.bioteknasional.id;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

© 2024 PT BioTeknologi Nasional — Teknologi Hijau untuk Indonesia 🌿
