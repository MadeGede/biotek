const db = require('../config/db');
const emailService = require('../config/email');
const path = require('path');
const fs = require('fs');

// ─── Helper ──────────────────────────────────────────────────
function generateOrderCode() {
  return 'BTN-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
}

// ─── Product List ─────────────────────────────────────────────
exports.index = async (req, res) => {
  try {
    const { q, category, sort, min_price, max_price, page = 1 } = req.query;
    const limit = 12, offset = (page - 1) * limit;
    let where = ['p.is_active = 1'], params = [];

    if (q) { where.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    if (category) { where.push('c.slug = ?'); params.push(category); }
    if (min_price) { where.push('p.price >= ?'); params.push(parseFloat(min_price)); }
    if (max_price) { where.push('p.price <= ?'); params.push(parseFloat(max_price)); }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.price ASC';
    else if (sort === 'price_desc') orderBy = 'p.price DESC';
    else if (sort === 'popular') orderBy = 'p.sold_count DESC';
    else if (sort === 'rating') orderBy = 'avg_rating DESC';

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const sql = `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
      COALESCE(AVG(r.rating),0) AS avg_rating, COUNT(DISTINCT r.id) AS review_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      ${whereStr} GROUP BY p.id ORDER BY ${orderBy} LIMIT ? OFFSET ?`;

    const [products] = await db.query(sql, [...params, limit, offset]);
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereStr}`, params);
    const [categories] = await db.query('SELECT * FROM categories ORDER BY name');

    const wishlistIds = [];
    if (req.session.user) {
      const [wl] = await db.query('SELECT product_id FROM wishlists WHERE user_id = ?', [req.session.user.id]);
      wl.forEach(w => wishlistIds.push(w.product_id));
    }

    res.render('pages/shop/index', { title: 'Marketplace Eco', products, categories, wishlistIds,
      query: req.query, total, page: parseInt(page), totalPages: Math.ceil(total / limit), limit });
  } catch (e) { console.error(e); res.status(500).render('pages/error', { title: 'Error', error: e }); }
};

// ─── Product Detail ───────────────────────────────────────────
exports.detail = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT p.*, c.name AS category_name,
      COALESCE(AVG(r.rating),0) AS avg_rating, COUNT(DISTINCT r.id) AS review_count
      FROM products p LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN reviews r ON p.id = r.product_id
      WHERE p.slug = ? AND p.is_active = 1 GROUP BY p.id`, [req.params.slug]);
    if (!rows.length) return res.status(404).render('pages/404', { title: 'Produk Tidak Ditemukan' });
    const product = rows[0];
    await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [product.id]);
    const [reviews] = await db.query(`SELECT r.*, u.name AS user_name, u.avatar FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.product_id = ? ORDER BY r.created_at DESC`, [product.id]);
    const [related] = await db.query('SELECT * FROM products WHERE category_id = ? AND id != ? AND is_active = 1 LIMIT 4', [product.category_id, product.id]);
    const inWishlist = req.session.user ? (await db.query('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.session.user.id, product.id]))[0].length > 0 : false;
    res.render('pages/shop/detail', { title: product.name, product, reviews, related, inWishlist });
  } catch (e) { console.error(e); res.status(500).render('pages/error', { title: 'Error', error: e }); }
};

// ─── Cart ─────────────────────────────────────────────────────
exports.addToCart = async (req, res) => {
  try {
    const { product_id, qty = 1 } = req.body;
    const [rows] = await db.query('SELECT * FROM products WHERE id = ? AND is_active = 1 AND stock > 0', [product_id]);
    if (!rows.length) return res.json({ success: false, message: 'Produk tidak tersedia' });
    const product = rows[0];
    if (!req.session.cart) req.session.cart = [];
    const idx = req.session.cart.findIndex(i => i.id == product_id);
    const addQty = parseInt(qty);
    if (idx > -1) {
      const newQty = req.session.cart[idx].qty + addQty;
      req.session.cart[idx].qty = Math.min(newQty, product.stock);
    } else {
      req.session.cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, slug: product.slug, qty: Math.min(addQty, product.stock), stock: product.stock });
    }
    res.json({ success: true, cartCount: req.session.cart.reduce((s, i) => s + i.qty, 0), message: 'Produk ditambahkan ke keranjang' });
  } catch (e) { res.json({ success: false, message: 'Terjadi kesalahan' }); }
};

exports.getCart = (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  res.render('pages/shop/cart', { title: 'Keranjang Belanja', cart, total });
};

exports.updateCart = (req, res) => {
  const { product_id, qty } = req.body;
  if (!req.session.cart) return res.json({ success: false });
  const idx = req.session.cart.findIndex(i => i.id == product_id);
  if (idx > -1) {
    if (parseInt(qty) <= 0) req.session.cart.splice(idx, 1);
    else req.session.cart[idx].qty = Math.min(parseInt(qty), req.session.cart[idx].stock);
  }
  const total = req.session.cart.reduce((s, i) => s + i.price * i.qty, 0);
  res.json({ success: true, cartCount: req.session.cart.reduce((s, i) => s + i.qty, 0), total });
};

exports.removeFromCart = (req, res) => {
  const { product_id } = req.body;
  if (req.session.cart) req.session.cart = req.session.cart.filter(i => i.id != product_id);
  res.json({ success: true, cartCount: req.session.cart ? req.session.cart.reduce((s, i) => s + i.qty, 0) : 0 });
};

