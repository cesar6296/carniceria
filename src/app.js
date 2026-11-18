const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const { probarConexionMySQL } = require('./config/mysql');
const { probarConexionMongo } = require('./config/mongo');
const { manejadorErrores } = require('./middlewares/errorMiddleware');

const catalogosRoutes = require('./routes/catalogosRoutes');
const inventarioRoutes = require('./routes/inventarioRoutes');
const mermasRoutes = require('./routes/mermasRoutes');
const ventasRoutes = require('./routes/ventasRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const limitadorEscritura = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { ok: false, mensaje: 'Demasiadas solicitudes, intente más tarde' }
});

app.use('/api/ventas', limitadorEscritura);
app.use('/api/mermas', limitadorEscritura);
app.use('/api/inventario/lotes', limitadorEscritura);

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
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
