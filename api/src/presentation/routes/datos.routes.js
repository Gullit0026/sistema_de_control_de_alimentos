const { Router } = require('express');
const {
  getDatos,
  getAlertas,
  deleteLimpiar,
  getDispositivos,
  getDispositivosActivos,
  getDispositivosInactivos
} = require('../handlers/datos.handler');

const router = Router();

// GET  /api/datos           → últimos 20 registros
// POST /api/datos           → insertar dato nuevo
// GET  /api/datos/alertas   → registros con alertas activas
// DELETE /api/datos/limpiar → eliminar registros inválidos
// GET  /api/dispositivos    → lista de dispositivos únicos

router.get('/', getDatos);
router.get('/dispositivos', getDispositivos);
router.get('/dispositivos/activos', getDispositivosActivos);
router.get('/dispositivos/inactivos', getDispositivosInactivos);
router.get('/alertas', getAlertas);
router.delete('/limpiar', deleteLimpiar);

module.exports = router;
