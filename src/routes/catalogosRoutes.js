const express = require('express');
const { body } = require('express-validator');
const CatalogoRepository = require('../repositories/catalogoRepository');
const { validarCampos } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Regiones (solo lectura)
router.get('/regiones', async (req, res, next) => {
  try {
    const regiones = await CatalogoRepository.listarRegiones();
    res.json({ ok: true, datos: regiones });
  } catch (error) {
    next(error);
  }
});

// Sucursales
router.get('/sucursales', async (req, res, next) => {
  try {
    const sucursales = await CatalogoRepository.listarSucursales(req.query);
    res.json({ ok: true, datos: sucursales });
  } catch (error) {
    next(error);
  }
});

router.get('/sucursales/:id', async (req, res, next) => {
  try {
    const sucursal = await CatalogoRepository.obtenerSucursalPorId(req.params.id);
    if (!sucursal) return res.status(404).json({ ok: false, mensaje: 'Sucursal no encontrada' });
    res.json({ ok: true, datos: sucursal });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/sucursales',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre de la sucursal es obligatorio'),
    body('ciudad').trim().notEmpty().withMessage('La ciudad es obligatoria'),
    body('estado').trim().notEmpty().withMessage('El estado es obligatorio'),
    body('region_id').isInt({ min: 1 }).withMessage('La región es requerida y debe ser válida'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const nueva = await CatalogoRepository.crearSucursal(req.body);
      res.status(201).json({ ok: true, mensaje: 'Sucursal creada con éxito', datos: nueva });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/sucursales/:id', async (req, res, next) => {
  try {
    const actualizada = await CatalogoRepository.actualizarSucursal(req.params.id, req.body);
    res.json({ ok: true, mensaje: 'Sucursal actualizada con éxito', datos: actualizada });
  } catch (error) {
    next(error);
  }
});

router.delete('/sucursales/:id', async (req, res, next) => {
  try {
    await CatalogoRepository.eliminarSucursal(req.params.id);
    res.json({ ok: true, mensaje: 'Sucursal desactivada con éxito' });
  } catch (error) {
    next(error);
  }
});

// Clientes
router.get('/clientes', async (req, res, next) => {
  try {
    const clientes = await CatalogoRepository.listarClientes(req.query);
    res.json({ ok: true, datos: clientes });
  } catch (error) {
    next(error);
  }
});

router.get('/clientes/:id', async (req, res, next) => {
  try {
    const cliente = await CatalogoRepository.obtenerClientePorId(req.params.id);
    if (!cliente) return res.status(404).json({ ok: false, mensaje: 'Cliente no encontrado' });
    res.json({ ok: true, datos: cliente });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/clientes',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre del cliente es obligatorio'),
    body('tipo').optional().isIn(['mostrador', 'restaurante', 'mayorista']).withMessage('Tipo de cliente no válido'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const nuevo = await CatalogoRepository.crearCliente(req.body);
      res.status(201).json({ ok: true, mensaje: 'Cliente registrado con éxito', datos: nuevo });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ ok: false, mensaje: 'El correo electrónico ya está registrado' });
      }
      next(error);
    }
  }
);

router.put('/clientes/:id', async (req, res, next) => {
  try {
    const actualizado = await CatalogoRepository.actualizarCliente(req.params.id, req.body);
    res.json({ ok: true, mensaje: 'Cliente actualizado con éxito', datos: actualizado });
  } catch (error) {
    next(error);
  }
});

// Proveedores
router.get('/proveedores', async (req, res, next) => {
  try {
    const proveedores = await CatalogoRepository.listarProveedores(req.query);
    res.json({ ok: true, datos: proveedores });
  } catch (error) {
    next(error);
  }
});

router.get('/proveedores/:id', async (req, res, next) => {
  try {
    const proveedor = await CatalogoRepository.obtenerProveedorPorId(req.params.id);
    if (!proveedor) return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado' });
    res.json({ ok: true, datos: proveedor });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/proveedores',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre del proveedor es obligatorio'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const nuevo = await CatalogoRepository.crearProveedor(req.body);
      res.status(201).json({ ok: true, mensaje: 'Proveedor creado con éxito', datos: nuevo });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/proveedores/:id', async (req, res, next) => {
  try {
    const actualizado = await CatalogoRepository.actualizarProveedor(req.params.id, req.body);
    res.json({ ok: true, mensaje: 'Proveedor actualizado con éxito', datos: actualizado });
  } catch (error) {
    next(error);
  }
});

router.delete('/proveedores/:id', async (req, res, next) => {
  try {
    await CatalogoRepository.eliminarProveedor(req.params.id);
    res.json({ ok: true, mensaje: 'Proveedor desactivado con éxito' });
  } catch (error) {
    next(error);
  }
});

// Cortes
router.get('/cortes', async (req, res, next) => {
  try {
    const cortes = await CatalogoRepository.listarCortes(req.query);
    res.json({ ok: true, datos: cortes });
  } catch (error) {
    next(error);
  }
});

router.get('/cortes/:id', async (req, res, next) => {
  try {
    const corte = await CatalogoRepository.obtenerCortePorId(req.params.id);
    if (!corte) return res.status(404).json({ ok: false, mensaje: 'Corte no encontrado' });
    res.json({ ok: true, datos: corte });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/cortes',
  [
    body('nombre').trim().notEmpty().withMessage('El nombre del corte es obligatorio'),
    body('tipo_carne').isIn(['res', 'cerdo', 'pollo', 'cordero', 'embutido']).withMessage('Tipo de carne no válido'),
    body('precio_kg').isFloat({ min: 0.01 }).withMessage('El precio por kg debe ser mayor a cero'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const nuevo = await CatalogoRepository.crearCorte(req.body);
      res.status(201).json({ ok: true, mensaje: 'Corte registrado con éxito', datos: nuevo });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ ok: false, mensaje: 'Ya existe un corte con ese nombre' });
      }
      next(error);
    }
  }
);

router.put('/cortes/:id', async (req, res, next) => {
  try {
    const actualizado = await CatalogoRepository.actualizarCorte(req.params.id, req.body);
    res.json({ ok: true, mensaje: 'Corte actualizado con éxito', datos: actualizado });
  } catch (error) {
    next(error);
  }
});

router.delete('/cortes/:id', async (req, res, next) => {
  try {
    await CatalogoRepository.eliminarCorte(req.params.id);
    res.json({ ok: true, mensaje: 'Corte desactivado con éxito' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

