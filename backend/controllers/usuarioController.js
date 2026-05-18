const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const qrService = require('../services/qrService');

// GET /api/usuarios/:id
exports.getUsuario = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, email, telefono, direccion, foto_fachada, qr_id, qr_image, push_token, is_active, last_login, created_at, updated_at, must_change_password, tipo, lat, lng')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, usuario: data });
  } catch (err) { next(err); }
};

// PUT /api/usuarios/:id
exports.updateUsuario = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const allowed = ['nombre', 'apellido', 'telefono', 'direccion', 'lat', 'lng', 'tipo', 'must_change_password'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    if (req.body.password) updates.password_hash = await bcrypt.hash(req.body.password, 12);

    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, nombre, apellido, email, telefono, direccion, foto_fachada, qr_id, updated_at')
      .single();

    if (error) throw error;
    res.json({ success: true, usuario: data });
  } catch (err) { next(err); }
};

// POST /api/usuarios/:id/foto-fachada
exports.uploadFotoFachada = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' });
    if (!req.file)
      return res.status(400).json({ success: false, message: 'No se recibió archivo' });

    const fotoUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    const { data, error } = await supabase
      .from('usuarios')
      .update({ foto_fachada: fotoUrl })
      .eq('id', req.params.id)
      .select('id, foto_fachada')
      .single();

    if (error) throw error;
    res.json({ success: true, foto_fachada: data.foto_fachada });
  } catch (err) { next(err); }
};

// POST /api/usuarios/:id/push-token
exports.savePushToken = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { push_token } = req.body;
    if (!push_token) return res.status(400).json({ success: false, message: 'push_token requerido' });

    await supabase.from('usuarios').update({ push_token }).eq('id', req.params.id);
    res.json({ success: true, message: 'Token guardado' });
  } catch (err) { next(err); }
};

// GET /api/usuarios/:id/qr
exports.getQR = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { data } = await supabase
      .from('usuarios')
      .select('qr_id, qr_image')
      .eq('id', req.params.id)
      .single();

    if (!data) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, qr_id: data.qr_id, qr_image: data.qr_image, visitor_url: `${process.env.VISITOR_BASE_URL}/${data.qr_id}` });
  } catch (err) { next(err); }
};

// POST /api/usuarios/:id/regenerar-qr
exports.regenerarQR = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const qr_id = uuidv4();
    const visitorUrl = `${process.env.VISITOR_BASE_URL}/${qr_id}`;
    const qr_image = await qrService.generateQRDataURL(visitorUrl);

    await supabase.from('usuarios').update({ qr_id, qr_image }).eq('id', req.params.id);
    res.json({ success: true, qr_id, qr_image, visitor_url: visitorUrl });
  } catch (err) { next(err); }
};
