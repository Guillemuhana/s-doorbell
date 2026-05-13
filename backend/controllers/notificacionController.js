const supabase = require('../config/supabase');
const pushService = require('../services/pushNotificationService');

// POST /api/notificaciones/guardar-token
exports.guardarToken = async (req, res, next) => {
  try {
    const { push_token } = req.body;
    if (!push_token) return res.status(400).json({ success: false, message: 'push_token requerido' });

    await supabase.from('usuarios').update({ push_token }).eq('id', req.userId);
    res.json({ success: true, message: 'Token guardado correctamente' });
  } catch (err) { next(err); }
};

// POST /api/notificaciones/test
exports.testNotification = async (req, res, next) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('push_token, nombre')
      .eq('id', req.userId)
      .single();

    if (!usuario?.push_token)
      return res.status(400).json({ success: false, message: 'No hay push token registrado' });

    await pushService.sendGenericNotification(usuario.push_token, '🔔 Test S-Doorbell', `Hola ${usuario.nombre}, las notificaciones funcionan!`);
    res.json({ success: true, message: 'Notificación de prueba enviada' });
  } catch (err) { next(err); }
};
