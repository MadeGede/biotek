const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const emailService = require('../config/email');

// ─── Dashboard ────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const [[stats]] = await db.query(`SELECT
      (SELECT COUNT(*) FROM users WHERE role='customer') AS total_users,
      (SELECT COUNT(*) FROM orders) AS total_orders,
      (SELECT COALESCE(SUM(grand_total),0) FROM orders WHERE payment_status='paid') AS total_revenue,
      (SELECT COUNT(*) FROM recycle_submissions) AS total_recycles,
      (SELECT COUNT(*) FROM orders WHERE order_status='pending') AS pending_orders,
      (SELECT COUNT(*) FROM recycle_submissions WHERE status='pending') AS pending_recycles`);

    // Monthly revenue last 6 months
    const [monthlyRevenue] = await db.query(`SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, SUM(grand_total) AS revenue, COUNT(*) AS orders
      FROM orders WHERE payment_status='paid' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month`);

    // Recent orders
    const [recentOrders] = await db.query(`SELECT o.*, u.name AS user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10`);

    // Top products
    const [topProducts] = await db.query(`SELECT p.name, SUM(oi.qty) AS sold, SUM(oi.subtotal) AS revenue FROM order_items oi JOIN products p ON oi.product_id = p.id GROUP BY p.id ORDER BY sold DESC LIMIT 5`);

    res.render('pages/admin/dashboard', { title: 'Admin Dashboard', stats, monthlyRevenue, recentOrders, topProducts });
  } catch (e) { console.error(e); res.status(500).render('pages/error', { title: 'Error', error: e }); }
};

// ─── Products ─────────────────────────────────────────────────
exports.products = async (req, res) => {
  const [products] = await db.query('SELECT p.*, c.name AS cat_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC');
  const [categories] = await db.query('SELECT * FROM categories');
  res.render('pages/admin/products', { title: 'Kelola Produk', products, categories });
};

exports.storeProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, stock, eco_label, is_featured } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    let image = null;
    if (req.files && req.files.image) {
      const file = req.files.image;
      const ext = path.extname(file.name);
      image = `product_${Date.now()}${ext}`;
      const dir = path.join(__dirname, '../public/images/products');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await file.mv(path.join(dir, image));
    }
    await db.query('INSERT INTO products (category_id,name,slug,description,price,stock,image,eco_label,is_featured) VALUES (?,?,?,?,?,?,?,?,?)',
      [category_id, name, slug, description, price, stock, image, eco_label, is_featured ? 1 : 0]);
    req.flash('success', 'Produk berhasil ditambahkan.');
    res.redirect('/admin/products');
  } catch (e) { console.error(e); req.flash('error', 'Gagal menambahkan produk.'); res.redirect('/admin/products'); }
};

exports.updateProduct = async (req, res) => {
  try {
    const { category_id, name, description, price, stock, eco_label, is_featured, is_active } = req.body;
    let updateFields = { category_id, name, description, price, stock, eco_label, is_featured: is_featured ? 1 : 0, is_active: is_active ? 1 : 0 };
    if (req.files && req.files.image) {
      const file = req.files.image;
      const ext = path.extname(file.name);
      const image = `product_${Date.now()}${ext}`;
      const dir = path.join(__dirname, '../public/images/products');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await file.mv(path.join(dir, image));
      updateFields.image = image;
    }
    const sets = Object.keys(updateFields).map(k => `${k}=?`).join(',');
    await db.query(`UPDATE products SET ${sets} WHERE id = ?`, [...Object.values(updateFields), req.params.id]);
    req.flash('success', 'Produk berhasil diperbarui.');
    res.redirect('/admin/products');
  } catch (e) { req.flash('error', 'Gagal memperbarui produk.'); res.redirect('/admin/products'); }
};

exports.deleteProduct = async (req, res) => {
  await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  req.flash('success', 'Produk dinonaktifkan.');
  res.redirect('/admin/products');
};

// ─── Orders ───────────────────────────────────────────────────
exports.orders = async (req, res) => {
  const { status } = req.query;
  let where = status ? 'WHERE o.order_status = ?' : '';
  const [orders] = await db.query(`SELECT o.*, u.name AS user_name, u.email AS user_email FROM orders o JOIN users u ON o.user_id = u.id ${where} ORDER BY o.created_at DESC`, status ? [status] : []);
  res.render('pages/admin/orders', { title: 'Kelola Pesanan', orders, filterStatus: status });
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { order_status, payment_status } = req.body;
    await db.query('UPDATE orders SET order_status=?, payment_status=? WHERE id=?', [order_status, payment_status, req.params.id]);
    if (payment_status === 'paid') {
      const [rows] = await db.query('SELECT o.*, u.* FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?', [req.params.id]);
      if (rows.length) emailService.sendPaymentConfirmed(rows[0], rows[0]).catch(console.error);
    }
    req.flash('success', 'Status pesanan diperbarui.');
    res.redirect('/admin/orders');
  } catch (e) { req.flash('error', 'Gagal update status.'); res.redirect('/admin/orders'); }
};

// ─── Recycles ─────────────────────────────────────────────────
exports.recycles = async (req, res) => {
  const [submissions] = await db.query('SELECT * FROM recycle_submissions ORDER BY created_at DESC');
  res.render('pages/admin/recycles', { title: 'Kelola Daur Ulang', submissions });
};

exports.updateRecycleStatus = async (req, res) => {
  await db.query('UPDATE recycle_submissions SET status=?, notes=? WHERE id=?', [req.body.status, req.body.notes, req.params.id]);
  req.flash('success', 'Status daur ulang diperbarui.');
  res.redirect('/admin/recycles');
};

// ─── Users ────────────────────────────────────────────────────
exports.users = async (req, res) => {
  const [users] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
  res.render('pages/admin/users', { title: 'Kelola Pengguna', users });
};
