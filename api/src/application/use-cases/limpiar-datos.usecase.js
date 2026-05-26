const datosRepository = require('../../infrastructure/repositories/datos.repository');

/**
 * Caso de uso: eliminar registros con valores inválidos o fuera de rango.
 * Mismos criterios que el nodo "Eliminar inválidos" del flujo Análisis
 * en Node-RED: temperatura null/<-10/>60, humedad null/<0/>100.
 */
async function limpiarDatos() {
  const eliminados = await datosRepository.eliminarInvalidos();
  return { eliminados };
}

module.exports = limpiarDatos;
