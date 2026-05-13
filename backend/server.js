require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const visitorRoutes = require('./routes/visitor');
const eventoRoutes = require('./routes/eventos');
const notificacionRoutes = require('./routes/notificaciones');
const residenteRoutes = require('./routes/residentes');
const unidadRoutes = require('./routes/unidades');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

// Verificar Supabase al arrancar
const supabase = require('./config/supabase');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting global
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { success: false, message: 'Demasiadas solicitudes, intente más tarde' }
}));

// Archivos estáticos (fotos fachada)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/residentes', residenteRoutes);
app.use('/api/unidades', unidadRoutes);
app.use('/api/admin', adminRoutes);

// Visitor web page — sirve el HTML del timbre para cualquier /visit/:qrId
app.get('/visit/:qrId', (req, res) => {
  res.sendFile(path.join(__dirname, 'visitor', 'index.html'));
});

// Root health check (Railway default)
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'S-Doorbell API' });
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await supabase.from('usuarios').select('id').limit(1);
    res.json({ status: 'ok', db: 'supabase connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'error', db: e.message });
  }
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 S-Doorbell backend corriendo en puerto ${PORT}`);
  console.log(`✅ Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
});
