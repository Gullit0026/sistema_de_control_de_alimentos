/**
 * Entidad de dominio: DatoSensor
 *
 * Contiene las reglas de negocio puras del sistema —
 * exactamente las mismas que tiene "function 1" en el flujo
 * Flow 1 de Node-RED, pero aisladas de Express y de MongoDB.
 *
 * Rangos definidos por el proyecto:
 *   Temperatura: baja < 18 | adecuada 18-30 | alta > 30
 *   Humedad:     baja < 30 | adecuada 30-70 | alta > 70
 *   Luz:         poca = 0  | adecuada = 1
 */
class DatoSensor {
  constructor({ device, temperatura, humedad, luz1 }) {
    this.device = device || 'ESP8266';
    this.temperatura = temperatura;
    this.humedad = humedad;
    this.luz1 = luz1 ?? 0;
    this.fecha = new Date();

    // Estados calculados
    this.estado_temp = DatoSensor.calcularEstadoTemp(temperatura);
    this.estado_hum = DatoSensor.calcularEstadoHum(humedad);
    this.estado_luz = DatoSensor.calcularEstadoLuz(luz1);

    // Alertas derivadas de los estados
    this.alertas = DatoSensor.generarAlertas(
      this.estado_temp,
      this.estado_hum,
      this.estado_luz
    );
  }

  static calcularEstadoTemp(temp) {
    if (temp < 18) return 'baja';
    if (temp <= 30) return 'adecuada';
    return 'alta';
  }

  static calcularEstadoHum(hum) {
    if (hum < 30) return 'baja';
    if (hum <= 70) return 'adecuada';
    return 'alta';
  }

  static calcularEstadoLuz(luz) {
    return luz == 0 ? 'poca' : 'adecuada';
  }

  static generarAlertas(estado_temp, estado_hum, estado_luz) {
    const alertas = [];
    if (estado_temp !== 'adecuada') alertas.push(`Temperatura ${estado_temp}`);
    if (estado_hum !== 'adecuada') alertas.push(`Humedad ${estado_hum}`);
    if (estado_luz !== 'adecuada') alertas.push('Poca luz');
    return alertas;
  }

  // Devuelve el objeto plano listo para persistir en MongoDB
  aDocumento() {
    return {
      device: this.device,
      temperatura: this.temperatura,
      humedad: this.humedad,
      luz1: this.luz1,
      estado_temp: this.estado_temp,
      estado_hum: this.estado_hum,
      estado_luz: this.estado_luz,
      alertas: this.alertas,
      fecha: this.fecha,
    };
  }
}

module.exports = DatoSensor;
