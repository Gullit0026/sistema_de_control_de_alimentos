const obtenerAnalisis = require('../../application/use-cases/obtener-analisis.usecase');

async function getAnalisis(req, res, next) {
  try {

    const device = req.query.device;

    const analisis = await obtenerAnalisis(device);

    res.status(200).json({
      ok: true,
      analisis
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { getAnalisis };