// ─── Wishlist ─────────────────────────────────────────────────
exports.toggleWishlist = async (req, res) => {
  if (!req.session.user) return res.json({ success: false, message: 'Login terlebih dahulu' });
  try {
    const { product_id } = req.body;
    const [rows] = await db.query('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.session.user.id, product_id]);
    if (rows.length) {
      await db.query('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.session.user.id, product_id]);
      return res.json({ success: true, inWishlist: false });
    }
    await db.query('INSERT INTO wishlists (user_id, product_id) VALUES (?,?)', [req.session.user.id, product_id]);
    res.json({ success: true, inWishlist: true });
  } catch (e) { res.json({ success: false }); }
};

// ─── Checkout ─────────────────────────────────────────────────
exports.getCheckout = (req, res) => {
  const cart = req.session.cart || [];
  if (!cart.length) { req.flash('error', 'Keranjang kosong.'); return res.redirect('/shop/cart'); }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = total >= 200000 ? 0 : 15000;
  res.render('pages/shop/checkout', { title: 'Checkout', cart, total, shipping, grandTotal: total + shipping, user: req.session.user });
};

exports.postCheckout = async (req, res) => {
  const cart = req.session.cart || [];
  if (!cart.length) return res.redirect('/shop/cart');
  try {
    const { shipping_name, shipping_phone, shipping_address, payment_method, notes } = req.body;
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const shipping_fee = total >= 200000 ? 0 : 15000;
    const grand_total = total + shipping_fee;
    const order_code = generateOrderCode();

    const [result] = await db.query(
      'INSERT INTO orders (order_code,user_id,total_amount,shipping_fee,grand_total,payment_method,shipping_name,shipping_phone,shipping_address,notes) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [order_code, req.session.user.id, total, shipping_fee, grand_total, payment_method, shipping_name, shipping_phone, shipping_address, notes]
    );
    const orderId = result.insertId;

    for (const item of cart) {
      await db.query('INSERT INTO order_items (order_id,product_id,qty,price,subtotal) VALUES (?,?,?,?,?)',
        [orderId, item.id, item.qty, item.price, item.price * item.qty]);
      await db.query('UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?', [item.qty, item.qty, item.id]);
    }

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    emailService.sendOrderConfirmation({ order_code, grand_total, payment_method, id: orderId }, users[0]).catch(console.error);

    await db.query('INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)',
      [req.session.user.id, 'Pesanan Dibuat', `Pesanan ${order_code} berhasil dibuat. Silakan lakukan pembayaran.`, 'order', `/user/orders/${orderId}`]);

    req.session.cart = [];
    res.redirect(`/shop/payment/${orderId}`);
  } catch (e) { console.error(e); req.flash('error', 'Gagal membuat pesanan.'); res.redirect('/shop/checkout'); }
};

// ─── Payment ─────────────────────────────────────────────────
exports.getPayment = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT o.*, GROUP_CONCAT(p.name SEPARATOR ", ") AS items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN products p ON oi.product_id = p.id WHERE o.id = ? AND o.user_id = ? GROUP BY o.id', [req.params.id, req.session.user.id]);
    if (!rows.length) return res.redirect('/user/orders');
    res.render('pages/shop/payment', { title: 'Pembayaran', order: rows[0] });
  } catch (e) { res.redirect('/user/orders'); }
};

exports.uploadPaymentProof = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ? AND payment_status = "pending"', [req.params.id, req.session.user.id]);
    if (!rows.length) return res.json({ success: false, message: 'Pesanan tidak ditemukan' });
    if (!req.files || !req.files.proof) return res.json({ success: false, message: 'File bukti transfer wajib diunggah' });

    const file = req.files.proof;
    const ext = path.extname(file.name);
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (!allowed.includes(ext.toLowerCase())) return res.json({ success: false, message: 'Format file tidak didukung' });

    const filename = `proof_${req.params.id}_${Date.now()}${ext}`;
    const uploadDir = path.join(__dirname, '../uploads/proofs');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    await file.mv(path.join(uploadDir, filename));

    await db.query('UPDATE orders SET payment_proof = ?, payment_status = "paid", paid_at = NOW(), order_status = "processing" WHERE id = ?', [filename, req.params.id]);

    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
    emailService.sendPaymentConfirmed({ order_code: rows[0].order_code, id: req.params.id }, users[0]).catch(console.error);

    res.json({ success: true, message: 'Bukti pembayaran berhasil diunggah' });
  } catch (e) { console.error(e); res.json({ success: false, message: 'Gagal mengunggah' }); }
};

// ─── Review ──────────────────────────────────────────────────
exports.postReview = async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;
    const [existing] = await db.query('SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [req.session.user.id, product_id]);
    if (existing.length) { req.flash('error', 'Anda sudah memberikan ulasan untuk produk ini.'); return res.redirect('back'); }
    await db.query('INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?,?,?,?)', [product_id, req.session.user.id, rating, comment]);
    req.flash('success', 'Ulasan berhasil dikirim. Terima kasih!');
    res.redirect('back');
  } catch (e) { req.flash('error', 'Gagal mengirim ulasan.'); res.redirect('back'); }
};
