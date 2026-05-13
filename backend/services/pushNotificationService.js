const { initFirebase, getAdmin } = require('../config/firebase');

exports.sendRingNotification = async (pushToken, visitorName, ownerName, eventoId = null) => {
  const app = initFirebase();
  if (!app) {
    console.warn('Push notification omitida: Firebase no configurado');
    return;
  }

  const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const title = '🔔 ¡Alguien en la puerta!';
  const body = visitorName
    ? `${visitorName} está en tu puerta • ${hora}`
    : `Hay un visitante en tu puerta • ${hora}`;

  await getAdmin().messaging().send({
    token: pushToken,
    notification: { title, body },
    data: {
      type: 'timbrazo',
      visitorName: visitorName || '',
      hora,
      evento_id: eventoId || '',
    },
    android: { priority: 'high', notification: { channelId: 'doorbell', sound: 'default' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  });
};

exports.sendGenericNotification = async (pushToken, title, body) => {
  const app = initFirebase();
  if (!app) return;

  await getAdmin().messaging().send({
    token: pushToken,
    notification: { title, body },
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default' } } },
  });
};
