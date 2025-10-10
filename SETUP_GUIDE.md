# Hướng dẫn kết nối Backend với Frontend

## Tổng quan
Hệ thống IoT đã được cập nhật để kết nối Backend (Node.js + Express) với Frontend (React) thông qua:
- REST API calls
- WebSocket real-time communication
- MQTT message handling

## Cấu trúc kết nối

```
Frontend (React) ←→ Backend (Express) ←→ Database (MySQL)
       ↕                    ↕
   WebSocket            MQTT Broker
```

## Bước 1: Cài đặt Backend

### 1.1. Cài đặt dependencies
```bash
cd BE
npm install
```

### 1.2. Cấu hình database
1. Tạo database MySQL:
```sql
CREATE DATABASE iot_sensor_db;
```

2. Chạy script tạo bảng:
```bash
mysql -u root -p iot_sensor_db < database/schema.sql
```

### 1.3. Cấu hình environment
1. Copy file cấu hình:
```bash
cp config/env.example .env
```

2. Cập nhật file `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iot_sensor_db
DB_PORT=3306

# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MQTT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_CLIENT_ID=iot_backend_server
MQTT_USERNAME=
MQTT_PASSWORD=

# MQTT Topics
MQTT_SENSOR_DATA_TOPIC=iot/sensor/data
MQTT_LED_CONTROL_TOPIC=iot/led/control
MQTT_LED_STATUS_TOPIC=iot/led/status
```

### 1.4. Chạy Backend
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend sẽ chạy tại: `http://localhost:5000`

## Bước 2: Cài đặt Frontend

### 2.1. Cài đặt dependencies
```bash
cd FE
npm install
```

### 2.2. Cấu hình environment (tùy chọn)
Tạo file `.env` trong thư mục FE:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 2.3. Chạy Frontend
```bash
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

## Bước 3: Cài đặt MQTT Broker (tùy chọn)

### 3.1. Cài đặt Mosquitto MQTT Broker
```bash
# Windows (với Chocolatey)
choco install mosquitto

# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients

# macOS (với Homebrew)
brew install mosquitto
```

### 3.2. Chạy MQTT Broker
```bash
# Windows
mosquitto -v

# Linux/macOS
sudo systemctl start mosquitto
# hoặc
mosquitto -v
```

## Bước 4: Kiểm tra kết nối

### 4.1. Kiểm tra Backend
Truy cập: `http://localhost:5000/health`

Response mẫu:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T08:00:00.000Z",
  "uptime": 123.45,
  "mqtt": true,
  "websocket": true,
  "connectedClients": 1
}
```

### 4.2. Kiểm tra Frontend
Truy cập: `http://localhost:3000`

Bạn sẽ thấy:
- Dashboard với dữ liệu cảm biến real-time
- Device control với WebSocket connection status
- Charts hiển thị dữ liệu

### 4.3. Kiểm tra WebSocket
Mở Developer Tools → Console, bạn sẽ thấy:
```
✅ WebSocket connected
📊 Received sensor data: {...}
💡 Received LED status: {...}
```

## API Endpoints

### Sensor Data
- `GET /api/sensor-data` - Lấy dữ liệu cảm biến
- `GET /api/sensor-data/latest` - Lấy dữ liệu mới nhất
- `GET /api/sensor-data/statistics` - Thống kê dữ liệu

### Device Control
- `POST /api/led/control` - Điều khiển thiết bị
- `GET /api/action-history` - Lịch sử điều khiển

### System Status
- `GET /api/system/status` - Trạng thái hệ thống
- `GET /health` - Health check

## WebSocket Events

### Client → Server
- `subscribeSensorData` - Đăng ký nhận dữ liệu cảm biến
- `subscribeLEDStatus` - Đăng ký nhận trạng thái LED
- `requestSystemStatus` - Yêu cầu trạng thái hệ thống

### Server → Client
- `sensorData` - Dữ liệu cảm biến mới
- `ledStatus` - Trạng thái LED mới
- `systemStatus` - Cập nhật trạng thái hệ thống
- `connection` - Trạng thái kết nối

## MQTT Topics

### Topics được sử dụng:
- `iot/sensor/data` - Dữ liệu cảm biến từ ESP32
- `iot/led/control` - Lệnh điều khiển LED
- `iot/led/status` - Trạng thái LED từ ESP32

### Test MQTT (tùy chọn):
```bash
# Subscribe sensor data
mosquitto_sub -h localhost -t "iot/sensor/data"

# Publish test sensor data
mosquitto_pub -h localhost -t "iot/sensor/data" -m '{"temperature":25.5,"humidity":60,"light":400}'

# Subscribe LED control
mosquitto_sub -h localhost -t "iot/led/control"

# Publish LED control
mosquitto_pub -h localhost -t "iot/led/control" -m '{"action":"on","device_name":"LED"}'
```

## Troubleshooting

### Lỗi thường gặp:

1. **Backend không kết nối được database**
   - Kiểm tra MySQL đang chạy
   - Kiểm tra thông tin kết nối trong `.env`
   - Kiểm tra database đã được tạo

2. **Frontend không kết nối được Backend**
   - Kiểm tra Backend đang chạy tại port 5000
   - Kiểm tra CORS configuration
   - Kiểm tra network connection

3. **WebSocket không kết nối**
   - Kiểm tra Backend WebSocket server
   - Kiểm tra firewall settings
   - Kiểm tra browser console errors

4. **MQTT không hoạt động**
   - Kiểm tra MQTT broker đang chạy
   - Kiểm tra MQTT configuration
   - Kiểm tra network connectivity

### Logs để debug:
- Backend: Console output khi chạy `npm run dev`
- Frontend: Browser Developer Tools → Console
- MQTT: Mosquitto logs khi chạy với `-v` flag

## Cấu trúc file đã tạo/cập nhật:

### Backend:
- `BE/server.js` - Cập nhật để phù hợp với database mới
- `BE/database/schema.sql` - Cấu trúc database đơn giản
- `BE/models/SensorData.js` - Cập nhật model
- `BE/config/env.example` - Cấu hình môi trường

### Frontend:
- `FE/src/services/api.js` - API service
- `FE/src/services/websocket.js` - WebSocket service
- `FE/src/components/Dashboard/DeviceControl.js` - Cập nhật với API
- `FE/src/components/Dashboard/RealTimeData.js` - Component mới
- `FE/src/components/Dashboard/Dashboard.js` - Cập nhật layout

## Kết quả:
- ✅ Backend và Frontend đã kết nối thành công
- ✅ Real-time data qua WebSocket
- ✅ Device control qua API
- ✅ Responsive UI với loading states
- ✅ Error handling và connection status
