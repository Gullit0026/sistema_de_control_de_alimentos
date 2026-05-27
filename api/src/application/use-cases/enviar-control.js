const { ErrorValidacion } = require('../../domain/errors/app.error');
const mqtt = require('mqtt');

const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');

async function enviarControl({ device, pwm }) {
  if (pwm === undefined || pwm === null)
    throw new ErrorValidacion('El campo "pwm" es obligatorio');
  if (!device)
    throw new ErrorValidacion('El campo "device" es obligatorio');
  if (pwm < 0 || pwm > 255)
    throw new ErrorValidacion('El valor pwm debe estar entre 0 y 255');

  mqttClient.publish('iot/planta/control', String(pwm));
  console.log(`[MQTT] Publicado → iot/planta/control : ${pwm}`); // 👈
  return { ok: true, pwm, device };
}

module.exports = enviarControl;