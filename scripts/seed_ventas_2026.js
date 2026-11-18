require('dotenv').config();
const mongoose = require('mongoose');
const { conectarMongoDB } = require('../src/config/mongo');
const CatalogoRepository = require('../src/repositories/catalogoRepository');
const Venta = require('../src/models/Venta');
const HistorialRegional = require('../src/models/HistorialRegional');

const ANIO = 2026;
const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;
const VENTAS_POR_DIA = 3;

function crearAleatorio(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
    return estado / 0x100000000;
  };
}

function elegir(lista, aleatorio) {
  return lista[Math.floor(aleatorio() * lista.length)];
}

function generarVentas(sucursales, cortes, clientes, ahora = new Date()) {
  if (!sucursales.length || !cortes.length || !clientes.length) {
    throw new Error('Se requieren sucursales, cortes y clientes para generar las ventas.');
  }

  const aleatorio = crearAleatorio(ANIO);
  const inicioAnio = Date.UTC(ANIO, 0, 1);
  const fechaLimite = ahora.getUTCFullYear() === ANIO
    ? Date.UTC(ANIO, ahora.getUTCMonth(), ahora.getUTCDate())
    : Date.UTC(ANIO, 11, 31);
  const dias = Math.floor((fechaLimite - inicioAnio) / MILISEGUNDOS_POR_DIA) + 1;
  const metodosPago = ['efectivo', 'tarjeta', 'transferencia'];
  const ventas = [];
  let numeroFolio = 0;

  for (let dia = 0; dia < dias; dia++) {
    for (let ventaDelDia = 0; ventaDelDia < VENTAS_POR_DIA; ventaDelDia++) {
      numeroFolio++;
      const sucursal = elegir(sucursales, aleatorio);
      const cliente = elegir(clientes, aleatorio);
      const hora = 8 + Math.floor(aleatorio() * 12);
      const minuto = Math.floor(aleatorio() * 60);
      const fechaCandidata = new Date(inicioAnio + dia * MILISEGUNDOS_POR_DIA + hora * 3600000 + minuto * 60000);
      const fechaVenta = fechaCandidata > ahora
        ? new Date(ahora.getTime() - Math.floor(aleatorio() * 60000))
        : fechaCandidata;
      const anio = fechaVenta.getUTCFullYear();
      const mes = fechaVenta.getUTCMonth() + 1;
      const numItems = 1 + Math.floor(aleatorio() * 3);
      const items = [];
      let total = 0;

      for (let indice = 0; indice < numItems; indice++) {
        const corte = elegir(cortes, aleatorio);
        const kg = Math.round((0.5 + aleatorio() * 3.5) * 10) / 10;
        const subtotal = Math.round(kg * corte.precio_kg * 100) / 100;
        items.push({
          corte_id: corte.id,
          corte: corte.nombre,
          tipo_carne: corte.tipo_carne,
          kg,
          precio_kg: corte.precio_kg,
          subtotal
        });
        total += subtotal;
      }

      ventas.push({
        folio: `SIM-${ANIO}-${String(numeroFolio).padStart(6, '0')}`,
        fecha_venta: fechaVenta,
        cliente: { id: cliente.id, nombre: cliente.nombre, tipo: cliente.tipo },
        sucursal: {
          id: sucursal.id,
          nombre: sucursal.nombre,
          region_id: sucursal.region_id,
          region: sucursal.region_nombre || `Región ${sucursal.region_id}`
        },
        items,
        pago: {
          metodo: elegir(metodosPago, aleatorio),
          total: Math.round(total * 100) / 100
        },
        estatus: 'completada'
      });
    }
  }

  return { ventas, dias };
}

async function ejecutarSeed() {
  const [sucursales, cortes, clientes] = await Promise.all([
    CatalogoRepository.listarSucursales(),
    CatalogoRepository.listarCortes(),
    CatalogoRepository.listarClientes()
  ]);
  const datos = generarVentas(sucursales, cortes, clientes);
  const meses = [...new Set(datos.ventas.map(venta => venta.fecha_venta.getUTCMonth() + 1))];

  console.log(`Se prepararon ${datos.ventas.length} ventas ficticias para ${ANIO}, cubriendo ${meses.length} meses.`);
  if (process.argv.includes('--dry-run')) {
    console.log('Dry run: no se conectó ni se escribieron datos en MongoDB.');
    return;
  }
  if (!process.env.MONGODB_URI) {
    throw new Error('Configura MONGODB_URI para guardar los datos en una base MongoDB persistente.');
  }

  await conectarMongoDB();
  const folios = datos.ventas.map(venta => venta.folio);
  const existentes = await Venta.find({ folio: { $in: folios } }).distinct('folio');
  const foliosExistentes = new Set(existentes);
  const ventasNuevas = datos.ventas.filter(venta => !foliosExistentes.has(venta.folio));

  if (!ventasNuevas.length) {
    console.log('Estas ventas ya estaban cargadas; no se agregaron duplicados.');
    return;
  }

  const nuevasPorMes = new Map();
  for (const venta of ventasNuevas) {
    const anio = venta.fecha_venta.getUTCFullYear();
    const mes = venta.fecha_venta.getUTCMonth() + 1;
    for (const item of venta.items) {
      const clave = `${anio}-${mes}-${venta.sucursal.region_id}-${item.corte_id}`;
      if (!nuevasPorMes.has(clave)) {
        nuevasPorMes.set(clave, {
          anio,
          mes,
          region_id: venta.sucursal.region_id,
          region: venta.sucursal.region,
          corte_id: item.corte_id,
          corte: item.corte,
          tipo_carne: item.tipo_carne,
          kg_vendidos: 0,
          ingresos: 0,
          num_ventas: 0
        });
      }
      const resumen = nuevasPorMes.get(clave);
      resumen.kg_vendidos += item.kg;
      resumen.ingresos += item.subtotal;
      resumen.num_ventas++;
    }
  }

  const operacionesHistorial = [...nuevasPorMes.values()].map(resumen => ({
    updateOne: {
      filter: {
        anio: resumen.anio,
        mes: resumen.mes,
        region_id: resumen.region_id,
        corte_id: resumen.corte_id
      },
      update: {
        $setOnInsert: {
          region: resumen.region,
          corte: resumen.corte,
          tipo_carne: resumen.tipo_carne,
          kg_merma: 0
        },
        $inc: {
          kg_vendidos: Math.round(resumen.kg_vendidos * 100) / 100,
          ingresos: Math.round(resumen.ingresos * 100) / 100,
          num_ventas: resumen.num_ventas
        }
      },
      upsert: true
    }
  }));

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Venta.insertMany(ventasNuevas, { session });
      await HistorialRegional.bulkWrite(operacionesHistorial, { session });
    });
  } finally {
    await session.endSession();
    await mongoose.disconnect();
  }

  console.log(`${ventasNuevas.length} ventas agregadas y ${operacionesHistorial.length} resúmenes mensuales actualizados.`);
}

if (require.main === module) {
  ejecutarSeed().catch(error => {
    console.error('Error al cargar las ventas ficticias:', error.message);
    process.exit(1);
  });
}

module.exports = { generarVentas };