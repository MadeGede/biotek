// ─── Auth Middleware ──────────────────────────────────────────

exports.isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error', 'Silakan login terlebih dahulu.');
  req.session.returnTo = req.originalUrl;
  res.redirect('/auth/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Akses ditolak. Hanya admin yang diizinkan.');
  res.redirect('/');
};

exports.isGuest = (req, res, next) => {
  if (!req.session.user) return next();
  res.redirect(req.session.user.role === 'admin' ? '/admin' : '/user/dashboard');
};
