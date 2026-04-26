const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

const baseTemplate = (content) => `
<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body{font-family:'Segoe UI',sans-serif;background:#f4f7f2;margin:0;padding:20px}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(30,86,49,.1)}
  .header{background:linear-gradient(135deg,#1e5631,#2d7a47);padding:40px 32px;text-align:center}
  .header h1{color:#c8e87a;margin:0;font-size:24px;letter-spacing:.5px}
  .header p{color:rgba(255,255,255,.8);margin:8px 0 0}
  .body{padding:32px}
  .body p{color:#3a4e30;line-height:1.7;margin:0 0 16px}
  .btn{display:inline-block;background:#1e5631;color:#c8e87a!important;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0}
  .info-box{background:#f0f5ed;border-left:4px solid #2d7a47;border-radius:0 8px 8px 0;padding:16px 20px;margin:16px 0}
  .footer{text-align:center;padding:24px;color:#6b7f5e;font-size:13px;border-top:1px solid #eaf0e6}
</style></head><body>
<div class="wrap">${content}
<div class="footer">
  <p>© 2024 PT BioTeknologi Nusantara. Semua hak dilindungi.</p>
  <p>Jl. Teknologi Hijau No. 88, Jakarta Selatan 12740</p>
</div></div></body></html>`;

const emailService = {
  async sendWelcome(user) {
    const html = baseTemplate(`
      <div class="header"><h1>🌱 Selamat Datang!</h1><p>PT BioTeknologi Nasional</p></div>
      <div class="body">
        <p>Halo <strong>${user.name}</strong>,</p>
        <p>Terima kasih telah bergabung bersama kami! Akun Anda telah berhasil dibuat.</p>
        <div class="info-box">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Bergabung:</strong> ${new Date().toLocaleDateString('id-ID',{dateStyle:'long'})}</p>
        </div>
        <p>Mulai belanja produk ramah lingkungan atau ajukan daur ulang limbah Anda sekarang!</p>
        <a class="btn" href="${process.env.APP_URL}/shop">Mulai Belanja →</a>
      </div>`);
    return transporter.sendMail({ from:`"${process.env.EMAIL_NAME}" <${process.env.EMAIL_FROM}>`, to: user.email, subject:'Selamat Datang di PT BioTeknologi Nasional 🌱', html });
  },

  async sendOrderConfirmation(order, user) {
    const html = baseTemplate(`
      <div class="header"><h1>🛒 Pesanan Diterima!</h1><p>Kode: ${order.order_code}</p></div>
      <div class="body">
        <p>Halo <strong>${user.name}</strong>,</p>
        <p>Pesanan Anda telah berhasil dibuat. Silakan selesaikan pembayaran dalam <strong>24 jam</strong>.</p>
        <div class="info-box">
          <p><strong>Kode Pesanan:</strong> ${order.order_code}</p>
          <p><strong>Total Pembayaran:</strong> Rp ${Number(order.grand_total).toLocaleString('id-ID')}</p>
          <p><strong>Metode:</strong> ${order.payment_method === 'bank_transfer' ? 'Transfer Bank' : 'QRIS'}</p>
        </div>
        <a class="btn" href="${process.env.APP_URL}/user/orders/${order.id}">Lihat Detail Pesanan →</a>
      </div>`);
    return transporter.sendMail({ from:`"${process.env.EMAIL_NAME}" <${process.env.EMAIL_FROM}>`, to: user.email, subject:`Konfirmasi Pesanan ${order.order_code} - BioTek Nasional`, html });
  },

  async sendPaymentConfirmed(order, user) {
    const html = baseTemplate(`
      <div class="header"><h1>✅ Pembayaran Dikonfirmasi!</h1><p>Kode: ${order.order_code}</p></div>
      <div class="body">
        <p>Halo <strong>${user.name}</strong>,</p>
        <p>Pembayaran Anda telah kami konfirmasi. Pesanan Anda sedang kami proses dan akan segera dikirimkan.</p>
        <div class="info-box">
          <p><strong>Kode Pesanan:</strong> ${order.order_code}</p>
          <p><strong>Status:</strong> Diproses</p>
        </div>
        <a class="btn" href="${process.env.APP_URL}/user/orders/${order.id}">Lacak Pesanan →</a>
      </div>`);
    return transporter.sendMail({ from:`"${process.env.EMAIL_NAME}" <${process.env.EMAIL_FROM}>`, to: user.email, subject:`Pembayaran Dikonfirmasi - ${order.order_code}`, html });
  },

  async sendRecycleConfirmation(submission, email) {
    const html = baseTemplate(`
      <div class="header"><h1>♻️ Pengajuan Daur Ulang Diterima!</h1><p>Kode: ${submission.submission_code}</p></div>
      <div class="body">
        <p>Halo <strong>${submission.name}</strong>,</p>
        <p>Pengajuan daur ulang limbah Anda telah kami terima. Tim kami akan menghubungi Anda untuk konfirmasi jadwal pickup.</p>
        <div class="info-box">
          <p><strong>Kode Pengajuan:</strong> ${submission.submission_code}</p>
          <p><strong>Jenis Limbah:</strong> ${submission.waste_type}</p>
          <p><strong>Jadwal Pickup:</strong> ${submission.pickup_date} ${submission.pickup_time}</p>
        </div>
        <p>Terima kasih telah berkontribusi untuk lingkungan yang lebih baik! 🌿</p>
      </div>`);
    return transporter.sendMail({ from:`"${process.env.EMAIL_NAME}" <${process.env.EMAIL_FROM}>`, to: email, subject:`Pengajuan Daur Ulang ${submission.submission_code} Diterima`, html });
  }
};

module.exports = emailService;
