const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { probarConexionMySQL } = require('./config/mysql');
const { probarConexionMongo } = require('./config/mongo');
const { manejadorErrores } = require('./middlewares/errorMiddleware');
const { verificarToken } = require('./middlewares/authMiddleware');

const catalogosRoutes = require('./routes/catalogosRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const mermasRoutes = require('./routes/mermasRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const limitadorEscritura = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { ok: false, mensaje: 'Demasiadas solicitudes, intente más tarde' }
});

const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_RATE_LIMIT || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' }
});

app.use('/api/ventas', limitadorEscritura);
app.use('/api/mermas', limitadorEscritura);
app.use('/api/inventario/lotes', limitadorEscritura);
app.use('/api/auth/login', limitadorLogin);

// Rutas públicas: salud y login. Todo lo demás requiere un JWT válido.
app.use('/api', (req, res, next) => {
  const ruta = req.originalUrl.split('?')[0];
  if (ruta === '/api/salud' || ruta === '/api/auth/login') {
    return next();
  }
  return verificarToken(req, res, next);
});

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/salud', async (req, res) => {
  const mysqlStatus = await probarConexionMySQL();
  const mongoStatus = probarConexionMongo();
  const todoOk = mysqlStatus.estado === 'ok' && mongoStatus.estado === 'ok';

  res.status(200).json({
    ok: true,
    estado: todoOk ? 'ok' : 'modo_demostracion',
    mysql: mysqlStatus.estado,
    mongodb: mongoStatus.estado,
    detalles: {
      mysql: mysqlStatus,
      mongodb: mongoStatus
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/api', catalogosRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/mermas', mermasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);

app.use(manejadorErrores);

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexHtml = path.join(__dirname, '../public/index.html');
  if (!fs.existsSync(indexHtml)) {
    return res.status(404).json({ ok: false, mensaje: 'Frontend no encontrado en el despliegue' });
  }

  res.sendFile(indexHtml);
});

module.exports = app;
