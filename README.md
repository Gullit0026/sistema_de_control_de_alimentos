# sistema_de_control_de_alimentos

# 🍎 Sistema IoT para Monitoreo y Control de Condiciones de Almacenamiento de Alimentos

Sistema IoT orientado al monitoreo, análisis y control de variables ambientales para el almacenamiento y transporte de alimentos, utilizando dispositivos físicos y simulados en tiempo real.

El proyecto integra sensores IoT, comunicación MQTT, procesamiento en Node-RED, almacenamiento en MongoDB y visualización mediante un dashboard web interactivo.

---

## 🚀 Características

- 📡 Monitoreo en tiempo real de:
  - Temperatura
  - Humedad
  - Luminosidad
- 📊 Análisis histórico de datos:
  - Promedios
  - Frecuencia de alertas
  - Estados de temperatura
  - Registros por dispositivo
- 🤖 Soporte para:
  - Dispositivos físicos (ESP8266)
  - Dispositivos simulados
- 🔄 Comunicación en tiempo real mediante MQTT
- 🌐 Dashboard web interactivo:
  - Visualización de gráficas
  - Filtrado por dispositivo
  - Monitoreo individual
  - Análisis estadístico
- 💡 Control remoto de luminosidad PWM para dispositivos IoT
- 🗄️ Persistencia de datos con MongoDB
- ⚡ API REST construida con Express.js
- 🔧 Integración visual mediante Node-RED

---

## 🏗️ Arquitectura del Proyecto

```
ESP8266 / Simuladores
        │
        ▼
  MQTT Broker (broker.emqx.io — público, sin instalación)
        │
        ▼
     Node-RED  ◄──────────────────────────────┐
        │                                      │
        ▼                                      │
   API Express.js  ──── POST /api/control ─────┘
        │
        ▼
     MongoDB Atlas
        │
        ▼
  Dashboard Web (Frontend Vanilla)
```

**Flujo de datos:**
- El ESP8266 publica datos de sensores en el tópico MQTT `iot/planta`
- Node-RED los recibe, los procesa y los guarda en MongoDB vía la API Express
- El dashboard web consulta la API para mostrar datos en tiempo real
- El control PWM viaja del frontend → API Express → MQTT → ESP8266

---

## 📦 Requisitos previos

Asegúrate de tener instalado lo siguiente antes de clonar el proyecto:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|---------|
| Node.js | 18.x o superior | https://nodejs.org |
| npm | 9.x o superior | Incluido con Node.js |
| Node-RED | 3.x o superior | https://nodered.org |
| Arduino IDE | 2.x | https://www.arduino.cc/en/software |
| MongoDB Atlas | — | https://cloud.mongodb.com (cuenta gratuita) |

> El broker MQTT usado es `broker.emqx.io` (público y gratuito), **no requiere instalación ni cuenta**.

---

## 📁 Estructura del Proyecto

```
sistema_de_control_de_alimentos/
├── api/                          # Backend Express.js
│   ├── server.js
│   ├── .env                      # Variables de entorno (debes crearlo)
│   └── src/
│       ├── app.js
│       ├── application/
│       │   └── use-cases/
│       │       ├── registrar-dato.js
│       │       └── enviar-control.js
│       ├── domain/
│       │   ├── entities/
│       │   └── errors/
│       ├── infrastructure/
│       │   ├── db/
│       │   └── repositories/
│       └── presentation/
│           ├── routes/
│           ├── handlers/
│           └── middlewares/
├── frontend/                     # Dashboard web (HTML/CSS/JS vanilla)
│   ├── index.html
│   ├── styles.css
│   └── scripts.js
└── esp8266/                      # Código del microcontrolador
|    └── main.ino
|
|__ JSON del flujo en Node-Red
```

---

