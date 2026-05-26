const datosRepository = require('../../infrastructure/repositories/datos.repository');

/**
 * Caso de uso: obtener registros que tengan alertas activas.
 */
async function obtenerAlertas(limite = 50, dispositivo) {
  const alertas = await datosRepository.obtenerConAlertas(limite, dispositivo);
  return alertas;
}

module.exports = obtenerAlertas;
