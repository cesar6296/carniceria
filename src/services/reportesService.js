const Venta = require('../models/Venta');
const Merma = require('../models/Merma');
const HistorialRegional = require('../models/HistorialRegional');

const ReportesService = {
  // 1. Resumen de KPIs generales
  async obtenerResumen(filtros = {}) {
    const matchVentas = { estatus: 'completada' };
    const matchMermas = {};

    if (filtros.desde || filtros.hasta) {
      matchVentas.fecha_venta = {};
      matchMermas.fecha = {};
      if (filtros.desde) {
        matchVentas.fecha_venta.$gte = new Date(filtros.desde);
        matchMermas.fecha.$gte = new Date(filtros.desde);
      }
      if (filtros.hasta) {
        matchVentas.fecha_venta.$lte = new Date(filtros.hasta);
        matchMermas.fecha.$lte = new Date(filtros.hasta);
      }
    }

    if (filtros.sucursal_id) {
      matchVentas['sucursal.id'] = Number(filtros.sucursal_id);
      matchMermas['sucursal.id'] = Number(filtros.sucursal_id);
    }

    // Pipeline agregación ventas: total ingresos, total kg, total transacciones
    const resumenVentas = await Venta.aggregate([
      { $match: matchVentas },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          total_ingresos: { $sum: '$items.subtotal' },
          total_kg_vendidos: { $sum: '$items.kg' },
          num_ventas: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          total_ingresos: { $round: ['$total_ingresos', 2] },
          total_kg_vendidos: { $round: ['$total_kg_vendidos', 2] },
          num_ventas: { $size: '$num_ventas' }
        }
      }
    ]);

    // Pipeline agregación mermas: total kg y costo perdido
    const resumenMermas = await Merma.aggregate([
      { $match: matchMermas },
      {
        $group: {
          _id: null,
          total_kg_merma: { $sum: '$kg' },
          costo_total_perdido: { $sum: '$costo_perdido' },
          num_mermas: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          total_kg_merma: { $round: ['$total_kg_merma', 2] },
          costo_total_perdido: { $round: ['$costo_total_perdido', 2] },
          num_mermas: 1
        }
      }
    ]);

    const datosVentas = resumenVentas[0] || { total_ingresos: 0, total_kg_vendidos: 0, num_ventas: 0 };
    const datosMermas = resumenMermas[0] || { total_kg_merma: 0, costo_total_perdido: 0, num_mermas: 0 };

    // Ganancia estimada (asumiendo margen bruto aproximado del 35% menos mermas)
    const gananciaEstimada = Math.round((datosVentas.total_ingresos * 0.35 - datosMermas.costo_total_perdido) * 100) / 100;

    return {
      ingresos: datosVentas.total_ingresos,
      kg_vendidos: datosVentas.total_kg_vendidos,
      num_ventas: datosVentas.num_ventas,
      kg_merma: datosMermas.total_kg_merma,
      costo_merma: datosMermas.costo_total_perdido,
      ganancia_estimada: gananciaEstimada
    };
  },

  // 2. Ventas e ingresos agrupados por región
  async ventasPorRegion(filtros = {}) {
    const match = { estatus: 'completada' };
    if (filtros.desde || filtros.hasta) {
      match.fecha_venta = {};
      if (filtros.desde) match.fecha_venta.$gte = new Date(filtros.desde);
      if (filtros.hasta) match.fecha_venta.$lte = new Date(filtros.hasta);
    }

    return await Venta.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            region_id: '$sucursal.region_id',
            region: '$sucursal.region'
          },
          ingresos: { $sum: '$items.subtotal' },
          kg_vendidos: { $sum: '$items.kg' },
          transacciones: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          region_id: '$_id.region_id',
          region: '$_id.region',
          ingresos: { $round: ['$ingresos', 2] },
          kg_vendidos: { $round: ['$kg_vendidos', 2] },
          num_ventas: { $size: '$transacciones' }
        }
      },
      { $sort: { ingresos: -1 } }
    ]);
  },

  // 3. Cortes más vendidos
  async cortesMasVendidos(filtros = {}) {
    const match = { estatus: 'completada' };
    if (filtros.region_id) match['sucursal.region_id'] = Number(filtros.region_id);
    if (filtros.desde || filtros.hasta) {
      match.fecha_venta = {};
      if (filtros.desde) match.fecha_venta.$gte = new Date(filtros.desde);
      if (filtros.hasta) match.fecha_venta.$lte = new Date(filtros.hasta);
    }

    const pipeline = [
      { $match: match },
      { $unwind: '$items' }
    ];

    if (filtros.tipo_carne) {
      pipeline.push({ $match: { 'items.tipo_carne': filtros.tipo_carne } });
    }

    const limite = parseInt(filtros.limite || '10', 10);

    pipeline.push(
      {
        $group: {
          _id: {
            corte_id: '$items.corte_id',
            corte: '$items.corte',
            tipo_carne: '$items.tipo_carne'
          },
          kg_totales: { $sum: '$items.kg' },
          ingresos_totales: { $sum: '$items.subtotal' },
          pedidos: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          corte_id: '$_id.corte_id',
          corte: '$_id.corte',
          tipo_carne: '$_id.tipo_carne',
          kg_totales: { $round: ['$kg_totales', 2] },
          ingresos_totales: { $round: ['$ingresos_totales', 2] },
          pedidos: 1
        }
      },
      { $sort: { kg_totales: -1 } },
      { $limit: limite }
    );

    return await Venta.aggregate(pipeline);
  },

  // 4. Matriz de tipo de carne por región
  async tipoCarnePorRegion(filtros = {}) {
    const match = { estatus: 'completada' };
    if (filtros.desde || filtros.hasta) {
      match.fecha_venta = {};
      if (filtros.desde) match.fecha_venta.$gte = new Date(filtros.desde);
      if (filtros.hasta) match.fecha_venta.$lte = new Date(filtros.hasta);
    }

    return await Venta.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            region: '$sucursal.region',
            tipo_carne: '$items.tipo_carne'
          },
          kg_totales: { $sum: '$items.kg' },
          ingresos: { $sum: '$items.subtotal' }
        }
      },
      {
        $project: {
          _id: 0,
          region: '$_id.region',
          tipo_carne: '$_id.tipo_carne',
          kg_totales: { $round: ['$kg_totales', 2] },
          ingresos: { $round: ['$ingresos', 2] }
        }
      },
      { $sort: { region: 1, tipo_carne: 1 } }
    ]);
  },

  // 5. Serie temporal mensual de ingresos y ventas
  async ventasPorMes(filtros = {}) {
    const match = { estatus: 'completada' };
    if (filtros.region_id) match['sucursal.region_id'] = Number(filtros.region_id);
    if (filtros.anio) {
      const anioNum = Number(filtros.anio);
      match.fecha_venta = {
        $gte: new Date(anioNum, 0, 1),
        $lte: new Date(anioNum, 11, 31, 23, 59, 59)
      };
    }

    return await Venta.aggregate([
      { $match: match },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            anio: { $year: '$fecha_venta' },
            mes: { $month: '$fecha_venta' }
          },
          ingresos: { $sum: '$items.subtotal' },
          kg_vendidos: { $sum: '$items.kg' },
          ventas_ids: { $addToSet: '$_id' }
        }
      },
      {
        $project: {
          _id: 0,
          anio: '$_id.anio',
          mes: '$_id.mes',
          ingresos: { $round: ['$ingresos', 2] },
          kg_vendidos: { $round: ['$kg_vendidos', 2] },
          num_ventas: { $size: '$ventas_ids' }
        }
      },
      { $sort: { anio: 1, mes: 1 } }
    ]);
  },

  // 6. Mermas por motivo y por corte
  async mermasPorMotivo(filtros = {}) {
    const match = {};
    if (filtros.sucursal_id) match['sucursal.id'] = Number(filtros.sucursal_id);
    if (filtros.desde || filtros.hasta) {
      match.fecha = {};
      if (filtros.desde) match.fecha.$gte = new Date(filtros.desde);
      if (filtros.hasta) match.fecha.$lte = new Date(filtros.hasta);
    }

    return await Merma.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$motivo',
          kg_perdidos: { $sum: '$kg' },
          costo_perdido: { $sum: '$costo_perdido' },
          cantidad_incidentes: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          motivo: '$_id',
          kg_perdidos: { $round: ['$kg_perdidos', 2] },
          costo_perdido: { $round: ['$costo_perdido', 2] },
          cantidad_incidentes: 1
        }
      },
      { $sort: { costo_perdido: -1 } }
    ]);
  },

  // 7. Consulta directa a la colección historial_regional
  async consultarHistorialRegional(filtros = {}) {
    const match = {};
    if (filtros.anio) match.anio = Number(filtros.anio);
    if (filtros.mes) match.mes = Number(filtros.mes);
    if (filtros.region_id) match.region_id = Number(filtros.region_id);
    if (filtros.corte_id) match.corte_id = Number(filtros.corte_id);
    if (filtros.tipo_carne) match.tipo_carne = filtros.tipo_carne;

    return await HistorialRegional.find(match).sort({ anio: -1, mes: -1, region_id: 1, kg_vendidos: -1 });
  },

  // 8. Top de clientes por monto comprado
  async clientesTop(filtros = {}) {
    const match = { estatus: 'completada' };
    if (filtros.desde || filtros.hasta) {
      match.fecha_venta = {};
      if (filtros.desde) match.fecha_venta.$gte = new Date(filtros.desde);
      if (filtros.hasta) match.fecha_venta.$lte = new Date(filtros.hasta);
    }

    const limite = parseInt(filtros.limite || '10', 10);

    return await Venta.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            id: '$cliente.id',
            nombre: '$cliente.nombre',
            tipo: '$cliente.tipo'
          },
          total_consumo: { $sum: '$pago.total' },
          num_compras: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          cliente_id: '$_id.id',
          nombre: '$_id.nombre',
          tipo: '$_id.tipo',
          total_consumo: { $round: ['$total_consumo', 2] },
          num_compras: 1
        }
      },
      { $sort: { total_consumo: -1 } },
      { $limit: limite }
    ]);
  }
};

module.exports = ReportesService;

