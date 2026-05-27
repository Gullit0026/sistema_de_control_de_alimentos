const express = require('express');
const router = express.Router();
const enviarControl = require('../../application/use-cases/enviar-control');

router.post('/', async (req, res) => {
  try {
    const resultado = await enviarControl(req.body);
    res.json(resultado);
  } catch (e) {
    if (e.name === 'ErrorValidacion') {
      return res.status(400).json({ ok: false, error: e.message });
    }
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;