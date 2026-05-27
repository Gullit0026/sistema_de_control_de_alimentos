class DatoSensor {
  constructor({
    device,
    temperatura,
    humedad,
    luz1,
    estado_temp,
    estado_hum,
    estado_luz,
    alertas,
    fecha
  }) {

    this.device = device || 'Desconocido1';
    this.temperatura = temperatura;
    this.humedad = humedad;
    this.luz1 = luz1 ?? 0;

    this.estado_temp = estado_temp;
    this.estado_hum = estado_hum;
    this.estado_luz = estado_luz;

    this.alertas = alertas || [];
    this.fecha = fecha ? new Date(fecha) : new Date();
  }

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