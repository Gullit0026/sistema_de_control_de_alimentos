#include <ESP8266WiFi.h>        // Reemplaza WiFi.h
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <DHT.h>

// --- PINES (ESP8266) ---
#define DHTPIN    12   // D6
#define DHTTYPE   DHT11
#define LUZ1      13   // D7
#define LED_TEMP   5   // D1
#define LED_HUM    4   // D2
#define LED_LUZ    0   // D3
#define LED_PWM    2   // D4 — LED de luminosidad controlable

DHT dht(DHTPIN, DHTTYPE);

// --- WI-FI ---
const char* ssid     = "julian";
const char* password = "julian123";

// --- MQTT ---
const char* mqtt_server = "broker.emqx.io";
const int   mqtt_port   = 1883;
const char* mqtt_topic  = "iot/planta";
const char* device_id   = "ESP32_01";

// --- NTP ---
const char* ntpServer      = "pool.ntp.org";
const long  gmtOffset_sec  = -18000;  // UTC-5 Colombia

WiFiClient   espClient;
PubSubClient mqttClient(espClient);

// -------------------------------------------------------
void conectarWiFi() {
  Serial.print("Conectando a WiFi: ");
  Serial.println(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    yield();          // Alimenta el watchdog
    Serial.print(".");
    intentos++;
    if (intentos > 40) {   // 20 segundos máximo
      Serial.println("\n❌ No se pudo conectar. Reiniciando...");
      ESP.restart();
    }
  }
  Serial.println("\n✅ WiFi conectado. IP: " + WiFi.localIP().toString());
}

// -------------------------------------------------------
void conectarMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Conectando a broker MQTT...");
    String clientId = "ESP8266Client-" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      Serial.println(" ✅ Conectado al broker");
    } else {
      Serial.print(" ❌ Falló, rc=");
      Serial.println(mqttClient.state());
      delay(3000);
    }
  }
  mqttClient.subscribe("iot/planta/control");
}

// -------------------------------------------------------
String obtenerFechaHora() {
  time_t now = time(nullptr);
  struct tm* timeinfo = localtime(&now);
  char buf[25];
  strftime(buf, sizeof(buf), "%d/%m/%Y %H:%M:%S", timeinfo);
  return String(buf);
}

// -------------------------------------------------------
String estadoTemperatura(float t) {
  if (t < 5)       return "Temperatura baja";
  else if (t <= 45) return "Temperatura adecuada";
  else return "Temperatura alta";
}

String estadoHumedad(float h) {
  if (h > 45) return "Humedad alta";
  else        return "Humedad adecuada";
}

String estadoLuz(int l1, int l2) {
  if (l1 == 1) return "Luz adecuada";
  else         return "Luz alta";
}

// -------------------------------------------------------
int generarAlertas(String eTemp, String eHum, String eLuz,
                   JsonArray& alertas) {
  int count = 0;
  if (eTemp != "Temperatura adecuada") {
    alertas.add(eTemp);
    digitalWrite(LED_TEMP, HIGH);
    count++;
  } else { digitalWrite(LED_TEMP, LOW); }

  if (eHum != "Humedad adecuada") {
    alertas.add(eHum);
    digitalWrite(LED_HUM, HIGH);
    count++;
  } else { digitalWrite(LED_HUM, LOW); }

  if (eLuz != "Luz adecuada") {
    alertas.add(eLuz);
    digitalWrite(LED_LUZ, HIGH);
    count++;
  } else { digitalWrite(LED_LUZ, LOW); }

  return count;
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String mensaje = "";
  for (int i = 0; i < length; i++) mensaje += (char)payload[i];

  int brillo = mensaje.toInt();
  brillo = constrain(brillo, 0, 255);
  analogWrite(LED_PWM, brillo);
  Serial.println("💡 Brillo recibido: " + String(brillo));
}

// -------------------------------------------------------
void setup() {
  Serial.begin(115200);
  dht.begin();
  analogWriteRange(255);

  pinMode(LUZ1,     INPUT);
  pinMode(LED_TEMP, OUTPUT);
  pinMode(LED_HUM,  OUTPUT);
  pinMode(LED_LUZ,  OUTPUT);
  pinMode(LED_PWM,  OUTPUT);

  conectarWiFi();

  // NTP para ESP8266
  configTime(gmtOffset_sec, 0, ntpServer);
  Serial.print("Sincronizando hora");
  while (time(nullptr) < 1000000000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" ✅");

  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);
}

// -------------------------------------------------------
void loop() {
  if (!mqttClient.connected()) conectarMQTT();
  mqttClient.loop();

  float temperatura = dht.readTemperature();
  float humedad     = dht.readHumidity();
  int   l1          = digitalRead(LUZ1);

  if (isnan(temperatura) || isnan(humedad)) {
    Serial.println("❌ Error leyendo DHT11");
    delay(2000);
    return;
  }

  String eTemp = estadoTemperatura(temperatura);
  String eHum  = estadoHumedad(humedad);
  String eLuz  = estadoLuz(l1, 0);   // Ajusta según tu lógica de luz

  StaticJsonDocument<512> doc;
  doc["device"]      = device_id;
  doc["fechaHora"]   = obtenerFechaHora();
  doc["temperatura"] = temperatura;
  doc["humedad"]     = humedad;
  doc["luz1"]        = l1;
  doc["estado_temp"] = eTemp;
  doc["estado_hum"]  = eHum;
  doc["estado_luz"]  = eLuz;

  JsonArray alertas = doc.createNestedArray("alertas");
  int numAlertas = generarAlertas(eTemp, eHum, eLuz, alertas);

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  Serial.println("\n========== DATOS ==========");
  Serial.println("Device   : " + String(device_id));
  Serial.println("FechaHora: " + obtenerFechaHora());
  Serial.println("Temp     : " + String(temperatura) + " °C  → " + eTemp);
  Serial.println("Humedad  : " + String(humedad)     + " %   → " + eHum);
  Serial.println("Luz1     : " + String(l1)          + " → " + eLuz);
  Serial.println("Alertas  : " + String(numAlertas));
  Serial.println("------ JSON publicado ------");
  serializeJsonPretty(doc, Serial);
  Serial.println("\n============================");

  bool ok = mqttClient.publish(mqtt_topic, jsonBuffer);
  Serial.println(ok ? "✅ Publicado en MQTT" : "❌ Error publicando");

  delay(5000);
}
