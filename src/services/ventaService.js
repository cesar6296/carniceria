const mongoose = require('mongoose');
const CatalogoRepository = require('../repositories/catalogoRepository');
const InventarioLote = require('../models/InventarioLote');
const Venta = require('../models/Venta');
const HistorialRegional = require('../models/HistorialRegional');
const { obtenerUbicacion } = require('./geolocalizacionService');

const VentaService = {
  async generarFolio() {
    const anio = new Date().getFullYear();
    const prefijo = `V-${anio}-`;
    const ultimaVenta = await Venta.findOne({ folio: new RegExp(`^${prefijo}`) }).sort({ folio: -1 });
    let consecutivo = 1;
    if (ultimaVenta && ultimaVenta.folio) {
      const partes = ultimaVenta.folio.split('-');
      if (partes.length === 3) {
        consecutivo = parseInt(partes[2], 10) + 1;
      }
    }
    return `${prefijo}${String(consecutivo).padStart(6, '0')}`;
  },

  async crearVenta(datosVenta) {
    const { cliente_id, sucursal_id, items, metodo_pago } = datosVenta;

    const cliente = await CatalogoRepository.obtenerClientePorId(cliente_id);
    if (!cliente) {
      const error = new Error('El cliente especificado no existe');
      error.statusCode = 404;
      throw error;
    }

    const sucursal = await CatalogoRepository.obtenerSucursalPorId(sucursal_id);
    if (!sucursal || !sucursal.activa) {
      const error = new Error('La sucursal especificada no existe o no está activa');
      error.statusCode = 404;
      throw error;
    }

    if (!items || !items.length) {
      const error = new Error('Debe incluir al menos un corte en la venta');
      error.statusCode = 400;
      throw error;
    }

    const itemsProcesados = [];
    let totalVenta = 0;
    const lotesAfectados = [];

    for (const item of items) {
      const corteId = Number(item.corte_id);
      const kgRequeridos = Number(item.kg);

      if (!kgRequeridos || kgRequeridos <= 0) {
        const error = new Error(`Cantidad de kg inválida para el corte ${corteId}`);
        error.statusCode = 400;
        throw error;
      }

      const corte = await CatalogoRepository.obtenerCortePorId(corteId);
      if (!corte || !corte.activo) {
        const error = new Error(`El corte con ID ${corteId} no existe o no está activo`);
        error.statusCode = 404;
        throw error;
      }

      const precioKg = Number(corte.precio_kg);
      const subtotal = Math.round(kgRequeridos * precioKg * 100) / 100;
      totalVenta += subtotal;

      let lotesDisponibles = await InventarioLote.find({
        sucursal_id: sucursal.id,
        corte_id: corteId,
        kg_disponibles: { $gt: 0 },
        estatus: 'activo'
      }).sort({ fecha_caducidad: 1 });

      let stockTotalDisponible = lotesDisponibles.reduce((acc, l) => acc + l.kg_disponibles, 0);

      if (stockTotalDisponible < kgRequeridos) {
        const fechaCad = new Date();
        fechaCad.setDate(fechaCad.getDate() + 15);
        const nuevoLote = new InventarioLote({
          corte_id: corte.id,
          corte: corte.nombre,
          sucursal_id: sucursal.id,
          proveedor_id: 1,
          kg_iniciales: kgRequeridos + 50,
          kg_disponibles: kgRequeridos + 50,
          costo_kg: Math.round(precioKg * 0.65),
          fecha_caducidad: fechaCad,
          estatus: 'activo'
        });
        await nuevoLote.save();
        lotesDisponibles = [nuevoLote];
        stockTotalDisponible = nuevoLote.kg_disponibles;
      }

      let pendientesPorDescontar = kgRequeridos;
      for (const lote of lotesDisponibles) {
        if (pendientesPorDescontar <= 0) break;

        const aDescontar = Math.min(lote.kg_disponibles, pendientesPorDescontar);
        lotesAfectados.push({
          lote,
          kgDescontados: aDescontar,
          kgAntes: lote.kg_disponibles
        });

        pendientesPorDescontar = Math.round((pendientesPorDescontar - aDescontar) * 100) / 100;
      }

      itemsProcesados.push({
        corte_id: corte.id,
        corte: corte.nombre,
        tipo_carne: corte.tipo_carne,
        kg: kgRequeridos,
        precio_kg: precioKg,
        subtotal
      });
    }

    for (const cambio of lotesAfectados) {
      cambio.lote.kg_disponibles = Math.round((cambio.lote.kg_disponibles - cambio.kgDescontados) * 100) / 100;
      if (cambio.lote.kg_disponibles <= 0) {
        cambio.lote.kg_disponibles = 0;
        cambio.lote.estatus = 'agotado';
      }
      await cambio.lote.save();
    }

    const folio = await this.generarFolio();
    const fechaVenta = new Date();

    const venta = new Venta({
      folio,
      fecha_venta: fechaVenta,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        tipo: cliente.tipo,
        ciudad: cliente.ciudad,
        pais: cliente.pais,
        ubicacion: obtenerUbicacion(cliente)
      },
      sucursal: {
        id: sucursal.id,
        nombre: sucursal.nombre,
        region_id: sucursal.region_id,
        region: sucursal.region_nombre || 'Noroeste'
      },
      items: itemsProcesados,
      pago: {
        metodo: metodo_pago || 'efectivo',
        total: Math.round(totalVenta * 100) / 100
      },
      estatus: 'completada'
    });

    const ventaGuardada = await venta.save();

    const anio = fechaVenta.getFullYear();
    const mes = fechaVenta.getMonth() + 1;

    for (const item of itemsProcesados) {
      await HistorialRegional.updateOne(
        {
          anio,
          mes,
          region_id: sucursal.region_id,
          corte_id: item.corte_id
        },
        {
          $setOnInsert: {
            region: sucursal.region_nombre || 'Noroeste',
            corte: item.corte,
            tipo_carne: item.tipo_carne,
            kg_merma: 0
          },
          $inc: {
            kg_vendidos: item.kg,
            ingresos: item.subtotal,
            num_ventas: 1
          }
        },
        { upsert: true }
      );
    }

    return ventaGuardada;
  },

  async listarVentas(filtros = {}) {
    const query = {};

    if (filtros.sucursal_id) query['sucursal.id'] = Number(filtros.sucursal_id);
    if (filtros.region_id) query['sucursal.region_id'] = Number(filtros.region_id);
    if (filtros.cliente_id) query['cliente.id'] = Number(filtros.cliente_id);
    if (filtros.estatus) query.estatus = filtros.estatus;

    if (filtros.desde || filtros.hasta) {
      query.fecha_venta = {};
      if (filtros.desde) query.fecha_venta.$gte = new Date(filtros.desde);
      if (filtros.hasta) query.fecha_venta.$lte = new Date(filtros.hasta);
    }

    if (filtros.q) {
      query.$or = [
        { folio: new RegExp(filtros.q, 'i') },
        { 'cliente.nombre': new RegExp(filtros.q, 'i') }
      ];
    }

    const pagina = parseInt(filtros.pagina || '1', 10);
    const limite = parseInt(filtros.limite || '20', 10);
    const skip = (pagina - 1) * limite;

    const [total, ventas] = await Promise.all([
      Venta.countDocuments(query),
      Venta.find(query).sort({ fecha_venta: -1 }).skip(skip).limit(limite)
    ]);

    return {
      total,
      pagina,
      paginas: Math.ceil(total / limite),
      ventas
    };
  },

  async obtenerVentaPorId(id) {
    let venta;
    if (mongoose.Types.ObjectId.isValid(id)) {
      venta = await Venta.findById(id);
    } else {
      venta = await Venta.findOne({ folio: id });
    }
    return venta;
  },

  async cancelarVenta(id) {
    const venta = await this.obtenerVentaPorId(id);
    if (!venta) {
      const error = new Error('Venta no encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (venta.estatus === 'cancelada') {
      const error = new Error('La venta ya se encuentra cancelada');
      error.statusCode = 400;
      throw error;
    }

    for (const item of venta.items) {
      let lote = await InventarioLote.findOne({
        sucursal_id: venta.sucursal.id,
        corte_id: item.corte_id
      }).sort({ fecha_caducidad: -1 });

      if (lote) {
        lote.kg_disponibles = Math.round((lote.kg_disponibles + item.kg) * 100) / 100;
        if (lote.estatus === 'agotado') lote.estatus = 'activo';
        await lote.save();
      }

      const anio = venta.fecha_venta.getFullYear();
      const mes = venta.fecha_venta.getMonth() + 1;

      await HistorialRegional.updateOne(
        {
          anio,
          mes,
          region_id: venta.sucursal.region_id,
          corte_id: item.corte_id
        },
        {
          $inc: {
            kg_vendidos: -item.kg,
            ingresos: -item.subtotal,
            num_ventas: -1
          }
        }
      );
    }

    venta.estatus = 'cancelada';
    return await venta.save();
  }
};

module.exports = VentaService;
