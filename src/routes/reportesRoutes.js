const express = require('express');
const ReportesService = require('../services/reportesService');

const router = express.Router();

// 1. Resumen ejecutivo de KPIs
router.get('/resumen', async (req, res, next) => {
  try {
    const resumen = await ReportesService.obtenerResumen(req.query);
    res.json({ ok: true, datos: resumen });
  } catch (error) {
    next(error);
  }
});

// 2. Ventas por región
router.get('/ventas-por-region', async (req, res, next) => {
  try {
    const datos = await ReportesService.ventasPorRegion(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

// 3. Cortes más vendidos
router.get('/cortes-mas-vendidos', async (req, res, next) => {
  try {
    const datos = await ReportesService.cortesMasVendidos(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

// 4. Matriz tipo de carne por región
router.get('/tipo-carne-por-region', async (req, res, next) => {
  try {
    const datos = await ReportesService.tipoCarnePorRegion(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

// 5. Ventas mensuales
router.get('/ventas-por-mes', async (req, res, next) => {
  try {
    const datos = await ReportesService.ventasPorMes(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

// 6. Mermas por motivo
router.get('/mermas-por-motivo', async (req, res, next) => {
  try {
    const datos = await ReportesService.mermasPorMotivo(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

// 7. Historial regional precalculado
router.get('/historial-regional', async (req, res, next) => {
  try {
    const datos = await ReportesService.consultarHistorialRegional(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

// 8. Clientes top
router.get('/clientes-top', async (req, res, next) => {
  try {
    const datos = await ReportesService.clientesTop(req.query);
    res.json({ ok: true, datos });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

