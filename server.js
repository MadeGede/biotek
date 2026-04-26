require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ─── View Engine ─────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ───────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(fileUpload({ limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, useTempFiles: true, tempFileDir: '/tmp/' }));

// ─── Session ─────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'biotek_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
}));
app.use(flash());

// ─── Global Locals ────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.cart = req.session.cart || [];
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.appName = process.env.APP_NAME || 'PT BioTeknologi Nasional';
  next();
});

// ─── Routes ──────────────────────────────────────────────────
const homeRoutes      = require('./routes/home');
const authRoutes      = require('./routes/auth');
const shopRoutes      = require('./routes/shop');
const recyclRoutes    = require('./routes/recycle');
const userRoutes      = require('./routes/user');
const adminRoutes     = require('./routes/admin');
const apiRoutes       = require('./routes/api');

app.use('/',         homeRoutes);
app.use('/auth',     authRoutes);
app.use('/shop',     shopRoutes);
app.use('/daur-ulang', recyclRoutes);
app.use('/user',     userRoutes);
app.use('/admin',    adminRoutes);
app.use('/api',      apiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Halaman Tidak Ditemukan' });
});

// ─── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { title: 'Terjadi Kesalahan', error: process.env.NODE_ENV === 'development' ? err : {} });
});

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌱 PT BioTeknologi Nasional berjalan di http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
