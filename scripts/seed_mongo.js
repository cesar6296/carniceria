require('dotenv').config();
const mongoose = require('mongoose');
const { conectarMongoDB } = require('../src/config/mongo');
const CatalogoRepository = require('../src/repositories/catalogoRepository');

const Venta = require('../src/models/Venta');
const InventarioLote = require('../src/models/InventarioLote');
const Merma = require('../src/models/Merma');
const HistorialRegional = require('../src/models/HistorialRegional');
const LecturaRefrigeracion = require('../src/models/LecturaRefrigeracion');

function obtenerCorteAleatorioParaRegion(regionId, cortes) {
  const r = Math.random();
  let poolCortes = cortes;

  if (regionId === 1 || regionId === 2) {
    if (r < 0.65) poolCortes = cortes.filter(c => c.tipo_carne === 'res');
    else if (r < 0.85) poolCortes = cortes.filter(c => c.tipo_carne === 'cerdo' || c.tipo_carne === 'pollo');
  } else if (regionId === 6 || regionId === 5) {
    if (r < 0.55) poolCortes = cortes.filter(c => c.tipo_carne === 'cerdo' || c.tipo_carne === 'embutido');
    else if (r < 0.80) poolCortes = cortes.filter(c => c.tipo_carne === 'pollo');
  }

  const index = Math.floor(Math.random() * poolCortes.length);
  return poolCortes[index];
}

