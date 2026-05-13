const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const qrService = require('../services/qrService');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { nombre, apellido, email, password, telefono, direccion } = req.body;

    if (!nombre || !apellido || !email || !password)
      return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });

    const { data: existing } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing)
      return res.status(409).json({ success: false, message: 'Email ya registrado' });

    const password_hash = await bcrypt.hash(password, 12);
    const qr_id = uuidv4();
    const visitorUrl = `${process.env.VISITOR_BASE_URL}/${qr_id}`;
    const qr_image = await qrService.generateQRDataURL(visitorUrl);

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .insert({ nombre, apellido, email: email.toLowerCase(), password_hash, telefono, direccion, qr_id, qr_image })
      .select('id, nombre, apellido, email, telefono, direccion, qr_id, qr_image, created_at')
      .single();

    if (error) throw error;

    const token = generateToken(usuario.id);
    res.status(201).json({ success: true, token, usuario });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email y password requeridos' });

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (!usuario || !(await bcrypt.compare(password, usuario.password_hash)))
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

    await supabase.from('usuarios').update({ last_login: new Date().toISOString() }).eq('id', usuario.id);
    await supabase.from('eventos').insert({ user_id: usuario.id, tipo: 'login' });

    const token = generateToken(usuario.id);
    const { password_hash, ...usuarioSafe } = usuario;
    res.json({ success: true, token, usuario: usuarioSafe });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email, telefono, direccion, foto_fachada, qr_id, qr_image, push_token, is_active, last_login, created_at')
      .eq('id', req.userId)
      .single();

    if (error || !usuario)
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

    res.json({ success: true, usuario });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
exports.refreshToken = async (req, res, next) => {
  try {
    const { data: usuario } = await supabase.from('usuarios').select('id, is_active').eq('id', req.userId).single();
    if (!usuario || !usuario.is_active)
      return res.status(401).json({ success: false, message: 'Token inválido' });
    res.json({ success: true, token: generateToken(usuario.id) });
  } catch (err) { next(err); }
};
