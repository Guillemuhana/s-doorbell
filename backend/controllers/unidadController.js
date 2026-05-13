const supabase = require('../config/supabase');

// GET /api/unidades/:userId
exports.getUnidades = async (req, res, next) => {
  try {
    if (req.userId !== req.params.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { data, error } = await supabase
      .from('unidades')
      .select('id, nombre, push_token_residente, is_active, created_at')
      .eq('usuario_id', req.params.userId)
      .order('nombre');

    if (error) throw error;
    res.json({ success: true, unidades: data });
  } catch (err) { next(err); }
};

// POST /api/unidades/:userId
exports.crearUnidad = async (req, res, next) => {
  try {
    if (req.userId !== req.params.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { nombre, push_token_residente } = req.body;
    if (!nombre)
      return res.status(400).json({ success: false, message: 'nombre requerido' });

    const { data, error } = await supabase
      .from('unidades')
      .insert({ usuario_id: req.params.userId, nombre, push_token_residente: push_token_residente || null })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, unidad: data });
  } catch (err) { next(err); }
};

// PUT /api/unidades/:unidadId
exports.actualizarUnidad = async (req, res, next) => {
  try {
    const { data: unidad } = await supabase
      .from('unidades')
      .select('usuario_id')
      .eq('id', req.params.unidadId)
      .single();

    if (!unidad)
      return res.status(404).json({ success: false, message: 'Unidad no encontrada' });
    if (unidad.usuario_id !== req.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const allowed = ['nombre', 'push_token_residente', 'is_active'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const { data, error } = await supabase
      .from('unidades')
      .update(updates)
      .eq('id', req.params.unidadId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, unidad: data });
  } catch (err) { next(err); }
};

// DELETE /api/unidades/:unidadId
exports.eliminarUnidad = async (req, res, next) => {
  try {
    const { data: unidad } = await supabase
      .from('unidades')
      .select('usuario_id')
      .eq('id', req.params.unidadId)
      .single();

    if (!unidad)
      return res.status(404).json({ success: false, message: 'Unidad no encontrada' });
    if (unidad.usuario_id !== req.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    await supabase.from('unidades').delete().eq('id', req.params.unidadId);
    res.json({ success: true, message: 'Unidad eliminada' });
  } catch (err) { next(err); }
};
