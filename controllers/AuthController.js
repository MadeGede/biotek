const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const emailService = require('../config/email');

exports.validateRegister = [
  body('name').trim().isLength({ min: 2, max: 150 }).withMessage('Nama harus 2-150 karakter'),
  body('email').isEmail().normalizeEmail().withMessage('Email tidak valid'),
  body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password harus mengandung huruf besar, kecil, dan angka'),
  body('password_confirm').custom((val, { req }) => { if (val !== req.body.password) throw new Error('Konfirmasi password tidak cocok'); return true; }),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Nomor HP tidak valid')
];

exports.validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Email tidak valid'),
  body('password').notEmpty().withMessage('Password wajib diisi')
];

exports.getLogin = (req, res) => {
  res.render('pages/auth/login', { title: 'Login' });
};

exports.getRegister = (req, res) => {
  res.render('pages/auth/register', { title: 'Daftar Akun' });
};

exports.postLogin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/auth/login');
  }
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    if (!rows.length) { req.flash('error', 'Email atau password salah.'); return res.redirect('/auth/login'); }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) { req.flash('error', 'Email atau password salah.'); return res.redirect('/auth/login'); }
    req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role, points: user.points, avatar: user.avatar };
    req.flash('success', `Selamat datang kembali, ${user.name}!`);
    const returnTo = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/user/dashboard');
    delete req.session.returnTo;
    res.redirect(returnTo);
  } catch (e) { console.error(e); req.flash('error', 'Terjadi kesalahan server.'); res.redirect('/auth/login'); }
};

exports.postRegister = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array()[0].msg);
    return res.redirect('/auth/register');
  }
  try {
    const { name, email, password, phone } = req.body;
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) { req.flash('error', 'Email sudah terdaftar.'); return res.redirect('/auth/register'); }
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, email_verified_at) VALUES (?,?,?,?,NOW())',
      [name, email, hash, phone || null]
    );
    req.session.user = { id: result.insertId, name, email, role: 'customer', points: 0 };
    // Send welcome email (non-blocking)
    emailService.sendWelcome({ name, email }).catch(console.error);
    req.flash('success', `Selamat datang, ${name}! Akun Anda berhasil dibuat.`);
    res.redirect('/user/dashboard');
  } catch (e) { console.error(e); req.flash('error', 'Terjadi kesalahan server.'); res.redirect('/auth/register'); }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/'));
};