## ⚙️ Instalación y configuración paso a paso

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/sistema_de_control_de_alimentos.git
cd sistema_de_control_de_alimentos
```

---

### Paso 2 — Configurar MongoDB Atlas

1. Crea una cuenta gratuita en https://cloud.mongodb.com
2. Crea un nuevo **Cluster** (el tier gratuito M0 es suficiente)
3. En **Database Access**, crea un usuario con permisos de lectura y escritura
4. En **Network Access**, agrega tu IP (o `0.0.0.0/0` para permitir cualquier IP)
5. En tu cluster, haz clic en **Connect → Drivers** y copia la cadena de conexión. Tiene este formato:
   ```
   mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/
   ```

---

### Paso 3 — Configurar la API (Express)

```bash
cd api
npm install
```

Crea el archivo `.env` en la carpeta `api/`:

```env
PORT=3000
MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@cluster0.xxxxx.mongodb.net/IoT
MQTT_BROKER_URL=mqtt://broker.emqx.io:1883
```

> Reemplaza `<usuario>` y `<contraseña>` con los datos de tu usuario de MongoDB Atlas.

Inicia el servidor:

```bash
npm run dev
```

Deberías ver en consola:
```
MongoDB conectado — base de datos: IoT
Servidor corriendo en http://localhost:3000
```

---

### Paso 4 — Configurar Node-RED

1. Instala Node-RED globalmente si no lo tienes:
   ```bash
   npm install -g --unsafe-perm node-red
   ```

2. Inicia Node-RED:
   ```bash
   node-red
   ```

3. Abre el editor en http://localhost:1880

4. Instala las paletas necesarias. Ve al menú → **Manage palette → Install** y busca:
   - `node-red-dashboard` (para el slider y gauges)
   - `node-red-node-mongodb` (para la conexión con MongoDB Atlas)

5. Importa el flujo del proyecto. Ve al menú → **Import** y carga el archivo de flujo JSON incluido en el repositorio (carpeta `nodered/`).

6. Configura los nodos de MongoDB con tu cadena de conexión de Atlas.

7. Verifica que el nodo **MQTT in** escuche el tópico `iot/planta` y el nodo **MQTT out** (Enviar brillo al ESP8266) publique en `iot/planta/control`, ambos apuntando al broker `broker.emqx.io:1883`.

8. Haz clic en **Deploy**.

---

### Paso 5 — Abrir el Dashboard Web

El frontend es servido automáticamente por Express como archivos estáticos. Una vez que la API esté corriendo, abre en tu navegador:

```
http://localhost:3000
```

No se requiere ningún servidor adicional para el frontend.

---

### Paso 6 — Programar el ESP8266

1. Abre Arduino IDE y ve a **File → Preferences**. En "Additional Board Manager URLs" agrega:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```

2. Ve a **Tools → Board → Board Manager**, busca `esp8266` e instálalo.

3. Instala las siguientes librerías desde **Tools → Manage Libraries**:
   - `PubSubClient` (MQTT)
   - `ArduinoJson`
   - `DHT sensor library` (Adafruit)

4. Abre el archivo `esp8266/main.ino`.

5. Edita las credenciales de WiFi:
   ```cpp
   const char* ssid     = "TU_RED_WIFI";
   const char* password = "TU_CONTRASEÑA";
   ```

6. Conecta el ESP8266 por USB, selecciona la placa y el puerto en **Tools**, y carga el sketch.

7. Abre el **Serial Monitor** a 115200 baudios para verificar la conexión:
   ```
   ✅ WiFi conectado. IP: 192.168.x.x
   ✅ Conectado al broker MQTT
   ✅ Publicado en MQTT
   ```

---

### Paso 7 — Conexiones físicas del ESP8266

| Pin ESP8266 | GPIO | Componente |
|-------------|------|------------|
| D6 | GPIO 12 | Sensor DHT11 (data) |
| D7 | GPIO 13 | Sensor de luz LDR |
| D1 | GPIO 5 | LED alerta temperatura |
| D2 | GPIO 4 | LED alerta humedad |
| D3 | GPIO 0 | LED alerta luz |
| D4 | GPIO 2 | LED PWM (luminosidad controlable) |

> El LED conectado a D4 (GPIO 2) es el que responde al control PWM del dashboard.

---

## ▶️ Ejecución completa del sistema

Una vez completados todos los pasos, el orden de arranque es:

```
1. node-red                 → http://localhost:1880
2. cd api && npm run dev    → http://localhost:3000
3. Cargar sketch en ESP8266
4. Abrir http://localhost:3000 en el navegador
```

---

## 🔌 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/datos` | Obtener registros de sensores |
| `GET` | `/api/datos/alertas` | Obtener registros con alertas |
| `GET` | `/api/datos/dispositivos/activos` | Listar dispositivos activos |
| `GET` | `/api/datos/dispositivos/inactivos` | Listar dispositivos inactivos |
| `DELETE` | `/api/datos/limpiar` | Eliminar registros inválidos |
| `GET` | `/api/analisis` | Obtener análisis estadístico |
| `POST` | `/api/control` | Enviar valor PWM al ESP8266 vía MQTT |

**Ejemplo — enviar PWM:**
```bash
curl -X POST http://localhost:3000/api/control \
  -H "Content-Type: application/json" \
  -d '{ "pwm": 128, "device": "ESP8266" }'
```

---

## 🐛 Solución de problemas comunes

**El ESP8266 no aparece en el dashboard**
- Verifica que el ESP8266 y la PC estén en la misma red WiFi o ambos conectados al broker MQTT público.
- Revisa el Serial Monitor para confirmar que publica mensajes.

**Error de conexión a MongoDB**
- Verifica que tu IP esté en la lista blanca de Network Access en Atlas.
- Confirma que el usuario y contraseña en el `.env` sean correctos.

**El LED PWM no responde**
- Confirma que el `.env` tenga `MQTT_BROKER_URL=mqtt://broker.emqx.io:1883`.
- Verifica en el Serial Monitor del ESP8266 que aparece `💡 Brillo recibido:` al enviar desde el dashboard.
- Revisa que el nodo MQTT out en Node-RED y el ESP8266 usen el mismo broker y tópico (`iot/planta/control`).

**Node-RED no guarda datos en MongoDB**
- Verifica que el nodo MongoDB en Node-RED tenga la URI de Atlas correctamente configurada.
- Revisa la pestaña Debug en Node-RED en busca de errores.

---

## 📄 Licencia

MIT
