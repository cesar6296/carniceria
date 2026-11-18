const CatalogoRepository = require('../repositories/catalogoRepository');
const InventarioLote = require('../models/InventarioLote');
const Merma = require('../models/Merma');
const HistorialRegional = require('../models/HistorialRegional');

const InventarioService = {
  async registrarLote(datos) {
    const { corte_id, sucursal_id, proveedor_id, kg_iniciales, costo_kg, fecha_caducidad } = datos;

    const corte = await CatalogoRepository.obtenerCortePorId(corte_id);
    if (!corte || !corte.activo) {
      throw new Error('El corte especificado no existe o no está activo');
    }

    const sucursal = await CatalogoRepository.obtenerSucursalPorId(sucursal_id);
    if (!sucursal || !sucursal.activa) {
      throw new Error('La sucursal especificada no existe o no está activa');
    }

    const nuevoLote = new InventarioLote({
      corte_id,
      corte: corte.nombre,
      sucursal_id,
      proveedor_id,
      kg_iniciales,
      kg_disponibles: kg_iniciales,
      costo_kg,
      fecha_caducidad: new Date(fecha_caducidad),
      estatus: 'activo'
    });

    return await nuevoLote.save();
  },

  async obtenerInventarioPorSucursal(sucursal_id) {
    const ahora = new Date();
    const tresDiasDespues = new Date();
    tresDiasDespues.setDate(ahora.getDate() + 3);

    const lotes = await InventarioLote.find({
      sucursal_id: Number(sucursal_id),
      kg_disponibles: { $gt: 0 },
      estatus: 'activo'
    }).sort({ fecha_caducidad: 1 });

    const inventarioPorCorte = {};

    for (const lote of lotes) {
      if (!inventarioPorCorte[lote.corte_id]) {
        inventarioPorCorte[lote.corte_id] = {
          corte_id: lote.corte_id,
          corte: lote.corte,
          total_kg: 0,
          lotes: [],
          alerta_caducidad: false
        };
      }

      const caducaPronto = lote.fecha_caducidad <= tresDiasDespues;
      if (caducaPronto) {
        inventarioPorCorte[lote.corte_id].alerta_caducidad = true;
      }

      inventarioPorCorte[lote.corte_id].total_kg += lote.kg_disponibles;
      inventarioPorCorte[lote.corte_id].lotes.push({
        _id: lote._id,
        kg_disponibles: lote.kg_disponibles,
        costo_kg: lote.costo_kg,
        fecha_caducidad: lote.fecha_caducidad,
        caduca_pronto: caducaPronto
      });
    }

    return Object.values(inventarioPorCorte);
  },

  async registrarMerma(datos) {
    const { lote_id, kg, motivo, notas } = datos;

    const lote = await InventarioLote.findById(lote_id);
    if (!lote) {
      throw new Error('El lote indicado no existe');
    }

    if (kg > lote.kg_disponibles) {
      throw new Error(`Los kilos a mermar (${kg} kg) superan los disponibles en el lote (${lote.kg_disponibles} kg)`);
    }

    const sucursal = await CatalogoRepository.obtenerSucursalPorId(lote.sucursal_id);
    const regionNombre = sucursal ? (sucursal.region_nombre || 'Noroeste') : 'Noroeste';
    const regionId = sucursal ? sucursal.region_id : 1;

    const corte = await CatalogoRepository.obtenerCortePorId(lote.corte_id);
    const tipoCarne = corte ? corte.tipo_carne : 'res';

    const costoPerdido = Math.round((kg * lote.costo_kg) * 100) / 100;

    lote.kg_disponibles = Math.round((lote.kg_disponibles - kg) * 100) / 100;
    if (lote.kg_disponibles <= 0) {
      lote.kg_disponibles = 0;
      lote.estatus = 'agotado';
    }
    await lote.save();

    const fecha = new Date();
    const merma = new Merma({
      fecha,
      sucursal: {
        id: sucursal ? sucursal.id : lote.sucursal_id,
        nombre: sucursal ? sucursal.nombre : 'Sucursal ' + lote.sucursal_id,
        region_id: regionId,
        region: regionNombre
      },
      corte_id: lote.corte_id,
      corte: lote.corte,
      lote_id: lote._id,
      kg,
      motivo,
      costo_perdido: costoPerdido,
      notas: notas || ''
    });
    const mermaGuardada = await merma.save();

    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;

    await HistorialRegional.updateOne(
      {
        anio,
        mes,
        region_id: regionId,
        corte_id: lote.corte_id
      },
      {
        $setOnInsert: {
          region: regionNombre,
          corte: lote.corte,
          tipo_carne: tipoCarne,
          kg_vendidos: 0,
          ingresos: 0,
          num_ventas: 0
        },
        $inc: {
          kg_merma: kg
        }
      },
      { upsert: true }
    );

    return mermaGuardada;
  },

  async listarMermas(filtros = {}) {
    const query = {};
    if (filtros.sucursal_id) {
      query['sucursal.id'] = Number(filtros.sucursal_id);
    }
    if (filtros.corte_id) {
      query.corte_id = Number(filtros.corte_id);
    }
    if (filtros.motivo) {
      query.motivo = filtros.motivo;
    }
    if (filtros.desde || filtros.hasta) {
      query.fecha = {};
      if (filtros.desde) query.fecha.$gte = new Date(filtros.desde);
      if (filtros.hasta) query.fecha.$lte = new Date(filtros.hasta);
    }

    return await Merma.find(query).sort({ fecha: -1 }).limit(filtros.limite ? Number(filtros.limite) : 100);
  }
};

module.exports = InventarioService;
