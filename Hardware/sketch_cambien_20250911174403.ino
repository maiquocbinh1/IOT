/*
  ESP32 – Stable IoT Demo (WiFi + MQTT + DHT11 + LDR + 3 LEDs)
  – Không block; mọi thứ theo millis()
  – WiFi/MQTT reconnect có timeout + exponential backoff
  – DHT đọc >= 1500 ms/lần; bỏ qua NaN
  – LDR AO dùng hysteresis; DO có debounce mềm
  – Manual / Auto mode qua MQTT topic
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>

// ====== PINOUT ======
#define DHTPIN   14
#define DHTTYPE  DHT11
#define LDR_DO   18         // Digital out từ module LDR (nếu có)
#define LDR_AO   34         // Analog in (input-only) – OK
#define LED1     33
#define LED2     25
#define LED3     32

// ====== LDR analog threshold & hysteresis (0..4095 trên ESP32) ======
const int LDR_AO_THRESHOLD = 2000;  // tuỳ độ sáng môi trường của bạn mà chỉnh
const int LDR_AO_HYST      = 100;   // biên hysteresis để tránh nhấp nháy

// ====== WiFi & MQTT ======
const char* ssid         = "Justs a phone";
const char* pass         = "123456789";
const char* mqtt_server  = "broker.hivemq.com";
const uint16_t mqtt_port = 1883;
const char* client_id    = "esp32-demo-stable";

// MQTT topics (đổi cho phù hợp)
const char* TOPIC_STATUS     = "esp32/status";
const char* TOPIC_SENSOR     = "esp32/sensor";     // JSON gộp
const char* TOPIC_MODE       = "esp32/mode";       // "manual" or "auto"
const char* TOPIC_LED1_SET   = "esp32/led1/set";   // "0"/"1" (chỉ khi manual)
const char* TOPIC_LED2_SET   = "esp32/led2/set";
const char* TOPIC_LED3_SET   = "esp32/led3/set";
const char* TOPIC_CMD        = "esp32/cmd";        // optional: "restart"...

WiFiClient espClient;
PubSubClient mqtt(espClient);
DHT dht(DHTPIN, DHTTYPE);

// ====== STATE ======
bool manualMode   = false;    // false = auto (theo LDR); true = manual (theo MQTT)
bool ldrDarkState = false;    // kết quả phân loại tối/sáng theo AO + hysteresis
bool led1 = false, led2 = false, led3 = false;

int lastLdrAO = -1;
int lastLdrDO = -1;
float lastT = NAN, lastH = NAN;

// Debounce cho LDR_DO
uint32_t ldrDoLastChangeMs = 0;
int ldrDoStable = -1;

// Backoff reconnect
uint32_t nextMqttRetryMs = 0;
uint32_t mqttBackoffMs   = 1000; // tăng dần tới 30s
const uint32_t MQTT_BACKOFF_MAX = 30000;

// Timers
uint32_t tLastDhtMs      = 0;
uint32_t tLastSensorPub  = 0;
uint32_t tLastStatusPub  = 0;
uint32_t tLastBlinkMs    = 0;

// ====== UTIL ======
void setLEDs(bool a, bool b, bool c) {
  led1 = a; led2 = b; led3 = c;
  digitalWrite(LED1, led1);
  digitalWrite(LED2, led2);
  digitalWrite(LED3, led3);
}

void safeYield() {
  // Nhường CPU một chút để tránh WDT
  delay(1);
}

void publishOnce(const char* topic, const String& payload, bool retain = false) {
  // Hạn chế publish thất bại khi chưa kết nối
  if (!mqtt.connected()) return;
  mqtt.publish(topic, payload.c_str(), retain);
}

// ====== WIFI ======
bool connectWiFi(uint32_t timeoutMs = 15000) {
  if (WiFi.status() == WL_CONNECTED) return true;
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);
  uint32_t t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < timeoutMs) {
    safeYield();
  }
  return WiFi.status() == WL_CONNECTED;
}

// ====== MQTT CALLBACK ======
void mqttCallback(char* topic, byte* payload, unsigned int len) {
  String msg;
  msg.reserve(len);
  for (unsigned int i = 0; i < len; ++i) msg += (char)payload[i];

  if (strcmp(topic, TOPIC_MODE) == 0) {
    manualMode = (msg == "manual" || msg == "MANUAL" || msg == "1" || msg == "true");
    publishOnce(TOPIC_STATUS, String("{\"mode\":\"") + (manualMode ? "manual" : "auto") + "\"}", true);
  }
  else if (strcmp(topic, TOPIC_LED1_SET) == 0 && manualMode) {
    setLEDs(msg == "1" ? true : led1, led2, led3);
  }
  else if (strcmp(topic, TOPIC_LED2_SET) == 0 && manualMode) {
    setLEDs(led1, msg == "1" ? true : false, led3);
  }
  else if (strcmp(topic, TOPIC_LED3_SET) == 0 && manualMode) {
    setLEDs(led1, led2, msg == "1" ? true : false);
  }
  else if (strcmp(topic, TOPIC_CMD) == 0) {
    if (msg == "restart") {
      publishOnce(TOPIC_STATUS, "{\"info\":\"restarting\"}");
      delay(50);
      esp_restart(); // chủ động – nhưng bạn chỉ dùng khi thực sự cần
    }
  }
}

// ====== MQTT CONNECT ======
bool ensureMqttConnected() {
  if (mqtt.connected()) return true;
  if (!connectWiFi()) return false;

  if (millis() < nextMqttRetryMs) return false;

  // Last Will: báo offline nếu mất kết nối
  String will = String("{\"status\":\"offline\"}");
  mqtt.setBufferSize(2048); // nếu bạn gửi JSON dài
  bool ok = mqtt.connect(
    client_id,
    nullptr, nullptr,
    TOPIC_STATUS, 1, true, will.c_str()
  );

  if (ok) {
    // Online
    publishOnce(TOPIC_STATUS, "{\"status\":\"online\"}", true);
    mqtt.subscribe(TOPIC_MODE);
    mqtt.subscribe(TOPIC_LED1_SET);
    mqtt.subscribe(TOPIC_LED2_SET);
    mqtt.subscribe(TOPIC_LED3_SET);
    mqtt.subscribe(TOPIC_CMD);
    mqttBackoffMs = 1000; // reset backoff
  } else {
    // tăng backoff
    mqttBackoffMs = min<uint32_t>(mqttBackoffMs * 2, MQTT_BACKOFF_MAX);
  }
  nextMqttRetryMs = millis() + mqttBackoffMs;
  return ok;
}

// ====== SENSOR READ ======
void readDHTIfDue() {
  const uint32_t DHT_PERIOD = 1500; // ms
  if (millis() - tLastDhtMs < DHT_PERIOD) return;
  tLastDhtMs = millis();

  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (!isnan(h) && !isnan(t)) {
    lastH = h;
    lastT = t;
  }
}

void updateLdrStates() {
  // Analog AO + hysteresis
  int ao = analogRead(LDR_AO); // 0..4095
  if (lastLdrAO < 0) lastLdrAO = ao;

  if (!ldrDarkState && ao < (LDR_AO_THRESHOLD - LDR_AO_HYST)) ldrDarkState = true;
  else if (ldrDarkState && ao > (LDR_AO_THRESHOLD + LDR_AO_HYST)) ldrDarkState = false;

  lastLdrAO = ao;

  // Digital DO + debounce (nếu không dùng DO, có thể bỏ phần này)
  int doVal = digitalRead(LDR_DO); // 0 = tối (tuỳ module), 1 = sáng
  if (doVal != ldrDoStable && millis() - ldrDoLastChangeMs > 50) {
    ldrDoStable = doVal;
    ldrDoLastChangeMs = millis();
  }
}

// ====== CONTROL (AUTO/MANUAL) ======
void applyControl() {
  if (manualMode) {
    // Giữ nguyên các LED theo lệnh /set đã nhận
    return;
  }
  // AUTO: ví dụ – nếu tối thì bật LED1, sáng thì tắt; LED2,3 minh hoạ
  if (ldrDarkState) {
    setLEDs(true, false, false);
  } else {
    setLEDs(false, false, false);
  }
}

// ====== PUBLISH SENSORS ======
void publishSensorsIfDue() {
  const uint32_t SENSOR_PERIOD = 3000; // ms
  if (!mqtt.connected()) return;
  if (millis() - tLastSensorPub < SENSOR_PERIOD) return;
  tLastSensorPub = millis();

  // chỉ publish khi có dữ liệu khả dụng
  String json = "{";
  json += "\"t\":";      json += (isnan(lastT) ? String("null") : String(lastT, 1));
  json += ",\"h\":";     json += (isnan(lastH) ? String("null") : String(lastH, 0));
  json += ",\"ldrAO\":"; json += lastLdrAO;
  if (ldrDoStable >= 0) {
    json += ",\"ldrDO\":"; json += ldrDoStable;
  }
  json += ",\"dark\":";  json += (ldrDarkState ? "true" : "false");
  json += ",\"mode\":\""; json += (manualMode ? "manual" : "auto"); json += "\"";
  json += ",\"led\":";   json += String("[") + (led1?"1":"0") + "," + (led2?"1":"0") + "," + (led3?"1":"0") + "]";
  json += "}";

  publishOnce(TOPIC_SENSOR, json);
}

// ====== BLINK NHẸ TRẠNG THÁI (không dùng LED on-board thì bỏ) ======
void blinkHeartbeat() {
  const uint32_t BLINK_PERIOD = 1000;
  if (millis() - tLastBlinkMs < BLINK_PERIOD) return;
  tLastBlinkMs = millis();
  // Nếu board của bạn có LED on-board trên GPIO2:
  // pinMode(2, OUTPUT) trong setup và đảo trạng thái ở đây
  // digitalWrite(2, !digitalRead(2));
}

// ====== SETUP ======
void setup() {
  pinMode(LED1, OUTPUT);
  pinMode(LED2, OUTPUT);
  pinMode(LED3, OUTPUT);
  pinMode(LDR_DO, INPUT_PULLUP); // nếu module LDR đã có pull-up riêng thì dùng INPUT
  // pinMode(2, OUTPUT); // nếu muốn heartbeat bằng LED on-board

  setLEDs(false, false, false);

  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== ESP32 Stable IoT Start ===");

  dht.begin();

  WiFi.mode(WIFI_STA);
  connectWiFi(10000);

  mqtt.setServer(mqtt_server, mqtt_port);
  mqtt.setCallback(mqttCallback);

  // Thông báo mode ban đầu
  if (ensureMqttConnected()) {
    publishOnce(TOPIC_STATUS, "{\"status\":\"online\"}", true);
    publishOnce(TOPIC_MODE, manualMode ? "manual" : "auto", true);
  }
}

// ====== LOOP ======
void loop() {
  // Duy trì MQTT, nhưng không block
  if (mqtt.connected()) {
    mqtt.loop(); // nhanh, không block lâu
  } else {
    ensureMqttConnected();
  }

  // Cập nhật cảm biến
  readDHTIfDue();
  updateLdrStates();

  // Điều khiển theo mode
  applyControl();

  // Đẩy dữ liệu định kỳ
  publishSensorsIfDue();

  // Nháy tim (tuỳ chọn)
  blinkHeartbeat();

  // In status thưa (mỗi 10s)
  if (millis() - tLastStatusPub > 10000) {
    tLastStatusPub = millis();
    Serial.printf("WiFi:%s RSSI:%d  MQTT:%s  Heap:%u  LDR_AO:%d dark:%d  T:%.1f H:%.0f\n",
                  (WiFi.status()==WL_CONNECTED?"OK":"--"),
                  WiFi.RSSI(),
                  (mqtt.connected()?"OK":"--"),
                  ESP.getFreeHeap(),
                  lastLdrAO, ldrDarkState,
                  (isnan(lastT)?-99:lastT), (isnan(lastH)?-1:lastH));
  }

  safeYield(); // luôn nhường CPU 1ms
}
