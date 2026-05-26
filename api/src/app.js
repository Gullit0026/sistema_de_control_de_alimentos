const express = require('express');
const cors = require('cors');
const path = require('path');
const datosRoutes = require('./presentation/routes/datos.routes');
const analisisRoutes = require('./presentation/routes/analisis.routes');
const { manejarError } = require('./presentation/middlewares/error.middleware');

const app = express();

app.use(cors());
app.use(express.json());

// Servir frontend (index.html y demás archivos)
app.use(express.static(path.join(__dirname, '../../frontend')));

// Rutas API
app.use('/api/datos', datosRoutes);
app.use('/api/analisis', analisisRoutes);

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API IoT Planta',
    version: '1.0.0',
    endpoints: [
      'GET  /api/datos',
      'POST /api/datos',
      'GET  /api/datos/alertas',
      'DELETE /api/datos/limpiar',
      'GET  /api/datos/dispositivos',
      'GET  /api/analisis',
    ],
  });
});

// Middleware de errores
app.use(manejarError);

module.exports = app;
