const supabase = require('../config/supabase');

// GET /api/eventos/historial/:userId
exports.getHistorial = async (req, res, next) => {
  try {
    if (req.userId !== req.params.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('eventos')
      .select('*', { count: 'exact' })
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      success: true,
      eventos: data,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
    });
  } catch (err) { next(err); }
};

// GET /api/eventos/stats/:userId
exports.getStats = async (req, res, next) => {
  try {
    if (req.userId !== req.params.userId)
      return res.status(403).json({ success: false, message: 'Sin permiso' });

    const { data, error } = await supabase
      .from('eventos')
      .select('tipo')
      .eq('user_id', req.params.userId);

    if (error) throw error;

    const stats = data.reduce((acc, e) => {
      acc[e.tipo] = (acc[e.tipo] || 0) + 1;
      return acc;
    }, {});

    res.json({ success: true, stats, total: data.length });
  } catch (err) { next(err); }
};

// DELETE /api/eventos/:id
exports.deleteEvento = async (req, res, next) => {
  try {
    const { data: evento } = await supabase.from('eventos').select('user_id').eq('id', req.params.id).single();
    if (!evento) return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    if (evento.user_id !== req.userId) return res.status(403).json({ success: false, message: 'Sin permiso' });

    await supabase.from('eventos').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Evento eliminado' });
  } catch (err) { next(err); }
};
