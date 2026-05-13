const supabase = require('../config/supabase');
const pushService = require('../services/pushNotificationService');

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// GET /api/visitor/:qrId  (público)
exports.getVisitorInfo = async (req, res, next) => {
  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, direccion, foto_fachada, qr_id, tipo')
      .eq('qr_id', req.params.qrId)
      .eq('is_active', true)
      .single();

    if (!usuario) return res.status(404).json({ success: false, message: 'QR no válido' });

    await supabase.from('eventos').insert({
      user_id: usuario.id, tipo: 'vista_qr',
      visitor_ip: req.ip || req.headers['x-forwarded-for'],
    });

    let unidades = [];
    if (usuario.tipo === 'edificio') {
      const { data } = await supabase
        .from('unidades')
        .select('id, nombre')
        .eq('usuario_id', usuario.id)
        .eq('is_active', true)
        .order('nombre');
      unidades = data || [];
    }

    res.json({
      success: true,
      owner: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        direccion: usuario.direccion,
        foto_fachada: usuario.foto_fachada,
      },
      tipo: usuario.tipo,
      unidades,
    });
  } catch (err) { next(err); }
};

// POST /api/visitor/:qrId/ring  (público)
exports.ringDoorbell = async (req, res, next) => {
  try {
    const { visitor_name, visitor_lat, visitor_lng, unidad_id } = req.body;

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, nombre, push_token, lat, lng, tipo')
      .eq('qr_id', req.params.qrId)
      .eq('is_active', true)
      .single();

    if (!usuario) return res.status(404).json({ success: false, message: 'QR no válido' });

    // Geo anti-spam: validar distancia si la propiedad tiene coordenadas y el visitante las envió
    if (usuario.lat != null && usuario.lng != null && visitor_lat != null && visitor_lng != null) {
      const dist = haversineDistance(
        parseFloat(visitor_lat), parseFloat(visitor_lng),
        usuario.lat, usuario.lng
      );
      if (dist > 100) {
        return res.status(403).json({
          success: false,
          message: `Estás demasiado lejos de la propiedad (${Math.round(dist)}m). Debés estar a menos de 100m para usar el timbre.`,
        });
      }
    }

    // Crear evento
    const { data: evento } = await supabase
      .from('eventos')
      .insert({
        user_id: usuario.id, tipo: 'timbrazo',
        visitor_ip: req.ip || req.headers['x-forwarded-for'],
        visitor_name: visitor_name || null,
        notification_sent: false,
      })
      .select('id')
      .single();

    const sendPromises = [];

    if (usuario.tipo === 'edificio' && unidad_id) {
      // Modo edificio: notificar solo al residente de la unidad elegida
      const { data: unidad } = await supabase
        .from('unidades')
        .select('push_token_residente, nombre')
        .eq('id', unidad_id)
        .eq('usuario_id', usuario.id)
        .single();

      if (unidad?.push_token_residente) {
        sendPromises.push(
          pushService.sendRingNotification(unidad.push_token_residente, visitor_name, `Unidad ${unidad.nombre}`, evento.id)
        );
      }
    } else {
      // Casa: notificar al dueño
      if (usuario.push_token) {
        sendPromises.push(pushService.sendRingNotification(usuario.push_token, visitor_name, usuario.nombre, evento.id));
      }
      // Notificar a todos los residentes activos
      const { data: residentes } = await supabase
        .from('residentes')
        .select('push_token')
        .eq('usuario_id', usuario.id)
        .eq('is_active', true)
        .not('push_token', 'is', null);

      (residentes || []).forEach(r => {
        sendPromises.push(pushService.sendRingNotification(r.push_token, visitor_name, usuario.nombre, evento.id));
      });
    }

    let notification_sent = false;
    let notification_error = null;
    try {
      await Promise.all(sendPromises);
      notification_sent = sendPromises.length > 0;
    } catch (e) {
      notification_error = e.message;
    }

    await supabase.from('eventos').update({ notification_sent, notification_error }).eq('id', evento.id);

    res.json({ success: true, message: '🔔 ¡Timbre enviado!', notification_sent, evento_id: evento.id });
  } catch (err) { next(err); }
};