async function ejecutarSeed(desconectarAlTerminar = true) {
  console.log('Iniciando script de Seed para MongoDB...');
  if (mongoose.connection.readyState !== 1) {
    await conectarMongoDB();
  }

  console.log('Limpiando colecciones anteriores...');
  await Venta.deleteMany({});
  await InventarioLote.deleteMany({});
  await Merma.deleteMany({});
  await HistorialRegional.deleteMany({});
  await LecturaRefrigeracion.deleteMany({});

  const sucursales = await CatalogoRepository.listarSucursales();
  const cortes = await CatalogoRepository.listarCortes();
  const clientes = await CatalogoRepository.listarClientes();

  console.log(`Catálogos cargados: ${sucursales.length} sucursales, ${cortes.length} cortes, ${clientes.length} clientes.`);

  // 1. Generar Lotes de Inventario por sucursal y corte
  const lotesInsertados = [];
  const fechaHoy = new Date();

  for (const sucursal of sucursales) {
    for (const corte of cortes) {
      for (let l = 1; l <= 2; l++) {
        const diasEntrada = Math.floor(Math.random() * 25) + 3;
        const fechaEntrada = new Date(fechaHoy.getTime() - diasEntrada * 24 * 60 * 60 * 1000);

        const diasCaducidad = l === 1 ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * 18) + 8;
        const caducidad = new Date();
        caducidad.setDate(fechaHoy.getDate() + (l === 1 && Math.random() < 0.25 ? 2 : diasCaducidad));

        const kg = Math.floor(Math.random() * 40) + 30;
        const costoKg = Math.round(corte.precio_kg * (0.60 + Math.random() * 0.15));

        const lote = new InventarioLote({
          corte_id: corte.id,
          corte: corte.nombre,
          sucursal_id: sucursal.id,
          proveedor_id: Math.floor(Math.random() * 3) + 1,
          kg_iniciales: kg,
          kg_disponibles: kg,
          costo_kg: costoKg,
          fecha_entrada: fechaEntrada,
          fecha_caducidad: caducidad,
          estatus: 'activo'
        });
        lotesInsertados.push(await lote.save());
      }
    }
  }
  console.log(`${lotesInsertados.length} lotes de inventario creados.`);

  // 2. Generar 1,600 ventas
  console.log('🥩 Generando 1,600 ventas históricas...');
  const ventasAGuardar = [];
  const metodosPago = ['efectivo', 'tarjeta', 'transferencia'];
  const mapaHistorial = {};

  for (let i = 1; i <= 1650; i++) {
    // Distribución escalonada a lo largo de los últimos 365 días (evitando que todo caiga hoy)
    const diasAtras = Math.floor(Math.random() * 360) + 1;
    const horaAleatoria = Math.floor(Math.random() * 12) + 8; // 8 AM a 8 PM
    const minutoAleatorio = Math.floor(Math.random() * 60);
    const fechaVenta = new Date(fechaHoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
    fechaVenta.setHours(horaAleatoria, minutoAleatorio, 0, 0);

    const anio = fechaVenta.getFullYear();
    const mes = fechaVenta.getMonth() + 1;

    const sucursal = sucursales[Math.floor(Math.random() * sucursales.length)];
    const cliente = clientes[Math.floor(Math.random() * clientes.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;

    const itemsVenta = [];
    let totalVenta = 0;

    for (let it = 0; it < numItems; it++) {
      const corte = obtenerCorteAleatorioParaRegion(sucursal.region_id, cortes);
      const kg = Math.round((Math.random() * 3.5 + 0.5) * 10) / 10;
      const subtotal = Math.round(kg * corte.precio_kg * 100) / 100;
      totalVenta += subtotal;

      itemsVenta.push({
        corte_id: corte.id,
        corte: corte.nombre,
        tipo_carne: corte.tipo_carne,
        kg,
        precio_kg: corte.precio_kg,
        subtotal
      });

      const claveHistorial = `${anio}-${mes}-${sucursal.region_id}-${corte.id}`;
      if (!mapaHistorial[claveHistorial]) {
        mapaHistorial[claveHistorial] = {
          anio,
          mes,
          region_id: sucursal.region_id,
          region: sucursal.region_nombre || 'Región ' + sucursal.region_id,
          corte_id: corte.id,
          corte: corte.nombre,
          tipo_carne: corte.tipo_carne,
          kg_vendidos: 0,
          ingresos: 0,
          num_ventas: 0,
          kg_merma: 0
        };
      }
      mapaHistorial[claveHistorial].kg_vendidos += kg;
      mapaHistorial[claveHistorial].ingresos += subtotal;
      mapaHistorial[claveHistorial].num_ventas += 1;
    }

    const folio = `V-${anio}-${String(i).padStart(6, '0')}`;
    ventasAGuardar.push({
      folio,
      fecha_venta: fechaVenta,
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        tipo: cliente.tipo
      },
      sucursal: {
        id: sucursal.id,
        nombre: sucursal.nombre,
        region_id: sucursal.region_id,
        region: sucursal.region_nombre || 'Región ' + sucursal.region_id
      },
      items: itemsVenta,
      pago: {
        metodo: metodosPago[Math.floor(Math.random() * metodosPago.length)],
        total: Math.round(totalVenta * 100) / 100
      },
      estatus: 'completada'
    });
  }

  await Venta.insertMany(ventasAGuardar);
  console.log(`${ventasAGuardar.length} ventas insertadas.`);

  // 3. Mermas
  const motivos = ['caducidad', 'mal_corte', 'descongelado', 'contaminacion'];
  const mermasAGuardar = [];

  for (let m = 0; m < 140; m++) {
    const lote = lotesInsertados[Math.floor(Math.random() * lotesInsertados.length)];
    const sucursal = sucursales.find(s => s.id === lote.sucursal_id) || sucursales[0];
    const corte = cortes.find(c => c.id === lote.corte_id) || cortes[0];

    const kg = Math.round((Math.random() * 2 + 0.5) * 10) / 10;
    const diasAtras = Math.floor(Math.random() * 300);
    const fecha = new Date(fechaHoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
    const motivo = (corte.tipo_carne === 'pollo' || corte.id === 7) ? 'caducidad' : motivos[Math.floor(Math.random() * motivos.length)];
    const costoPerdido = Math.round(kg * lote.costo_kg * 100) / 100;

    mermasAGuardar.push({
      fecha,
      sucursal: {
        id: sucursal.id,
        nombre: sucursal.nombre,
        region_id: sucursal.region_id,
        region: sucursal.region_nombre || 'Región ' + sucursal.region_id
      },
      corte_id: corte.id,
      corte: corte.nombre,
      lote_id: lote._id,
      kg,
      motivo,
      costo_perdido: costoPerdido,
      notas: `Merma de control operativo - ${motivo}`
    });

    const anio = fecha.getFullYear();
    const mes = fecha.getMonth() + 1;
    const claveHistorial = `${anio}-${mes}-${sucursal.region_id}-${corte.id}`;
    if (mapaHistorial[claveHistorial]) {
      mapaHistorial[claveHistorial].kg_merma += kg;
    }
  }

  await Merma.insertMany(mermasAGuardar);
  console.log(`${mermasAGuardar.length} registros de merma insertados.`);

  // 4. Historial Regional
  const docsHistorial = Object.values(mapaHistorial).map(h => ({
    ...h,
    kg_vendidos: Math.round(h.kg_vendidos * 100) / 100,
    ingresos: Math.round(h.ingresos * 100) / 100,
    kg_merma: Math.round(h.kg_merma * 100) / 100
  }));

  await HistorialRegional.insertMany(docsHistorial);
  console.log(`${docsHistorial.length} registros insertados en historial_regional.`);

  // 5. Lecturas de refrigeración
  const lecturas = [];
  for (let cam = 1; cam <= 2; cam++) {
    for (let h = 0; h < 24; h++) {
      const fechaLectura = new Date(fechaHoy.getTime() - h * 60 * 60 * 1000);
      const temp = Math.round((Math.random() * 4.5 + 0.5) * 10) / 10;
      lecturas.push({
        fecha: fechaLectura,
        sucursal_id: 1,
        camara: `Cámara Frigorífica ${cam}`,
        temperatura_c: temp,
        alerta: temp > 4.0 || temp < 0.0
      });
    }
  }
  await LecturaRefrigeracion.insertMany(lecturas);

  console.log('Seed finalizado con éxito.');

  if (desconectarAlTerminar) {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  ejecutarSeed(true).catch(err => {
    console.error('Error durante el seed:', err);
    process.exit(1);
  });
}

module.exports = ejecutarSeed;
