const { obtenerDatos, obtenerDispositivos, obtenerDispositivosActivos, obtenerDispositivosInactivos } = require('../../application/use-cases/obtener-datos.usecase');
const registrarDato = require('../../application/use-cases/registrar-dato.usecase');
const obtenerAlertas = require('../../application/use-cases/obtener-alertas.usecase');
const limpiarDatos = require('../../application/use-cases/limpiar-datos.usecase');

async function getDatos(req, res, next) {
  try {
    const limite = parseInt(req.query.limite) || 20;
    const dispositivo = req.query.device || null;
    const datos = await obtenerDatos(limite, dispositivo);
    res.status(200).json({ ok: true, total: datos.length, datos });
  } catch (err) {
    next(err);
  }
}

async function getDispositivos(req, res, next) {
  try {
    const dispositivos = await obtenerDispositivos();
    res.status(200).json({ ok: true, dispositivos });
  } catch (err) {
    next(err);
  }
}

async function postDato(req, res, next) {
  try {
    const dato = await registrarDato(req.body);
    res.status(201).json({ ok: true, mensaje: 'Dato registrado', dato });
  } catch (err) {
    next(err);
  }
}

async function getAlertas(req, res, next) {
  try {

    const limite = parseInt(req.query.limite) || 50;

    const dispositivo = req.query.device || null;

    const alertas = await obtenerAlertas(limite, dispositivo);

    res.status(200).json({
      ok: true,
      total: alertas.length,
      alertas
    });

  } catch (err) {
    next(err);
  }
}

async function deleteLimpiar(req, res, next) {
  try {
    const resultado = await limpiarDatos();
    res.status(200).json({ ok: true, ...resultado });
  } catch (err) {
    next(err);
  }
}

async function getDispositivosActivos(req, res, next) {
  try {
    const dispositivos = await obtenerDispositivosActivos();
    res.status(200).json({ ok: true, dispositivos });
  } catch (err) {
    next(err);
  }
}

async function getDispositivosInactivos(req, res, next) {
  try {
    const dispositivos = await obtenerDispositivosInactivos();
    res.status(200).json({ ok: true, dispositivos });
  } catch (err) {
    next(err);
  }
}

module.exports = { getDatos, getDispositivos, getDispositivosActivos, getDispositivosInactivos, postDato, getAlertas, deleteLimpiar };

