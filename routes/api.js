const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.post('/chat', async (req, res) => {
  const { message } = req.body;
  const responses = {
    'halo|hi|hello': 'Halo! Saya BioBot 🌱 Asisten virtual PT BioTeknologi Nasional. Ada yang bisa saya bantu?',
    'produk|barang|jual': 'Kami menjual berbagai produk ramah lingkungan! Kunjungi halaman Shopping kami untuk melihat semua produk.',
    'daur ulang|limbah|sampah': 'Layanan daur ulang kami menerima plastik, kertas, elektronik, dan organik. Ajukan di halaman Daur Ulang dan dapatkan 50 poin!',
    'poin|reward': 'Setiap pengajuan daur ulang mendapat 50 poin yang bisa ditukar dengan diskon belanja!',
    'bayar|pembayaran|transfer': 'Kami menerima Transfer Bank dan QRIS. Upload bukti transfer di halaman pesanan Anda.',
    'kirim|ongkir': 'Gratis ongkos kirim untuk pembelian di atas Rp 200.000!',
    'kontak|hubungi': 'Hubungi kami: info@bioteknasional.id | +62 21 7890 1234'
  };
  const lower = message.toLowerCase();
  let reply = 'Maaf, saya belum paham. Silakan hubungi tim kami di info@bioteknasional.id atau gunakan form Contact!';
  for (const [key, val] of Object.entries(responses)) {
    if (new RegExp(key).test(lower)) { reply = val; break; }
  }
  await db.query('INSERT INTO chat_messages (session_id,sender,message) VALUES (?,?,?)', [req.session.id, 'user', message]).catch(()=>{});
  await db.query('INSERT INTO chat_messages (session_id,sender,message) VALUES (?,?,?)', [req.session.id, 'bot', reply]).catch(()=>{});
  res.json({ reply });
});

router.get('/products/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  const [rows] = await db.query('SELECT id,name,slug,price,image FROM products WHERE name LIKE ? AND is_active=1 LIMIT 6', ['%'+q+'%']);
  res.json(rows);
});

module.exports = router;
