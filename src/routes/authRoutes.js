const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const CatalogoRepository = require('../repositories/catalogoRepository');
const { validarCampos } = require('../middlewares/errorMiddleware');
const { obtenerJwtSecret } = require('../config/jwt');

const router = express.Router();

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
      const cuenta = await CatalogoRepository.buscarUsuario(usuario);

      if (!cuenta) {
        return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
      }

      const passwordValida = await bcrypt.compare(password, cuenta.password_hash);
      if (!passwordValida) {
        return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
      }

      const token = jwt.sign(
        {
          id: cuenta.id,
          nombre: cuenta.nombre,
          usuario: cuenta.usuario,
          rol: cuenta.rol
        },
        obtenerJwtSecret(),
        { expiresIn: '8h' }
      );

      res.json({
        ok: true,
        mensaje: 'Inicio de sesión exitoso',
        datos: {
          token,
          usuario: {
            id: cuenta.id,
            nombre: cuenta.nombre,
            usuario: cuenta.usuario,
            rol: cuenta.rol
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/perfil', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, mensaje: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decodificado = jwt.verify(token, obtenerJwtSecret());
    res.json({ ok: true, usuario: decodificado });
  } catch (err) {
    if (err.codigo === 'JWT_SECRET_FALTANTE') {
      return res.status(503).json({ ok: false, codigo: err.codigo, mensaje: err.message });
    }
    res.status(401).json({ ok: false, mensaje: 'Token inválido o expirado' });
  }
});

module.exports = router;
