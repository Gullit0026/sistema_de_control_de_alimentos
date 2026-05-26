const { obtenerDb } = require('../db/cliente');

// Colección con la que trabajamos — la misma que usa Node-RED
const COLECCION = 'datos';

function col() {
  return obtenerDb().collection(COLECCION);
}

/**
 * Inserta un documento de sensor ya procesado.
 */
async function insertar(documento) {
  const resultado = await col().insertOne(documento);
  return resultado;
}

/**
 * Devuelve los últimos N registros ordenados por fecha descendente.
 * Si se pasa un dispositivo, filtra por ese device.
 */
async function obtenerUltimos(limite = 20, dispositivo = null) {
  const matchStage = dispositivo ? { $match: { device: dispositivo } } : null;
  const pipeline = [];

  if (matchStage) pipeline.push(matchStage);

  pipeline.push({ $sort: { fecha: -1 } });
  pipeline.push({ $limit: limite });
  pipeline.push({ $project: { _id: 0 } });

  return col().aggregate(pipeline).toArray();
}

/**
 * Devuelve registros que tengan al menos una alerta.
 */
async function obtenerConAlertas(limite = 50, dispositivo) {
  const matchStage = dispositivo
    ? { $match: { 'alertas.0': { $exists: true }, device: dispositivo } }
    : { $match: { 'alertas.0': { $exists: true } } };

  return col()
    .aggregate([
      matchStage,
      { $sort: { fecha: -1 } },
      { $limit: limite },
      { $project: { _id: 0 } },
    ])
    .toArray();
}

/**
 * Elimina documentos con valores fuera de rango o nulos.
 */
async function eliminarInvalidos() {
  const resultado = await col().deleteMany({
    $or: [
      { temperatura: null },
      { temperatura: { $lt: -10 } },
      { temperatura: { $gt: 60 } },
      { humedad: null },
      { humedad: { $lt: 0 } },
      { humedad: { $gt: 100 } },
    ],
  });
  return resultado.deletedCount;
}

/**
 * Pipeline de análisis estadístico.
 * Si se pasa un dispositivo, filtra por ese device.
 */
async function obtenerAnalisis(dispositivo) {
  const matchStage = dispositivo ? { $match: { device: dispositivo } } : { $match: {} };

  const resultado = await col()
    .aggregate([
      matchStage,
      {
        $facet: {
          promedios: [
            {
              $group: {
                _id: null,
                temperatura: { $avg: '$temperatura' },
                humedad: { $avg: '$humedad' },
                totalRegistros: { $sum: 1 },
              },
            },
          ],
          porDispositivo: [
            {
              $group: {
                _id: '$device',
                avgTemp: { $avg: '$temperatura' },
                avgHum: { $avg: '$humedad' },
                totalRegistros: { $sum: 1 },
              },
            },
          ],
          frecuenciaAlertas: [
            { $unwind: { path: '$alertas', preserveNullAndEmptyArrays: false } },
            { $group: { _id: '$alertas', cantidad: { $sum: 1 } } },
            { $sort: { cantidad: -1 } },
          ],
          estadosTemp: [
            { $group: { _id: '$estado_temp', cantidad: { $sum: 1 } } },
          ],
        },
      },
    ])
    .toArray();

  return resultado[0] || {};
}

/**
 * Devuelve todos los dispositivos únicos.
 */
async function obtenerDispositivos() {
  return col().distinct('device');
}

/**
 * Devuelve dispositivos que hayan enviado datos en los últimos 30 segundos.
 */
async function obtenerDispositivosActivos() {
  const hace30s = new Date(Date.now() - 30 * 1000);
  return col().distinct('device', { fecha: { $gte: hace30s } });
}

/**
 * Devuelve dispositivos que NO hayan enviado datos en los últimos 30 segundos.
 */
async function obtenerDispositivosInactivos() {
  const hace30s = new Date(Date.now() - 30 * 1000);
  const activos = await obtenerDispositivosActivos();
  const todos = await obtenerDispositivos();
  return todos.filter(d => !activos.includes(d));
}

module.exports = {
  insertar,
  obtenerUltimos,
  obtenerConAlertas,
  eliminarInvalidos,
  obtenerAnalisis,
  obtenerDispositivos,
  obtenerDispositivosActivos,
  obtenerDispositivosInactivos
};
