require('dotenv').config();
const app = require('./app');
const { conectarMongoDB, desconectarMongoDB } = require('./config/mongo');
const { pool } = require('./config/mysql');
const Venta = require('./models/Venta');

const PORT = process.env.PORT || 3000;

async function iniciarServidor() {
  await conectarMongoDB();

  try {
    const totalVentas = await Venta.countDocuments();
    if (totalVentas === 0) {
      const seedScript = require('../scripts/seed_mongo');
      await seedScript(false);
    }
  } catch (seedErr) {
    console.error(seedErr.message);
  }

  const servidor = app.listen(PORT, () => {
    console.log(`Aplicación de carnicería corriendo en http://localhost:${PORT}`);
  });

  const apagarServidor = async () => {
    servidor.close(async () => {
      try {
        await desconectarMongoDB();
        await pool.end();
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
