const db = require('../config/db');
const emailService = require('../config/email');
const path = require('path');
const fs = require('fs');

function generateCode() {
  return 'DU-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
}

exports.index = (req, res) => {
  res.render('pages/recycle/index', { title: 'Layanan Daur Ulang' });
};

exports.getForm = (req, res) => {
  res.render('pages/recycle/form', { title: 'Ajukan Daur Ulang' });
};

exports.postForm = async (req, res) => {
  try {
    const { name, phone, address, waste_type, waste_weight, description, pickup_date, pickup_time } = req.body;
    if (!name || !phone || !address || !waste_type || !pickup_date) {
      req.flash('error', 'Harap lengkapi semua field wajib.'); return res.redirect('/daur-ulang/form');
    }

    let photoFilename = null;
    if (req.files && req.files.photo) {
      const file = req.files.photo;
      const ext = path.extname(file.name);
      if (!['.jpg','.jpeg','.png','.webp'].includes(ext.toLowerCase())) {
        req.flash('error', 'Format foto tidak didukung.'); return res.redirect('/daur-ulang/form');
      }
      photoFilename = `waste_${Date.now()}${ext}`;
      const dir = path.join(__dirname, '../uploads/waste');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await file.mv(path.join(dir, photoFilename));
    }

    const code = generateCode();
    const userId = req.session.user ? req.session.user.id : null;

    await db.query(
      'INSERT INTO recycle_submissions (submission_code,user_id,name,phone,address,waste_type,waste_weight,description,photo,pickup_date,pickup_time) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [code, userId, name, phone, address, waste_type, waste_weight || null, description, photoFilename, pickup_date, pickup_time]
    );

    // Points: 50 points per submission
    if (userId) {
      await db.query('UPDATE users SET points = points + 50 WHERE id = ?', [userId]);
      await db.query('INSERT INTO points_history (user_id,type,points,description,ref_type) VALUES (?,?,?,?,?)',
        [userId, 'earn', 50, `Pengajuan daur ulang ${code}`, 'recycle']);
      req.session.user.points = (req.session.user.points || 0) + 50;
      await db.query('INSERT INTO notifications (user_id,title,message,type,link) VALUES (?,?,?,?,?)',
        [userId, 'Poin Diterima!', `Anda mendapat 50 poin dari pengajuan daur ulang ${code}`, 'points', '/user/points']);
    }

    const email = req.session.user ? (await db.query('SELECT email FROM users WHERE id = ?', [userId]))[0][0]?.email : req.body.email;
    if (email) emailService.sendRecycleConfirmation({ submission_code: code, name, waste_type, pickup_date, pickup_time }, email).catch(console.error);

    req.flash('success', `Pengajuan berhasil! Kode: ${code}. Anda mendapat 50 poin!`);
    res.redirect('/daur-ulang/tracking?code=' + code);
  } catch (e) { console.error(e); req.flash('error', 'Terjadi kesalahan server.'); res.redirect('/daur-ulang/form'); }
};

exports.tracking = async (req, res) => {
  const { code } = req.query;
  let submission = null;
  if (code) {
    const [rows] = await db.query('SELECT * FROM recycle_submissions WHERE submission_code = ?', [code]);
    submission = rows[0] || null;
  }
  res.render('pages/recycle/tracking', { title: 'Tracking Daur Ulang', submission, code });
};
