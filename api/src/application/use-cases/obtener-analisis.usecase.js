const datosRepository = require('../../infrastructure/repositories/datos.repository');

/**
 * Caso de uso: calcular estadísticas generales de los datos de sensores.
 *
 * Replica el pipeline $facet del nodo "Pipeline análisis" del flujo
 * Análisis en Node-RED. Node-RED lo usa para su dashboard interno;
 * este caso de uso lo expone también a la página web vía REST.
 *
 * Formatea la respuesta para que sea directamente consumible por el cliente.
 */
async function obtenerAnalisis(device) {
  const raw = await datosRepository.obtenerAnalisis(device);

  const promedioRaw = raw.promedios?.[0] || {};

  return {
    promedios: {
      temperatura: promedioRaw.temperatura != null
        ? parseFloat(promedioRaw.temperatura.toFixed(2))
        : null,

      humedad: promedioRaw.humedad != null
        ? parseFloat(promedioRaw.humedad.toFixed(2))
        : null,

      totalRegistros: promedioRaw.totalRegistros || 0,
    },
    porDispositivo: (raw.porDispositivo || []).map((d) => ({
      device: d._id || 'desconocido',
      avgTemp: d.avgTemp != null ? parseFloat(d.avgTemp.toFixed(2)) : null,
      avgHum: d.avgHum != null ? parseFloat(d.avgHum.toFixed(2)) : null,
      totalRegistros: d.totalRegistros,
    })),
    frecuenciaAlertas: (raw.frecuenciaAlertas || []).map((a) => ({
      alerta: a._id || 'Otro',
      cantidad: a.cantidad,
    })),
    estadosTemp: (raw.estadosTemp || []).map((e) => ({
      estado: e._id || 'desconocido',
      cantidad: e.cantidad,
    })),
  };
}

module.exports = obtenerAnalisis;
