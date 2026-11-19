const Venta = require('../models/Venta');
const CatalogoRepository = require('../repositories/catalogoRepository');
const { obtenerUbicacion } = require('./geolocalizacionService');

function inicioDelDia() {
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function mapearVenta(venta) {
  const ubicacionGuardada = venta.cliente?.ubicacion;
  const tieneUbicacionGuardada = ubicacionGuardada?.lat !== null
    && ubicacionGuardada?.lat !== undefined
    && ubicacionGuardada?.lng !== null
    && ubicacionGuardada?.lng !== undefined
    && Number.isFinite(Number(ubicacionGuardada.lat))
    && Number.isFinite(Number(ubicacionGuardada.lng));
  const ubicacion = tieneUbicacionGuardada
    ? ubicacionGuardada
    : obtenerUbicacion(venta.cliente || {});

  return {
    id: String(venta._id),
    folio: venta.folio,
    fecha: venta.fecha_venta,
    estatus: venta.estatus,
    cliente: {
      nombre: venta.cliente?.nombre || 'Cliente',
      ciudad: ubicacion.ciudad || venta.cliente?.ciudad || null,
      pais: ubicacion.pais || venta.cliente?.pais || null,
      ubicacion
    },
    sucursal: venta.sucursal,
    productos: (venta.items || []).map(item => ({
      corte: item.corte,
      kg: item.kg,
      subtotal: item.subtotal
    })),
    total: venta.pago?.total || 0
  };
}

async function obtenerLiveView(filtros = {}) {
  const limite = Math.min(Math.max(Number(filtros.limite) || 40, 1), 100);
  const inicio = inicioDelDia();
  const queryRecientes = {};
  if (filtros.desde) {
    const desde = new Date(filtros.desde);
    if (!Number.isNaN(desde.getTime())) queryRecientes.updatedAt = { $gte: desde };
  }

  const [ventas, resumen, clientes, ultimaVenta, sede] = await Promise.all([
    Venta.find(queryRecientes).sort({ updatedAt: -1, fecha_venta: -1 }).limit(limite).lean(),
    Venta.aggregate([
      { $match: { estatus: 'completada', fecha_venta: { $gte: inicio } } },
      {
        $group: {
          _id: null,
          pedidos: { $sum: 1 },
          ingresos: { $sum: '$pago.total' },
          clientes: { $addToSet: '$cliente.id' },
          paises: { $addToSet: '$cliente.pais' }
        }
      },
      {
        $project: {
          _id: 0,
          pedidos: 1,
          ingresos: { $round: ['$ingresos', 2] },
          clientesActivos: { $size: '$clientes' },
          paises: 1
        }
      }
    ]),
    Venta.distinct('cliente.id', { estatus: 'completada', fecha_venta: { $gte: inicio } }),
    Venta.findOne().sort({ updatedAt: -1, fecha_venta: -1 }).lean(),
    CatalogoRepository.obtenerSucursalPorId(1)
  ]);

  const ventasMapeadas = ventas.map(mapearVenta);
  const datosResumen = resumen[0] || { pedidos: 0, ingresos: 0, clientesActivos: clientes.length };
  const paises = [...new Set((datosResumen.paises || []).filter(Boolean))];
  const ventasConUbicacion = ventasMapeadas.filter(venta => (
    venta.estatus === 'completada'
    && Number.isFinite(venta.cliente.ubicacion?.lat)
    && Number.isFinite(venta.cliente.ubicacion?.lng)
  ));
  const sedeMapeada = sede ? obtenerUbicacion({ ciudad: sede.ciudad, pais: 'México' }) : null;

  return {
    actualizado_en: new Date(),
    sede: sedeMapeada,
    estadisticas: {
      ventasHoy: datosResumen.pedidos || 0,
      pedidosHoy: datosResumen.pedidos || 0,
      ingresosHoy: datosResumen.ingresos || 0,
      clientesActivos: datosResumen.clientesActivos ?? clientes.length,
      paises
    },
    ultimaVenta: ultimaVenta ? mapearVenta(ultimaVenta) : null,
    ventasRecientes: ventasMapeadas,
    puntos: ventasConUbicacion.map(venta => ({
      id: venta.id,
      folio: venta.folio,
      lat: venta.cliente.ubicacion.lat,
      lng: venta.cliente.ubicacion.lng,
      ciudad: venta.cliente.ciudad,
      pais: venta.cliente.pais,
      total: venta.total,
      fecha: venta.fecha
    }))
  };
}

module.exports = { obtenerLiveView };
