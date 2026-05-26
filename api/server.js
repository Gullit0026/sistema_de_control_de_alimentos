require('dotenv').config();
const app = require('./src/app');
const { conectar } = require('./src/infrastructure/db/cliente');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  await conectar();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

iniciar().catch((err) => {
  console.error('Error al iniciar el servidor:', err.message);
  process.exit(1);
});
