#include <WiFi.h>
#include <PubSubClient.h>
#include <EEPROM.h>
#include "DHT.h"

// 1) CẤU HÌNH HỆ THỐNG
#define WIFI_SSID      "Justs a phone"
#define WIFI_PASS      "123456789"

#define MQTT_HOST      "172.20.10.14"
#define MQTT_PORT      1883
#define MQTT_USER      "binh"
#define MQTT_PASS      "123456"

#define TOPIC_SUB_CTRL "iot/led/control"
#define TOPIC_SUB_ALERT "iot/alert"
#define TOPIC_PUB_DATA "iot/sensor/data"
#define TOPIC_LED_STATUS "iot/led/status"   

#define PIN_DHT        14
#define DHT_TYPE       DHT11
#define PIN_LED1       33
#define PIN_LED2       25
#define PIN_LED3       32
#define PIN_ALERT_LED  26
#define PIN_LDR_AO     34

#define SENSOR_INTERVAL_MS  5000UL

// EEPROM addresses for LED states
#define EEPROM_SIZE 512
#define EEPROM_LED1_ADDR 0
#define EEPROM_LED2_ADDR 1
#define EEPROM_LED3_ADDR 2
#define EEPROM_ALERT_ADDR 3

// 2) KHAI BÁO ĐỐI TƯỢNG & BIẾN TOÀN CỤC
DHT dht(PIN_DHT, DHT_TYPE);
WiFiClient   wifiClient;
PubSubClient mqtt(wifiClient);
unsigned long lastSensorTick = 0;//ghi lai thoi gian gui du lieu

// 3) TIỆN ÍCH: LED
inline void setLed(uint8_t pin, bool on){ digitalWrite(pin, on ? HIGH : LOW); }
inline void allLeds(bool on){ setLed(PIN_LED1,on); setLed(PIN_LED2,on); setLed(PIN_LED3,on); }
inline void setAlertLed(bool on){ setLed(PIN_ALERT_LED, on); }

// Save LED state to EEPROM
void saveLedState(){
  EEPROM.write(EEPROM_LED1_ADDR, digitalRead(PIN_LED1) == HIGH ? 1 : 0);
  EEPROM.write(EEPROM_LED2_ADDR, digitalRead(PIN_LED2) == HIGH ? 1 : 0);
  EEPROM.write(EEPROM_LED3_ADDR, digitalRead(PIN_LED3) == HIGH ? 1 : 0);
  EEPROM.write(EEPROM_ALERT_ADDR, digitalRead(PIN_ALERT_LED) == HIGH ? 1 : 0);
  EEPROM.commit();
  Serial.println("[EEPROM] LED state saved");
}

// Restore LED state from EEPROM
void restoreLedState(){
  bool led1 = EEPROM.read(EEPROM_LED1_ADDR) == 1;
  bool led2 = EEPROM.read(EEPROM_LED2_ADDR) == 1;
  bool led3 = EEPROM.read(EEPROM_LED3_ADDR) == 1;
  bool alert = EEPROM.read(EEPROM_ALERT_ADDR) == 1;
  
  setLed(PIN_LED1, led1);
  setLed(PIN_LED2, led2);
  setLed(PIN_LED3, led3);
  setAlertLed(alert);
  
  Serial.print("[EEPROM] LED state restored: LED1=");
  Serial.print(led1); Serial.print(" LED2="); Serial.print(led2);
  Serial.print(" LED3="); Serial.print(led3); Serial.print(" ALERT=");
  Serial.println(alert);
}

// Publish trạng thái LED 
void publishLedStatus(){
  char msg[64];
  snprintf(msg, sizeof(msg),
           "led1:%d,led2:%d,led3:%d,alert:%d",
           digitalRead(PIN_LED1) == HIGH ? 1 : 0,
           digitalRead(PIN_LED2) == HIGH ? 1 : 0,
           digitalRead(PIN_LED3) == HIGH ? 1 : 0,
           digitalRead(PIN_ALERT_LED) == HIGH ? 1 : 0);
  mqtt.publish(TOPIC_LED_STATUS, msg, true); 
  Serial.print("[PUB STATUS] "); Serial.println(msg);
}

// 4) XỬ LÝ LỆNH ĐIỀU KHIỂN
void handleCommand(const String& cmd){
  if      (cmd=="led1on")   setLed(PIN_LED1,true);
  else if (cmd=="led1off")  setLed(PIN_LED1,false);
  else if (cmd=="led2on")   setLed(PIN_LED2,true);
  else if (cmd=="led2off")  setLed(PIN_LED2,false);
  else if (cmd=="led3on")   setLed(PIN_LED3,true);
  else if (cmd=="led3off")  setLed(PIN_LED3,false);
  else if (cmd=="alerton")  setAlertLed(true);
  else if (cmd=="alertoff") setAlertLed(false);
  else if (cmd=="allon")    allLeds(true);
  else if (cmd=="alloff")   allLeds(false);
  else return; 

  saveLedState();        // Save LED state to EEPROM
  publishLedStatus();    // publish trang thai sau khi co lenh 
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
      mqtt.subscribe(TOPIC_SUB_ALERT);
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

  char json[256];
  // Generate random dust (0-1000) and co2 (0-100) for testing
  int dust = random(0, 1001);   // Random 0-1000
  int co2 = random(0, 101);     // Random 0-100
  snprintf(json,sizeof(json), "{\"temperature\":%.2f,\"humidity\":%.2f,\"light\":%d,\"dust\":%d,\"co2\":%d}", t,h,l,dust,co2);
  mqtt.publish(TOPIC_PUB_DATA, json);
  Serial.print("[PUB] "); Serial.println(json);
}

// 8) SETUP & LOOP
void setup(){
  Serial.begin(115200);
  analogReadResolution(10);
  
  // Initialize EEPROM
  EEPROM.begin(EEPROM_SIZE);
  
  pinMode(PIN_LED1,OUTPUT); pinMode(PIN_LED2,OUTPUT); pinMode(PIN_LED3,OUTPUT); pinMode(PIN_ALERT_LED,OUTPUT);
  pinMode(PIN_LDR_AO,INPUT); allLeds(false); setAlertLed(false);
  dht.begin();
  
  // Restore LED state from EEPROM
  delay(500); // Small delay for initialization
  restoreLedState();

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
