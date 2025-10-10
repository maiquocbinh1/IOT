# IoT Sensor Data Management System - Backend

Hệ thống backend cho quản lý dữ liệu cảm biến IoT với MQTT, WebSocket và MySQL.

## 🚀 Tính năng

- **Database Management**: Quản lý dữ liệu cảm biến, lịch sử hành động
- **MQTT Integration**: Kết nối với MQTT broker để nhận dữ liệu từ ESP32
- **WebSocket**: Giao tiếp real-time với frontend
- **REST API**: API endpoints đầy đủ cho CRUD operations
- **Real-time Updates**: Cập nhật dữ liệu real-time qua WebSocket

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- MySQL >= 8.0
- MQTT Broker (Mosquitto hoặc tương tự)

## 🛠️ Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd BE
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ template:

```bash
cp config/env.example .env
```

Chỉnh sửa file `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=iot_sensor_db
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
MQTT_CLIENT_ID=iot_backend_server

# MQTT Topics
MQTT_SENSOR_DATA_TOPIC=iot/sensor/data
MQTT_LED_CONTROL_TOPIC=iot/led/control
MQTT_LED_STATUS_TOPIC=iot/led/status
```

### 3. Thiết lập Database

Tạo database và import schema:

```bash
# Kết nối MySQL
mysql -u root -p

# Tạo database
CREATE DATABASE iot_sensor_db;

# Import schema
mysql -u root -p iot_sensor_db < database/schema.sql
```

### 4. Cài đặt MQTT Broker (Mosquitto)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl start mosquitto
sudo systemctl enable mosquitto
```

**Windows:**
- Tải và cài đặt từ: https://mosquitto.org/download/
- Hoặc sử dụng Docker: `docker run -it -p 1883:1883 eclipse-mosquitto`

**macOS:**
```bash
brew install mosquitto
brew services start mosquitto
```

### 5. Chạy server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📡 MQTT Topics

Hệ thống sử dụng các topic MQTT chuẩn:

### 1. `iot/sensor/data` - Dữ liệu cảm biến
ESP32 gửi dữ liệu cảm biến:

```json
{
  "sensor_id": 1,
  "temperature": 24.5,
  "humidity": 60,
  "light": 400,
  "timestamp": "2024-01-15T08:00:00Z"
}
```

### 2. `iot/led/control` - Điều khiển LED
Backend gửi lệnh điều khiển:

```json
{
  "action": "on",
  "device_name": "LED",
  "timestamp": "2024-01-15T08:00:00Z"
}
```

### 3. `iot/led/status` - Trạng thái LED
ESP32 gửi trạng thái sau khi thực hiện lệnh:

```json
{
  "device_name": "LED",
  "status": "on",
  "description": "LED turned on",
  "timestamp": "2024-01-15T08:00:00Z"
}
```

## 🔌 API Endpoints

### Sensor Types
- `GET /api/sensor-types` - Lấy danh sách loại cảm biến
- `POST /api/sensor-types` - Tạo loại cảm biến mới
- `PUT /api/sensor-types/:id` - Cập nhật loại cảm biến
- `DELETE /api/sensor-types/:id` - Xóa loại cảm biến

### Locations
- `GET /api/locations` - Lấy danh sách vị trí
- `POST /api/locations` - Tạo vị trí mới
- `PUT /api/locations/:id` - Cập nhật vị trí
- `DELETE /api/locations/:id` - Xóa vị trí

### Sensors
- `GET /api/sensors` - Lấy danh sách cảm biến
- `GET /api/sensors/location/:locationId` - Lấy cảm biến theo vị trí
- `GET /api/sensors/type/:typeId` - Lấy cảm biến theo loại
- `POST /api/sensors` - Tạo cảm biến mới
- `PUT /api/sensors/:id` - Cập nhật cảm biến
- `DELETE /api/sensors/:id` - Xóa cảm biến

### Sensor Data
- `GET /api/sensor-data` - Lấy dữ liệu cảm biến
- `GET /api/sensor-data/latest/all` - Lấy dữ liệu mới nhất
- `GET /api/sensor-data/sensor/:sensorId` - Lấy dữ liệu theo cảm biến
- `GET /api/sensor-data/date-range` - Lấy dữ liệu theo khoảng thời gian
- `POST /api/sensor-data` - Tạo dữ liệu cảm biến mới
- `GET /api/sensor-data/statistics/:sensorId` - Thống kê dữ liệu

### Action History
- `GET /api/action-history` - Lấy lịch sử hành động
- `GET /api/action-history/device/:deviceName` - Lấy lịch sử theo thiết bị
- `GET /api/action-history/latest/all` - Lấy hành động mới nhất
- `POST /api/action-history` - Tạo bản ghi lịch sử mới
- `GET /api/action-history/statistics` - Thống kê hành động

### LED Control
- `POST /api/led/control` - Điều khiển LED

### System
- `GET /health` - Kiểm tra trạng thái hệ thống
- `GET /api/system/status` - Thông tin chi tiết hệ thống

## 🔌 WebSocket Events

### Client → Server
- `join_room` - Tham gia room
- `leave_room` - Rời room
- `ping` - Ping server

### Server → Client
- `connected` - Xác nhận kết nối
- `pong` - Phản hồi ping
- `sensor_data_update` - Cập nhật dữ liệu cảm biến
- `action_history_update` - Cập nhật lịch sử hành động
- `led_status_update` - Cập nhật trạng thái LED
- `system_status` - Trạng thái hệ thống
- `error` - Thông báo lỗi

## 🗄️ Database Schema

### Tables
1. **sensor_type** - Loại cảm biến
2. **Location** - Vị trí lắp đặt
3. **sensors** - Thông tin cảm biến
4. **sensor_data** - Dữ liệu cảm biến (nhiệt độ, độ ẩm, ánh sáng)
5. **action_history** - Lịch sử hành động điều khiển

## 🧪 Testing

### Test MQTT Connection
```bash
# Subscribe to sensor data
mosquitto_sub -h localhost -t "iot/sensor/data"

