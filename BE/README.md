# IoT Sensor Backend API

Backend API cho hệ thống IoT điều khiển đèn và thu thập dữ liệu cảm biến.

## 🚀 Tính năng

- **MQTT Integration**: Kết nối với MQTT broker để nhận dữ liệu cảm biến và gửi lệnh điều khiển
- **WebSocket Support**: Real-time communication với frontend
- **Database Management**: Lưu trữ dữ liệu cảm biến và lịch sử điều khiển
- **RESTful API**: API endpoints cho frontend
- **Swagger Documentation**: Tài liệu API tự động
- **Health Monitoring**: Theo dõi trạng thái kết nối

## 📋 Yêu cầu hệ thống

- Node.js >= 14.0.0
- MySQL >= 5.7
- MQTT Broker (Mosquitto)

## 🛠️ Cài đặt

### 1. Clone repository và cài đặt dependencies

```bash
cd BE
npm install
```

### 2. Cấu hình database

Tạo database và tables:

```bash
# Tạo database từ schema
mysql -u root -p < database/schema.sql

# Hoặc sử dụng npm script
npm run db:init
```

### 3. Cấu hình environment variables

Tạo file `.env` từ `env.example`:

```bash
cp config/env.example .env
```

Chỉnh sửa file `.env` với thông tin của bạn:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=iot_sensor_db
DB_PORT=3306

# MQTT Configuration
MQTT_BROKER_URL=mqtt://your_mqtt_broker:1883
MQTT_USERNAME=your_username
MQTT_PASSWORD=your_password

# Server Configuration
PORT=5000
NODE_ENV=development
```

## 🚀 Chạy ứng dụng

### Development mode (với auto-reload)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

## 📚 API Documentation

Sau khi khởi động server, truy cập Swagger UI tại:
- http://localhost:5000/api-docs

## 🔌 API Endpoints

### Connection Status
- `GET /api/connection-status` - Kiểm tra trạng thái kết nối MQTT và ESP32

### Sensor Data
- `GET /api/sensor-data` - Lấy dữ liệu cảm biến mới nhất
- `GET /api/data` - Lấy danh sách dữ liệu với phân trang và lọc

### Device Control
- `POST /api/control` - Điều khiển thiết bị (đèn)

### Action History
- `GET /api/actions/history` - Lấy lịch sử điều khiển

### Health Check
- `GET /health` - Kiểm tra trạng thái server

## 🔧 Cấu trúc project

```
BE/
├── config/
│   ├── database.js          # Cấu hình database
│   └── env.example          # Template cho environment variables
├── database/
│   └── schema.sql           # Database schema
├── node_modules/            # Dependencies
├── server.js                # Main server file
├── swagger-config.js        # Swagger configuration
├── package.json             # Dependencies và scripts
└── README.md               # Documentation
```

## 🐛 Troubleshooting

### Database connection issues
- Kiểm tra MySQL service đang chạy
- Xác nhận thông tin database trong `.env`
- Kiểm tra firewall và port 3306

### MQTT connection issues
- Kiểm tra MQTT broker đang chạy
- Xác nhận URL và credentials trong `.env`
- Kiểm tra network connectivity

### Port conflicts
- Thay đổi PORT trong `.env` nếu port 5000 bị sử dụng
- Kiểm tra các service khác đang sử dụng port

## 📝 Logs

Server sẽ hiển thị logs chi tiết về:
- Database connection status
- MQTT connection status
- API requests
- Error messages

## 🔄 WebSocket Events

Server gửi các events qua WebSocket:
- `MQTT_STATUS`: Trạng thái kết nối MQTT
- `DATA_STATUS`: Trạng thái kết nối ESP32

## 📊 Database Schema

### sensor_data
- `id`: Primary key
- `temperature`: Nhiệt độ (DECIMAL)
- `humidity`: Độ ẩm (INT)
- `light`: Cường độ ánh sáng (INT)
- `time`: Timestamp

### action_history
- `id`: Primary key
- `device_name`: Tên thiết bị (VARCHAR)
- `action`: Hành động (VARCHAR)
- `timestamp`: Thời gian (TIMESTAMP)
- `description`: Mô tả (TEXT)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

ISC License
