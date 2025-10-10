#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// 1) CẤU HÌNH HỆ THỐNG
#define WIFI_SSID      "Justs a phone"
#define WIFI_PASS      "123456789"

#define MQTT_HOST      "172.20.10.14"
#define MQTT_PORT      1883
#define MQTT_USER      "binh"
#define MQTT_PASS      "123456"

#define TOPIC_SUB_CTRL "iot/led/control"
#define TOPIC_PUB_DATA "iot/sensor/data"
#define TOPIC_LED_STATUS "iot/led/status"   

#define PIN_DHT        14
#define DHT_TYPE       DHT11
#define PIN_LED1       33
#define PIN_LED2       25
#define PIN_LED3       32
#define PIN_LDR_AO     34

#define SENSOR_INTERVAL_MS  5000UL

// 2) KHAI BÁO ĐỐI TƯỢNG & BIẾN TOÀN CỤC
DHT dht(PIN_DHT, DHT_TYPE);
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);
unsigned long lastSensorTick = 0;//ghi lai thoi gian gui du lieu

// 3) TIỆN ÍCH: LED
inline void setLed(uint8_t pin, bool on){ digitalWrite(pin, on ? HIGH : LOW); }
inline void allLeds(bool on){ setLed(PIN_LED1,on); setLed(PIN_LED2,on); setLed(PIN_LED3,on); }

// Publish trạng thái LED 
void publishLedStatus(){
  char msg[64];
  snprintf(msg, sizeof(msg),
           "led1:%d,led2:%d,led3:%d",
           digitalRead(PIN_LED1) == HIGH ? 1 : 0,
           digitalRead(PIN_LED2) == HIGH ? 1 : 0,
           digitalRead(PIN_LED3) == HIGH ? 1 : 0);
  mqtt.publish(TOPIC_LED_STATUS, msg, true); 
  Serial.print("[PUB STATUS] "); Serial.println(msg);
}

// 4) XỬ LÝ LỆNH ĐIỀU KHIỂN
void handleCommand(const String& cmd){
  if      (cmd=="led1on")  setLed(PIN_LED1,true);
  else if (cmd=="led1off") setLed(PIN_LED1,false);
  else if (cmd=="led2on")  setLed(PIN_LED2,true);
  else if (cmd=="led2off") setLed(PIN_LED2,false);
  else if (cmd=="led3on")  setLed(PIN_LED3,true);
  else if (cmd=="led3off") setLed(PIN_LED3,false);
  else if (cmd=="allon")   allLeds(true);
  else if (cmd=="alloff")  allLeds(false);
  else return; 

  publishLedStatus(); // publish trang thai sau khi co lenh 
}

// 5) Nhận lệnh điều khiển & KẾT NỐI
void mqttCallback(char* topic, byte* payload, unsigned int length){
  String msg; msg.reserve(length);
  for (unsigned i=0;i<length;i++) msg += (char)payload[i];
  msg.trim();
  Serial.print("[SUB] "); Serial.print(topic); Serial.print(" -> "); Serial.println(msg);
  handleCommand(msg);
}

void ensureMqttConnected(){
  while(!mqtt.connected()){
    Serial.print("Dang ket noi MQTT...");
    String cid = "ESP32-"; cid += WiFi.macAddress();
    if (mqtt.connect(cid.c_str(), MQTT_USER, MQTT_PASS)){
      Serial.println("OK");
      mqtt.subscribe(TOPIC_SUB_CTRL);
    } else {
      Serial.print("FAIL rc="); Serial.print(mqtt.state());
      Serial.println(" -> thu lai sau 2s");
      delay(2000);
    }
  }
}

// 6) KẾT NỐI Wi-Fi
void ensureWifiConnected(){
  if (WiFi.status()==WL_CONNECTED) return;
  Serial.print("Dang ket noi WiFi: "); Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status()!=WL_CONNECTED){ delay(400); Serial.print("."); }
  Serial.println(); Serial.print("WiFi OK, IP="); Serial.println(WiFi.localIP());
}

// 7) ĐỌC & PUBLISH DỮ LIỆU CẢM BIẾN
void readAndPublishSensors(){
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  int   l = analogRead(PIN_LDR_AO);
  if (isnan(h) || isnan(t)){ Serial.println("WARN: Loi doc DHT11!"); return; }

  char json[128];
  snprintf(json,sizeof(json), "{\"temperature\":%.2f,\"humidity\":%.2f,\"light\":%d}", t,h,l);
  mqtt.publish(TOPIC_PUB_DATA, json);
  Serial.print("[PUB] "); Serial.println(json);
}

// 8) SETUP & LOOP
void setup(){
  Serial.begin(115200);
  analogReadResolution(10);
  pinMode(PIN_LED1,OUTPUT); pinMode(PIN_LED2,OUTPUT); pinMode(PIN_LED3,OUTPUT);
  pinMode(PIN_LDR_AO,INPUT); allLeds(false);
  dht.begin();

  ensureWifiConnected();
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(mqttCallback);
}

void loop(){
  ensureWifiConnected();
  if (!mqtt.connected()) ensureMqttConnected();
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastSensorTick >= SENSOR_INTERVAL_MS){
    lastSensorTick = now;
    readAndPublishSensors();
  }
}
