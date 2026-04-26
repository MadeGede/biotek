const db = require('../config/db');

exports.dashboard = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const [orders] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId]);
    const [recycles] = await db.query('SELECT * FROM recycle_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [userId]);
    const [[userStats]] = await db.query('SELECT points, (SELECT COUNT(*) FROM orders WHERE user_id=?) AS total_orders, (SELECT COUNT(*) FROM recycle_submissions WHERE user_id=?) AS total_recycles FROM users WHERE id=?', [userId, userId, userId]);
    const [notifications] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [userId]);
    res.render('pages/user/dashboard', { title: 'Dashboard Saya', orders, recycles, userStats, notifications });
  } catch (e) { console.error(e); res.status(500).render('pages/error', { title: 'Error', error: e }); }
};

exports.orders = async (req, res) => {
  const [orders] = await db.query(`SELECT o.*, GROUP_CONCAT(p.name SEPARATOR ', ') AS product_names FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id LEFT JOIN products p ON oi.product_id = p.id WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC`, [req.session.user.id]);
  res.render('pages/user/orders', { title: 'Riwayat Pesanan', orders });
};

exports.orderDetail = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.session.user.id]);
  if (!rows.length) return res.redirect('/user/orders');
  const [items] = await db.query('SELECT oi.*, p.name, p.image, p.slug FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?', [req.params.id]);
  res.render('pages/user/order-detail', { title: 'Detail Pesanan', order: rows[0], items });
};

exports.recycles = async (req, res) => {
  const [recycles] = await db.query('SELECT * FROM recycle_submissions WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
  res.render('pages/user/recycles', { title: 'Riwayat Daur Ulang', recycles });
};

exports.wishlist = async (req, res) => {
  const [products] = await db.query(`SELECT p.*, COALESCE(AVG(r.rating),0) AS avg_rating FROM wishlists w JOIN products p ON w.product_id = p.id LEFT JOIN reviews r ON p.id = r.product_id WHERE w.user_id = ? GROUP BY p.id`, [req.session.user.id]);
  res.render('pages/user/wishlist', { title: 'Wishlist Saya', products });
};

exports.points = async (req, res) => {
  const [history] = await db.query('SELECT * FROM points_history WHERE user_id = ? ORDER BY created_at DESC', [req.session.user.id]);
  const [[{ points }]] = await db.query('SELECT points FROM users WHERE id = ?', [req.session.user.id]);
  res.render('pages/user/points', { title: 'Poin & Reward', history, points });
};

exports.profile = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
  res.render('pages/user/profile', { title: 'Profil Saya', userData: rows[0] });
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await db.query('UPDATE users SET name=?, phone=?, address=? WHERE id=?', [name, phone, address, req.session.user.id]);
    req.session.user.name = name;
    req.flash('success', 'Profil berhasil diperbarui.');
    res.redirect('/user/profile');
  } catch (e) { req.flash('error', 'Gagal memperbarui profil.'); res.redirect('/user/profile'); }
};

exports.markNotificationRead = async (req, res) => {
  await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.session.user.id]);
  res.json({ success: true });
};

exports.getNotifications = async (req, res) => {
  const [notifs] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.session.user.id]);
  const [[{ unread }]] = await db.query('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0', [req.session.user.id]);
  res.json({ notifications: notifs, unread });
};
