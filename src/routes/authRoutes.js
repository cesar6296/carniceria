const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { validarCampos } = require('../middlewares/errorMiddleware');
const { obtenerJwtSecret, esProduccion } = require('../config/jwt');

const router = express.Router();
const COOKIE_SESION = 'carniceria_session';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

function opcionesCookie() {
  return {
    httpOnly: true,
    secure: esProduccion,
    sameSite: 'strict',
    path: '/',
    maxAge: DURACION_SESION_MS
  };
}

router.post(
  '/login',
  [
    body('usuario').trim().notEmpty().withMessage('El usuario es obligatorio'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const { usuario, password } = req.body;
      const usuarioAdmin = process.env.ADMIN_USERNAME || 'uzielitoremix';
      const hashPassword = process.env.ADMIN_PASSWORD_HASH;

      if (!hashPassword) {
        return res.status(503).json({
          ok: false,
          mensaje: 'Falta configurar ADMIN_PASSWORD_HASH en el entorno del servidor.'
        });
      }

      const passwordValida = await bcrypt.compare(password, hashPassword);
      if (usuario !== usuarioAdmin || !passwordValida) {
        return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
      }

      const datosUsuario = {
        id: 'admin',
        nombre: process.env.ADMIN_DISPLAY_NAME || 'Uzielito Remix',
        usuario: usuarioAdmin,
        rol: 'admin'
      };
      const token = jwt.sign(datosUsuario, obtenerJwtSecret(), { expiresIn: '8h' });

      res.cookie(COOKIE_SESION, token, opcionesCookie());
      res.json({ ok: true, mensaje: 'Inicio de sesión exitoso', datos: { usuario: datosUsuario } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/perfil', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.[COOKIE_SESION]
    || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
  if (!token) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado' });
  }

  try {
    const decodificado = jwt.verify(token, obtenerJwtSecret());
    res.json({ ok: true, usuario: decodificado });
  } catch (error) {
    if (error.codigo === 'JWT_SECRET_FALTANTE') {
      return res.status(503).json({ ok: false, codigo: error.codigo, mensaje: error.message });
    }
    res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_SESION, opcionesCookie());
  res.json({ ok: true, mensaje: 'Sesión cerrada' });
});

module.exports = router;