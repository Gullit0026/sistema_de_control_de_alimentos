const { Router } = require('express');
const { getAnalisis } = require('../handlers/analisis.handler');

const router = Router();

// GET /api/analisis → estadísticas generales (promedios, alertas, dispositivos)
router.get('/', getAnalisis);

module.exports = router;
