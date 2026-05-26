const datosRepository = require('../../infrastructure/repositories/datos.repository');

async function obtenerDatos(limite = 20, dispositivo = null) {
  return datosRepository.obtenerUltimos(limite, dispositivo);
}

async function obtenerDispositivos() {
  return datosRepository.obtenerDispositivos();
}

async function obtenerDispositivosActivos() {
  return datosRepository.obtenerDispositivosActivos();
}

async function obtenerDispositivosInactivos() {
  return datosRepository.obtenerDispositivosInactivos();
}

module.exports = {
  obtenerDatos,
  obtenerDispositivos,
  obtenerDispositivosActivos,
  obtenerDispositivosInactivos
};
