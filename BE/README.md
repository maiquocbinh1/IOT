# IoT Sensor Backend - Đơn Giản

Backend API đơn giản cho hệ thống IoT với chỉ 4 API chính cần thiết.

## Tính năng

- **API đơn giản**: Chỉ 4 endpoints cần thiết cho frontend
- **Database**: Kết nối MySQL để lưu trữ dữ liệu
- **Dễ sử dụng**: Code ngắn gọn, có chú thích tiếng Việt
- **Nhanh chóng**: Không có MQTT, WebSocket phức tạp

## Yêu cầu hệ thống

- Node.js >= 16.0.0
- MySQL >= 8.0

## Cài đặt

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

### 4. Chạy server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### 1. **GET /api/sensor-data** - API lấy dữ liệu cảm biến mới nhất
```javascript
// Request
GET http://localhost:5000/api/sensor-data

// Response
{
  "temperature": 25.5,
  "humidity": 60,
  "light": 300
}
```

### 2. **POST /api/control** - API điều khiển đèn và lưu lịch sử
```javascript
// Request
POST http://localhost:5000/api/control
Content-Type: application/json

{
  "deviceName": "LED1",
  "action": "on"
}

// Response
{
  "success": true,
  "message": "Action on sent to LED1"
}
```

### 3. **GET /api/data/history** - API tìm kiếm phân trang Data
```javascript
// Request - Tìm kiếm theo temperature
GET /api/data/history?page=1&limit=5&filterType=temperature&searchQuery=25

// Request - Sắp xếp theo humidity tăng dần
GET /api/data/history?page=1&limit=5&sortColumn=humidity&sortDirection=asc

// Request - Tìm kiếm theo time
GET /api/data/history?page=1&limit=5&filterType=time&searchQuery=2024-01-15

// Response
{
  "data": [
    {
      "id": 1,
      "temperature": 25.5,
      "light": 300,
      "humidity": 60,
      "time": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "currentPage": 1,
    "totalPages": 20,
    "limit": 5
  }
}
```

### 4. **GET /api/actions/history** - API tìm kiếm và phân trang History
```javascript
// Request - Tìm kiếm theo device_name
GET /api/actions/history?page=1&limit=5&filterType=device_name&searchQuery=LED1

// Request - Tìm kiếm theo action
GET /api/actions/history?page=1&limit=5&filterType=action&searchQuery=on

// Request - Sắp xếp theo timestamp tăng dần
GET /api/actions/history?page=1&limit=5&sortColumn=timestamp&sortDirection=asc

// Request - Tìm kiếm theo timestamp
GET /api/actions/history?page=1&limit=5&filterType=timestamp&searchQuery=2024-01-15

// Response
{
  "data": [
    {
      "id": 1,
      "device_name": "LED1",
      "action": "on",
      "timestamp": "2024-01-15T08:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "currentPage": 1,
    "totalPages": 10,
    "limit": 5
  }
}
```

## Database Schema

### Tables cần thiết:

1. **stream_data** - Dữ liệu cảm biến (nhiệt độ, độ ẩm, ánh sáng)
2. **device_history** - Lịch sử hành động điều khiển

## Testing

### Test API
```bash
# Get sensor data
curl http://localhost:5000/api/sensor-data

# Control device
curl -X POST http://localhost:5000/api/control \
  -H "Content-Type: application/json" \
  -d '{"deviceName":"LED1","action":"on"}'

# Get sensor data history - Tìm kiếm theo temperature
curl "http://localhost:5000/api/data/history?page=1&limit=5&filterType=temperature&searchQuery=25"

# Get sensor data history - Sắp xếp theo humidity
curl "http://localhost:5000/api/data/history?page=1&limit=5&sortColumn=humidity&sortDirection=asc"

# Get actions history - Tìm kiếm theo device
curl "http://localhost:5000/api/actions/history?page=1&limit=5&filterType=device_name&searchQuery=LED1"

# Get actions history - Sắp xếp theo timestamp
curl "http://localhost:5000/api/actions/history?page=1&limit=5&sortColumn=timestamp&sortDirection=desc"
```

## Tính năng mới của API

### 🔍 **Tìm kiếm linh hoạt**
- **filterType**: Có thể tìm kiếm theo bất kỳ field nào
- **searchQuery**: Từ khóa tìm kiếm
- **Ví dụ**: `filterType=temperature&searchQuery=25`

### 📊 **Sắp xếp động**
- **sortColumn**: Sắp xếp theo bất kỳ cột nào
- **sortDirection**: `asc` (tăng dần) hoặc `desc` (giảm dần)
- **Ví dụ**: `sortColumn=humidity&sortDirection=asc`

### 📄 **Phân trang thông minh**
- **page**: Trang hiện tại (mặc định: 1)
- **limit**: Số bản ghi mỗi trang (mặc định: 5)
- **Response**: Bao gồm thông tin pagination đầy đủ

## Lợi ích của API đơn giản

- **Dễ hiểu**: Chỉ 4 API cơ bản  
- **Dễ sử dụng**: Không cần học nhiều endpoint  
- **Linh hoạt**: Tìm kiếm và sắp xếp động
- **Nhanh chóng**: Ít code, ít phức tạp  
- **Đủ dùng**: Có đầy đủ chức năng cần thiết cho frontend  
- **Dễ debug**: Ít lỗi, dễ tìm lỗi  

## Troubleshooting

### Database Connection Issues
- Kiểm tra MySQL service đang chạy
- Xác nhận thông tin kết nối trong `.env`
- Kiểm tra firewall/port 3306

### Server Issues
- Kiểm tra port 5000 có bị chiếm không
- Xác nhận file `.env` đúng cấu hình
- Kiểm tra logs của server

## Support

Nếu gặp vấn đề, vui lòng kiểm tra:
1. Logs của server
2. Database connection
3. Network connectivity

## License

MIT License