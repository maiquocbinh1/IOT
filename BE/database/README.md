# Cơ sở dữ liệu IoT Sensor System

## Tổng quan

Cơ sở dữ liệu được thiết kế để lưu trữ dữ liệu từ các MQTT topics trong hệ thống IoT sensor.

## Cấu trúc bảng

### 1. Bảng `sensor_data`
Lưu trữ dữ liệu cảm biến từ topic `iot/sensor/data`

| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| `id` | INT(10) AUTO_INCREMENT PRIMARY KEY | ID duy nhất của bản ghi |
| `temperature` | DECIMAL(5,2) | Nhiệt độ (độ C) |
| `light` | INT(10) | Cường độ ánh sáng |
| `humidity` | INT(10) | Độ ẩm (%) |
| `time` | TIMESTAMP | Thời gian đo dữ liệu |

**Ví dụ dữ liệu:**
```sql
INSERT INTO sensor_data (temperature, light, humidity, time) 
VALUES (24.5, 400, 60, '2024-10-04 09:15:40');
```

### 2. Bảng `action_history`
Lưu trữ lịch sử điều khiển từ topics `iot/led/control` và `iot/led/status`

| Cột | Kiểu dữ liệu | Mô tả |
|-----|-------------|-------|
| `id` | INT(10) AUTO_INCREMENT PRIMARY KEY | ID duy nhất của bản ghi |
| `device_name` | VARCHAR(50) | Tên thiết bị (VD: "Light Bulb", "Fan", "Air Conditioner") |
| `action` | VARCHAR(20) | Hành động (VD: "on", "off") |
| `timestamp` | TIMESTAMP | Thời gian thực hiện hành động |
| `description` | TEXT | Mô tả chi tiết hành động |

**Ví dụ dữ liệu:**
```sql
INSERT INTO action_history (device_name, action, timestamp, description) 
VALUES ('Light Bulb', 'on', '2024-08-19 10:30:00', 'Light Bulb turned on at living room');
```

## MQTT Topics Mapping

### Topic: `iot/sensor/data`
- **Hướng**: ESP32 → Backend
- **Bảng**: `sensor_data`
- **Format dữ liệu**:
```json
{
  "temperature": 24.5,
  "humidity": 60,
  "light": 400,
  "timestamp": "2024-01-15T08:00:00Z"
}
```

### Topic: `iot/led/control`
- **Hướng**: Backend → ESP32
- **Bảng**: `action_history`
- **Format dữ liệu**:
```json
{
  "action": "on",
  "device_name": "LED",
  "timestamp": "2024-01-15T08:00:00Z",
  "command_id": "cmd_1705312800000"
}
```

### Topic: `iot/led/status`
- **Hướng**: ESP32 → Backend
- **Bảng**: `action_history`
- **Format dữ liệu**:
```json
{
  "device_name": "LED",
  "status": "on",
  "description": "LED turned on successfully",
  "timestamp": "2024-01-15T08:00:00Z",
  "status_id": "status_1705312800000"
}
```

## Indexes

Để tối ưu hiệu suất truy vấn:

```sql
-- Index cho bảng sensor_data
CREATE INDEX idx_sensor_data_time ON sensor_data(time);

-- Index cho bảng action_history
CREATE INDEX idx_action_history_timestamp ON action_history(timestamp);
CREATE INDEX idx_action_history_device ON action_history(device_name);
```

## Cách sử dụng

### 1. Tạo cơ sở dữ liệu
```bash
mysql -u root -p < schema.sql
```

### 2. Truy vấn dữ liệu cảm biến mới nhất
```sql
SELECT * FROM sensor_data ORDER BY time DESC LIMIT 1;
```

### 3. Truy vấn lịch sử điều khiển theo thiết bị
```sql
SELECT * FROM action_history 
WHERE device_name = 'Light Bulb' 
ORDER BY timestamp DESC;
```

### 4. Thống kê dữ liệu cảm biến
```sql
SELECT 
    COUNT(*) as total_readings,
    AVG(temperature) as avg_temperature,
    AVG(humidity) as avg_humidity,
    AVG(light) as avg_light
FROM sensor_data;
```

## Models

### SensorData Model
- `getAll(limit, offset)` - Lấy tất cả dữ liệu cảm biến
- `getById(id)` - Lấy dữ liệu theo ID
- `getLatest(limit)` - Lấy dữ liệu mới nhất
- `getByDateRange(startDate, endDate)` - Lấy dữ liệu theo khoảng thời gian
- `create(temperature, humidity, light, datetime)` - Tạo dữ liệu mới
- `getStatistics(startDate, endDate)` - Lấy thống kê

### ActionHistory Model
- `getAll(limit, offset)` - Lấy tất cả lịch sử
- `getById(id)` - Lấy lịch sử theo ID
- `getByDevice(deviceName, limit, offset)` - Lấy lịch sử theo thiết bị
- `getByAction(action, limit, offset)` - Lấy lịch sử theo hành động
- `create(deviceName, action, description, timestamp)` - Tạo lịch sử mới
- `getStatistics(startDate, endDate)` - Lấy thống kê
