require('dotenv').config();
const app = require('./app');
const { conectarMongoDB, desconectarMongoDB, probarConexionMongo } = require('./config/mongo');
const CatalogoRepository = require('./repositories/catalogoRepository');
const UsuarioRepository = require('./repositories/usuarioRepository');
const Venta = require('./models/Venta');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  try {
    await conectarMongoDB();
    await CatalogoRepository.sembrarCatalogos();
    await UsuarioRepository.asegurarAdministrador();
    console.log('Catálogos MongoDB listos');
  } catch (error) {
    console.error('No se pudo conectar a MongoDB:', error.message);
  }

  if (process.env.AUTO_SEED === 'true' && probarConexionMongo().estado === 'ok') {
    try {
      const totalVentas = await Venta.countDocuments();
      if (totalVentas === 0) {
        const seedScript = require('../scripts/seed_mongo');
        await seedScript(false);
      }
    } catch (seedErr) {
      console.error(seedErr.message);
    }
  }

  const servidor = app.listen(PORT, () => {
    console.log(`Aplicación de carnicería corriendo en http://localhost:${PORT}`);
  });

  const apagarServidor = async () => {
    servidor.close(async () => {
      try {
        await desconectarMongoDB();
        process.exit(0);
      } catch (err) {
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', apagarServidor);
  process.on('SIGINT', apagarServidor);
}

iniciarServidor();
