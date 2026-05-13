const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const qrService = require('../services/qrService');

const verifyAdminKey = (req, res) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    res.status(401).json({ success: false, message: 'No autorizado' });
    return false;
  }
  return true;
};

const generateTempPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SD-${code}`;
};

// POST /api/admin/crear-usuario
exports.crearUsuario = async (req, res, next) => {
  try {
    if (!verifyAdminKey(req, res)) return;

    const { nombre, apellido, email, direccion } = req.body;
    if (!nombre || !apellido || !email)
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });

    const temp_password = generateTempPassword();
    const password_hash = await bcrypt.hash(temp_password, 12);
    const qr_id = uuidv4();
    const visitorUrl = `${process.env.VISITOR_BASE_URL}/${qr_id}`;
    const qr_image = await qrService.generateQRDataURL(visitorUrl);

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .insert({
        nombre, apellido, email: email.toLowerCase(),
        password_hash, direccion: direccion || null,
        qr_id, qr_image, must_change_password: true,
      })
      .select('id, nombre, apellido, email, qr_id, must_change_password, created_at')
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, usuario, temp_password });
  } catch (err) { next(err); }
};

// GET /api/admin/usuarios
exports.getUsuarios = async (req, res, next) => {
  try {
    if (!verifyAdminKey(req, res)) return;

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email, direccion, is_active, must_change_password, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, usuarios: data, total: data.length });
  } catch (err) { next(err); }
};