# Publish test sensor data
mosquitto_pub -h localhost -t "iot/sensor/data" -m '{"sensor_id":1,"temperature":25.5,"humidity":60,"light":400}'

# Subscribe to LED control
mosquitto_sub -h localhost -t "iot/led/control"

# Publish LED control command
mosquitto_pub -h localhost -t "iot/led/control" -m '{"action":"on","device_name":"LED"}'
```

### Test API
```bash
# Health check
curl http://localhost:5000/health

# Get sensor data
curl http://localhost:5000/api/sensor-data

# Control LED
curl -X POST http://localhost:5000/api/led/control \
  -H "Content-Type: application/json" \
  -d '{"action":"on","device_name":"LED"}'
```

## 🐳 Docker Support

Tạo `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

Chạy với Docker Compose:

```yaml
version: '3.8'
services:
  backend:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DB_HOST=mysql
      - MQTT_BROKER_URL=mqtt://mosquitto:1883
    depends_on:
      - mysql
      - mosquitto

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: iot_sensor_db
    volumes:
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  mosquitto:
    image: eclipse-mosquitto
    ports:
      - "1883:1883"
```

## 📝 Logs

Server logs bao gồm:
- Database connection status
- MQTT connection status
- WebSocket connections
- API requests
- Error messages

## 🔧 Troubleshooting

### Database Connection Issues
- Kiểm tra MySQL service đang chạy
- Xác nhận thông tin kết nối trong `.env`
- Kiểm tra firewall/port 3306

### MQTT Connection Issues
- Kiểm tra MQTT broker đang chạy
- Xác nhận URL và port trong `.env`
- Kiểm tra firewall/port 1883

### WebSocket Issues
- Kiểm tra CORS settings
- Xác nhận frontend URL trong config
- Kiểm tra firewall/port 5000

## 📞 Support

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Logs của server
2. Database connection
3. MQTT broker status
4. Network connectivity

## 📄 License

MIT License
