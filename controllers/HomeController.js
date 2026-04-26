const db = require('../config/db');

// ─── HOME CONTROLLER ─────────────────────────────────────────
exports.home = async (req, res) => {
  try {
    const [featured] = await db.query(`SELECT p.*, COALESCE(AVG(r.rating),0) AS avg_rating FROM products p LEFT JOIN reviews r ON p.id = r.product_id WHERE p.is_featured = 1 AND p.is_active = 1 GROUP BY p.id LIMIT 6`);
    const [testimonials] = await db.query(`SELECT r.*, u.name AS user_name, u.avatar, p.name AS product_name FROM reviews r JOIN users u ON r.user_id = u.id JOIN products p ON r.product_id = p.id WHERE r.rating >= 4 ORDER BY r.created_at DESC LIMIT 6`);
    const [[stats]] = await db.query(`SELECT (SELECT COUNT(*) FROM users WHERE role='customer') AS users, (SELECT COUNT(*) FROM products WHERE is_active=1) AS products, (SELECT COUNT(*) FROM recycle_submissions WHERE status='completed') AS recycled, (SELECT COALESCE(SUM(grand_total),0) FROM orders WHERE payment_status='paid') AS revenue`);
    res.render('pages/home', { title: 'Home', featured, testimonials, stats });
  } catch (e) { console.error(e); res.status(500).render('pages/error', { title: 'Error', error: e }); }
};

exports.about = (req, res) => res.render('pages/about', { title: 'Tentang Kami' });
exports.contact = (req, res) => res.render('pages/contact', { title: 'Hubungi Kami' });

exports.postContact = async (req, res) => {
  req.flash('success', 'Pesan Anda berhasil dikirim! Kami akan menghubungi Anda segera.');
  res.redirect('/contact');
};
