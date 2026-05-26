const DatoSensor = require('../../domain/entities/sensor-dato.entity');
const { ErrorValidacion } = require('../../domain/errors/app.error');
const datosRepository = require('../../infrastructure/repositories/datos.repository');

/**
 * Caso de uso: registrar un nuevo dato de sensor.
 *
 * 1. Valida que los campos mínimos estén presentes.
 * 2. Construye la entidad de dominio (calcula estados y alertas).
 * 3. Persiste el documento resultante.
 *
 * La lógica de estados/alertas es idéntica a la de "function 1"
 * en el flujo Flow 1 de Node-RED — aquí vive en la entidad DatoSensor.
 */
async function registrarDato({ device, temperatura, humedad, luz1 }) {
  if (temperatura === undefined || temperatura === null) {
    throw new ErrorValidacion('El campo "temperatura" es obligatorio');
  }
  if (humedad === undefined || humedad === null) {
    throw new ErrorValidacion('El campo "humedad" es obligatorio');
  }

  const dato = new DatoSensor({ device, temperatura, humedad, luz1 });
  await datosRepository.insertar(dato.aDocumento());

  return dato.aDocumento();
}

module.exports = registrarDato;
