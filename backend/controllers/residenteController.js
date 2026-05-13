const supabase = require('../config/supabase');

// GET /api/residentes/:userId
exports.getResidentes = async (req, res, next) => {
  try {
    if (req.userId !== req.params.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { data, error } = await supabase
      .from('residentes')
      .select('id, nombre, push_token, is_active, created_at')
      .eq('usuario_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, residentes: data });
  } catch (err) { next(err); }
};

// POST /api/residentes/:userId
exports.crearResidente = async (req, res, next) => {
  try {
    if (req.userId !== req.params.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { nombre, push_token } = req.body;
    if (!nombre)
      return res.status(400).json({ success: false, message: 'nombre requerido' });

    const { data, error } = await supabase
      .from('residentes')
      .insert({ usuario_id: req.params.userId, nombre, push_token: push_token || null })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, residente: data });
  } catch (err) { next(err); }
};

// DELETE /api/residentes/:residenteId
exports.eliminarResidente = async (req, res, next) => {
  try {
    const { data: residente } = await supabase
      .from('residentes')
      .select('usuario_id')
      .eq('id', req.params.residenteId)
      .single();

    if (!residente)
      return res.status(404).json({ success: false, message: 'Residente no encontrado' });
    if (residente.usuario_id !== req.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    await supabase.from('residentes').delete().eq('id', req.params.residenteId);
    res.json({ success: true, message: 'Residente eliminado' });
  } catch (err) { next(err); }
};
