const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { validarCampos } = require('../middlewares/errorMiddleware');
const { obtenerJwtSecret, esProduccion } = require('../config/jwt');
const { verificarToken } = require('../middlewares/authMiddleware');
const UsuarioRepository = require('../repositories/usuarioRepository');

const router = express.Router();
const COOKIE_SESION = 'carniceria_session';
const DURACION_SESION_MS = 8 * 60 * 60 * 1000;

function opcionesCookie(mantenerSesion = true) {
  const opciones = {
    httpOnly: true,
    secure: esProduccion,
    sameSite: 'strict',
    path: '/'
  };
  if (mantenerSesion) opciones.maxAge = DURACION_SESION_MS;
  return opciones;
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
      const mantenerSesion = req.body.mantenerSesion !== false;
      const hashPassword = process.env.ADMIN_PASSWORD_HASH;

      if (!hashPassword) {
        return res.status(503).json({
          ok: false,
          mensaje: 'Falta configurar ADMIN_PASSWORD_HASH en el entorno del servidor.'
        });
      }

      await UsuarioRepository.asegurarAdministrador();
      const usuarioMongo = await UsuarioRepository.buscarPorUsuario(usuario);
      const passwordValida = usuarioMongo
        ? await bcrypt.compare(password, usuarioMongo.password_hash)
        : false;
      if (!passwordValida) {
        return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
      }

      const datosUsuario = {
        id: usuarioMongo.id,
        nombre: usuarioMongo.nombre,
        usuario: usuarioMongo.usuario,
        rol: usuarioMongo.rol
      };
      const token = jwt.sign(datosUsuario, obtenerJwtSecret(), { expiresIn: '8h' });

      res.cookie(COOKIE_SESION, token, opcionesCookie(mantenerSesion));
      res.json({ ok: true, mensaje: 'Inicio de sesión exitoso', datos: { usuario: datosUsuario } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/perfil', verificarToken, async (req, res, next) => {
  try {
    const perfil = await UsuarioRepository.obtenerPerfilPorId(req.usuario.id);
    if (!perfil) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
    res.json({ ok: true, usuario: perfil });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/perfil',
  verificarToken,
  [
    body('nombre').trim().notEmpty().isLength({ max: 120 }).withMessage('El nombre es obligatorio y no puede superar 120 caracteres'),
    body('correo').optional({ checkFalsy: true }).isEmail().withMessage('El correo electrónico no es válido'),
    body('telefono').optional({ checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('El teléfono no puede superar 30 caracteres'),
    body('foto').optional({ nullable: true }).custom((valor) => {
      if (valor === '' || valor === null || valor === undefined) return true;
      if (typeof valor !== 'string' || valor.length > 450000) {
        throw new Error('La foto es demasiado grande');
      }
      if (!/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(valor)) {
        throw new Error('La foto debe ser JPG, PNG o WebP');
      }
      return true;
    }),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const perfil = await UsuarioRepository.actualizarPerfil(req.usuario.id, {
        nombre: req.body.nombre,
        correo: req.body.correo,
        telefono: req.body.telefono,
        foto: req.body.foto
      });
      if (!perfil) return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
      res.json({ ok: true, mensaje: 'Perfil actualizado correctamente', datos: perfil });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_SESION, opcionesCookie());
  res.json({ ok: true, mensaje: 'Sesión cerrada' });
});

module.exports = router;
