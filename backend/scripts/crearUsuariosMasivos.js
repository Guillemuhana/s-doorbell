require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const qrService = require('../services/qrService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SD-${code}`;
};

const pad = (n, len) => String(n).padStart(len, '0');

async function crearUsuariosMasivos(count) {
  console.log(`\n🚀 Creando ${count} usuarios demo...\n`);
  const csvRows = ['nombre,apellido,email,password_temporal,qr_id,visitor_url,created_at'];
  const errors = [];

  for (let i = 1; i <= count; i++) {
    const num = pad(i, 3);
    const nombre = `Cliente${num}`;
    const apellido = 'S-Doorbell';
    const email = `cliente${num}@s-doorbell.com`;
    const temp_password = generateTempPassword();
    const password_hash = await bcrypt.hash(temp_password, 10);
    const qr_id = uuidv4();
    const visitorUrl = `${process.env.VISITOR_BASE_URL}/${qr_id}`;

    let qr_image = null;
    try {
      qr_image = await qrService.generateQRDataURL(visitorUrl);
    } catch (e) {
      console.warn(`  QR generation skipped for ${email}`);
    }

    const { error } = await supabase.from('usuarios').insert({
      nombre, apellido,
      email,
      password_hash,
      qr_id, qr_image,
      must_change_password: true,
    });

    if (error) {
      errors.push({ email, error: error.message });
      console.error(`  ❌ ${email}: ${error.message}`);
    } else {
      csvRows.push(`${nombre},${apellido},${email},${temp_password},${qr_id},${visitorUrl},${new Date().toISOString()}`);
      process.stdout.write(`  ✅ ${i}/${count} ${email} [${temp_password}]\r`);
    }
  }

  const csvPath = path.join(__dirname, `../usuarios_demo_${Date.now()}.csv`);
  fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');

  console.log(`\n\n✅ Proceso completado.`);
  console.log(`   Creados: ${csvRows.length - 1}`);
  console.log(`   Errores: ${errors.length}`);
  console.log(`   CSV exportado: ${csvPath}`);
}

const count = parseInt(process.argv[2]);
if (!count || count < 1) {
  console.error('Uso: node scripts/crearUsuariosMasivos.js <cantidad>');
  console.error('Ejemplo: node scripts/crearUsuariosMasivos.js 100');
  process.exit(1);
}

crearUsuariosMasivos(count).catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
