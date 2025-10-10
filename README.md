# IoT Dashboard System

A comprehensive IoT dashboard system for monitoring and controlling sensors and devices in real-time.

## 🚀 Features

### Frontend (React + Vite)
- **Real-time Dashboard**: Live monitoring of temperature, humidity, and light sensors
- **Data Visualization**: Interactive charts with Chart.js
- **Device Control**: Control LED devices (Fan, Air Conditioner, Light)
- **Data Management**: Filter and search sensor data with exact match
- **Action History**: Track device control actions with filtering
- **Responsive Design**: Modern UI with clean, professional interface

### Backend (Node.js + Express)
- **RESTful API**: Complete API for sensor data and device control
- **WebSocket Support**: Real-time data streaming
- **MQTT Integration**: IoT device communication
- **MySQL Database**: Reliable data storage
- **CORS Enabled**: Cross-origin request support

### Hardware
- **Arduino/ESP32**: Sensor data collection
- **MQTT Communication**: Device-to-server communication
- **LED Control**: Physical device control

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- MQTT Broker (Mosquitto)
- Git

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/maiquocbinh1/IOT.git
cd IOT
```

### 2. Backend Setup
```bash
cd BE
npm install
cp config/env.example .env
# Configure your database and MQTT settings in .env
npm run setup-db
npm start
```

### 3. Frontend Setup
```bash
cd FE
npm install
npm run dev
```

### 4. MQTT Broker
```bash
# Install Mosquitto
# Windows: Download from https://mosquitto.org/download/
# Linux: sudo apt-get install mosquitto mosquitto-clients
# macOS: brew install mosquitto

# Start MQTT broker
mosquitto -c mosquitto.conf
```

## 🎯 Usage

1. **Start Backend**: `cd BE && npm start`
2. **Start Frontend**: `cd FE && npm run dev`
3. **Open Browser**: Navigate to `http://localhost:3000`
4. **Connect Hardware**: Upload Arduino sketch and connect to MQTT broker

## 📊 API Endpoints

### Sensor Data
- `GET /api/sensor-data` - Get sensor data with filtering
- `GET /api/sensor-data/latest/all` - Get latest sensor readings
- `POST /api/sensor-data` - Add new sensor data

### Device Control
- `POST /api/led/control` - Control LED devices
- `GET /api/mqtt/led/status` - Get LED status

### Action History
- `GET /api/action-history` - Get action history with filtering

## 🔧 Configuration

### Environment Variables (.env)
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=iot_dashboard
MQTT_BROKER_URL=mqtt://localhost:1883
FRONTEND_URL=http://localhost:3000
```

### MQTT Topics
- `sensor/data` - Sensor data from hardware
- `led/control` - LED control commands
- `led/status` - LED status updates

## 📁 Project Structure

```
IOT/
├── BE/                     # Backend (Node.js)
│   ├── config/            # Configuration files
│   ├── database/          # Database schema
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   └── server.js          # Main server file
├── FE/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   └── App.jsx        # Main app component
│   └── vite.config.js     # Vite configuration
├── Hardware/              # Arduino/ESP32 code
└── README.md             # This file
```

## 🎨 Features Overview

### Dashboard
- Real-time sensor data display
- Interactive temperature, humidity, light charts
- Device control panel
- Auto-refresh every 30 seconds

### Data Sensor Page
- Search with exact match
- Filter by sensor type (Temperature, Humidity, Light)
- Pagination support
- Time-based data display

### Action History Page
- Device action tracking
- Filter by device type
- Search functionality
- Pagination support

### Profile Page
- User information display
- GitHub project link
- API documentation links

## 🔄 Real-time Updates

The system uses WebSocket connections for real-time updates:
- Sensor data updates every 30 seconds
- Device status changes instantly
- Chart data refreshes automatically

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd FE
npm run build

# Backend
cd BE
npm start
```

### Docker (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Mai Quốc Bình**
- Student at PTIT
- MSV: B22DCCN082_D22HTTT05
- Email: BinhMQ.B22DCCN082@stu.ptit.edu.vn
- GitHub: [maiquocbinh1](https://github.com/maiquocbinh1)

## 📞 Support

For support, email BinhMQ.B22DCCN082@stu.ptit.edu.vn or create an issue on GitHub.

---

**IoT Dashboard System** - Real-time monitoring and control for IoT devices
