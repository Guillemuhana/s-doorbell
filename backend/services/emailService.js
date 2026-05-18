const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendPasswordReset = async (toEmail, nombreUsuario, tempPassword) => {
  await transporter.sendMail({
    from: `"S-Doorbell" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Recuperación de contraseña — S-Doorbell',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f5f5f5;border-radius:16px;">
        <h2 style="color:#1a1a2e;margin-bottom:8px;">S<span style="color:#4f46e5">-</span>Doorbell</h2>
        <p style="color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">TIMBRE DIGITAL</p>
        <p style="color:#333;">Hola <strong>${nombreUsuario}</strong>,</p>
        <p style="color:#333;">Recibimos una solicitud para restablecer tu contraseña. Tu contraseña temporal es:</p>
        <div style="background:#fff;border-radius:12px;padding:20px;text-align:center;margin:24px 0;border:2px solid #4f46e5;">
          <span style="font-size:28px;font-weight:800;color:#4f46e5;letter-spacing:4px;">${tempPassword}</span>
        </div>
        <p style="color:#555;font-size:13px;">Ingresá con esta contraseña y la app te pedirá que elijas una nueva.</p>
        <p style="color:#aaa;font-size:11px;margin-top:24px;">Si no solicitaste este cambio, podés ignorar este email. Tu cuenta sigue segura.</p>
      </div>
    `,
  });
};
