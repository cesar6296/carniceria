const express = require('express');
const { body } = require('express-validator');
const VentaService = require('../services/ventaService');
const { validarCampos } = require('../middlewares/errorMiddleware');

const router = express.Router();

// Registrar venta
router.post(
  '/',
  [
    body('cliente_id').isInt({ min: 1 }).withMessage('ID de cliente requerido'),
    body('sucursal_id').isInt({ min: 1 }).withMessage('ID de sucursal requerido'),
    body('items').isArray({ min: 1 }).withMessage('Debe especificar al menos un item'),
    body('items.*.corte_id').isInt({ min: 1 }).withMessage('ID de corte requerido en los items'),
    body('items.*.kg').isFloat({ min: 0.01 }).withMessage('Kilos válidos requeridos en cada item'),
    body('metodo_pago').optional().isIn(['efectivo', 'tarjeta', 'transferencia']).withMessage('Método de pago inválido'),
    validarCampos
  ],
  async (req, res, next) => {
    try {
      const venta = await VentaService.crearVenta(req.body);
      res.status(201).json({ ok: true, mensaje: 'Venta registrada con éxito', datos: venta });
    } catch (error) {
      next(error);
    }
  }
);

// Listar ventas
router.get('/', async (req, res, next) => {
  try {
    const resultado = await VentaService.listarVentas(req.query);
    res.json({ ok: true, datos: resultado });
  } catch (error) {
    next(error);
  }
});

// Detalle de venta
router.get('/:id', async (req, res, next) => {
  try {
    const venta = await VentaService.obtenerVentaPorId(req.params.id);
    if (!venta) return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });
    res.json({ ok: true, datos: venta });
  } catch (error) {
    next(error);
  }
});

// Cancelar venta
router.patch('/:id/cancelar', async (req, res, next) => {
  try {
    const ventaCancelada = await VentaService.cancelarVenta(req.params.id);
    res.json({ ok: true, mensaje: 'Venta cancelada exitosamente y stock reincorporado', datos: ventaCancelada });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

