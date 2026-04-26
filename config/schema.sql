-- ============================================================
--  PT BioTeknologi Nasional — Database Schema
--  Engine: MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS biotek_nasional CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE biotek_nasional;

-- ─── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(20),
  address     TEXT,
  role        ENUM('admin','customer') DEFAULT 'customer',
  points      INT DEFAULT 0,
  avatar      VARCHAR(255),
  is_active   TINYINT(1) DEFAULT 1,
  email_verified_at DATETIME,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon        VARCHAR(50),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT,
  name          VARCHAR(200) NOT NULL,
  slug          VARCHAR(200) NOT NULL UNIQUE,
  description   TEXT,
  price         DECIMAL(15,2) NOT NULL,
  stock         INT DEFAULT 0,
  image         VARCHAR(255),
  images        JSON,
  weight        DECIMAL(10,2) DEFAULT 0,
  eco_label     VARCHAR(100),
  is_featured   TINYINT(1) DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  sold_count    INT DEFAULT 0,
  view_count    INT DEFAULT 0,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Product Reviews ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  user_id     INT NOT NULL,
  rating      TINYINT(1) NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Wishlist ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlists (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wish (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Orders ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  order_code      VARCHAR(30) NOT NULL UNIQUE,
  user_id         INT NOT NULL,
  total_amount    DECIMAL(15,2) NOT NULL,
  shipping_fee    DECIMAL(15,2) DEFAULT 0,
  grand_total     DECIMAL(15,2) NOT NULL,
  payment_method  ENUM('bank_transfer','qris') NOT NULL,
  payment_status  ENUM('pending','paid','failed') DEFAULT 'pending',
  order_status    ENUM('pending','processing','shipped','completed','cancelled') DEFAULT 'pending',
  shipping_name   VARCHAR(150),
  shipping_phone  VARCHAR(20),
  shipping_address TEXT,
  notes           TEXT,
  payment_proof   VARCHAR(255),
  paid_at         DATETIME,
  shipped_at      DATETIME,
  completed_at    DATETIME,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Order Items ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL,
  price       DECIMAL(15,2) NOT NULL,
  subtotal    DECIMAL(15,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Recycle Submissions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS recycle_submissions (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  submission_code VARCHAR(30) NOT NULL UNIQUE,
  user_id         INT,
  name            VARCHAR(150) NOT NULL,
  phone           VARCHAR(20) NOT NULL,
  address         TEXT NOT NULL,
  waste_type      VARCHAR(100) NOT NULL,
  waste_weight    DECIMAL(10,2),
  description     TEXT,
  photo           VARCHAR(255),
  pickup_date     DATE,
  pickup_time     VARCHAR(20),
  status          ENUM('pending','confirmed','picked_up','processed','completed','cancelled') DEFAULT 'pending',
  points_awarded  INT DEFAULT 0,
  notes           TEXT,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ─── Points History ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS points_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        ENUM('earn','redeem') NOT NULL,
  points      INT NOT NULL,
  description VARCHAR(255),
  ref_id      INT,
  ref_type    VARCHAR(50),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(200) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'info',
  is_read     TINYINT(1) DEFAULT 0,
  link        VARCHAR(255),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ─── Chat Messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  session_id  VARCHAR(100) NOT NULL,
  sender      ENUM('user','bot') NOT NULL,
  message     TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ─── Seed: Admin user ─────────────────────────────────────────
INSERT IGNORE INTO users (name, email, password, role, is_active, email_verified_at)
VALUES ('Administrator', 'admin@bioteknasional.id',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewYpfFEMTnlnQAiK',
        -- password: Admin@1234
        'admin', 1, NOW());

-- ─── Seed: Categories ─────────────────────────────────────────
INSERT IGNORE INTO categories (name, slug, description, icon) VALUES
  ('Perawatan Rumah', 'perawatan-rumah', 'Produk kebersihan & perawatan rumah ramah lingkungan', 'fa-house'),
  ('Fashion Eco', 'fashion-eco', 'Pakaian & aksesori dari bahan daur ulang', 'fa-shirt'),
  ('Makanan Organik', 'makanan-organik', 'Pangan organik bersertifikat', 'fa-seedling'),
  ('Energi Terbarukan', 'energi-terbarukan', 'Produk hemat & penghasil energi hijau', 'fa-solar-panel'),
  ('Kemasan Ramah Lingkungan', 'kemasan-eco', 'Kemasan biodegradable & compostable', 'fa-box'),
  ('Pertanian Urban', 'pertanian-urban', 'Alat & perlengkapan berkebun organik', 'fa-leaf');

-- ─── Seed: Products ───────────────────────────────────────────
INSERT IGNORE INTO products (category_id, name, slug, description, price, stock, eco_label, is_featured) VALUES
  (1,'Sabun Cuci Piring Organik','sabun-cuci-piring-organik','Terbuat dari bahan alami, 100% biodegradable, tanpa SLS',35000,150,'Eco-Certified',1),
  (2,'Tas Belanja Kanvas Daur Ulang','tas-kanvas-daur-ulang','Tas kuat dari kain kanvas daur ulang, pengganti plastik',85000,80,'Recycled Material',1),
  (3,'Pupuk Kompos Premium','pupuk-kompos-premium','Kompos organik dari limbah sayuran terfermentasi',45000,200,'Organic',1),
  (4,'Panel Surya Mini Portable','panel-surya-mini','Panel surya 20W portabel untuk kebutuhan darurat',750000,25,'Green Energy',1),
  (5,'Sedotan Bambu Set 10pcs','sedotan-bambu-set','Sedotan bambu alami pengganti plastik sekali pakai',28000,300,'Zero Waste',1),
  (1,'Deterjen Bubuk Eco','deterjen-bubuk-eco','Deterjen ramah lingkungan, kemasan daur ulang',55000,120,'Eco-Friendly',0),
  (3,'Benih Sayuran Organik','benih-sayuran-organik','Paket 10 jenis benih sayur organik non-GMO',65000,90,'Organic',0),
  (6,'Pot Biodegradable 5pcs','pot-biodegradable','Pot tanam dari limbah kertas yang bisa terurai',32000,200,'Compostable',0);
