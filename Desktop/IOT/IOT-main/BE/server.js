// server.js
// IoT Backend: API + MQTT + MySQL + WebSocket (NO SWAGGER, NO ICON)

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const mqtt = require('mqtt');
require('dotenv').config();

const { initializeDatabase, getConnection, pool } = require('./config/database');

const app = express();
const port = process.env.PORT || 5000;

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let isMqttConnected = false;
let isEsp32DataConnected = false;
let lastDataTimestamp = 0;
const DATA_TIMEOUT = 10000;

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  ws.send(JSON.stringify({ type: 'MQTT_STATUS', isConnected: isMqttConnected }));
  ws.send(JSON.stringify({ type: 'DATA_STATUS', isConnected: isEsp32DataConnected }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket client error:', error);
  });
});

function broadcastMqttStatus() {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'MQTT_STATUS', isConnected: isMqttConnected }));
    }
  });
}

function broadcastDataStatus() {
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'DATA_STATUS', isConnected: isEsp32DataConnected }));
    }
  });
}

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const mqttBrokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://172.20.10.14:1883';
const SENSOR_TOPIC = 'iot/sensor/data';
const COMMAND_TOPIC = 'iot/led/control';
const STATUS_TOPIC = 'iot/led/status';

let currentLedStatus = { led1: 'off', led2: 'off', led3: 'off' };

const mqttClient = mqtt.connect(mqttBrokerUrl, {
  username: process.env.MQTT_USERNAME || 'binh',
  password: process.env.MQTT_PASSWORD || '123456',
  keepalive: 120,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  isMqttConnected = true;
  broadcastMqttStatus();
  mqttClient.subscribe([SENSOR_TOPIC, STATUS_TOPIC], (err) => {
    if (err) console.error('MQTT subscribe error:', err);
  });
});

mqttClient.on('reconnect', () => {
  console.log('Reconnecting to MQTT Broker...');
  isMqttConnected = false;
  broadcastMqttStatus();
});

mqttClient.on('close', () => {
  console.log('Disconnected from MQTT Broker');
  isMqttConnected = false;
  broadcastMqttStatus();
});

mqttClient.on('error', (error) => {
  console.error('MQTT Connection Error:', error);
  isMqttConnected = false;
  broadcastMqttStatus();
});

function checkDataConnection() {
  const timeSinceLastData = Date.now() - lastDataTimestamp;
  const currentlyConnected = timeSinceLastData < DATA_TIMEOUT;
  if (isEsp32DataConnected !== currentlyConnected) {
    isEsp32DataConnected = currentlyConnected;
    console.log(`ESP32 Data ${isEsp32DataConnected ? 'Connected' : 'Disconnected'}`);
    broadcastDataStatus();
  }
}
setInterval(checkDataConnection, 5000);

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    if (topic === SENSOR_TOPIC) {
      lastDataTimestamp = Date.now();
      if (!isEsp32DataConnected) {
        isEsp32DataConnected = true;
        broadcastDataStatus();
      }

      const sql = `INSERT INTO sensor_data (temperature, humidity, light, time) VALUES (?, ?, ?, NOW())`;
      const params = [data.temperature, data.humidity, data.light];
      
      pool.query(sql, params, (err) => {
        if (err) {
          console.error('DB insert error:', err);
        } else {
          console.log(`Sensor data saved to DB: T=${data.temperature}, H=${data.humidity}, L=${data.light}`);
          const sensorData = {
            type: 'SENSOR_DATA',
            temperature: data.temperature,
            humidity: data.humidity,
            light: data.light,
            time: new Date().toISOString()
          };
          console.log('Broadcasting sensor data to WebSocket clients:', sensorData);
          wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(sensorData));
              console.log('Sent to WebSocket client');
            } else {
              console.log('WebSocket client not ready');
            }
          });
        }
      });
    }

    if (topic === STATUS_TOPIC) {
      // Try JSON format first: { led: 'led1', status: 'on' }
      if (data?.led && ['on', 'off'].includes(data.status)) {
        if (currentLedStatus[data.led] !== undefined) {
          currentLedStatus[data.led] = data.status;
        }
      } else {
        // Fallback: parse "led1:1,led2:0,led3:1"
        try {
          const raw = message.toString();
          raw.split(',').forEach((pair) => {
            const [k, v] = pair.split(':').map((s) => s?.trim());
            if (k && Object.prototype.hasOwnProperty.call(currentLedStatus, k)) {
              currentLedStatus[k] = v === '1' ? 'on' : 'off';
            }
          });
        } catch {}
      }
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});
//api lấy dữ liệu cảm biến mới nhất
app.get('/api/sensor-data', (req, res) => {
  const query = `
    SELECT temperature, humidity, light, \`time\`
    FROM sensor_data
    ORDER BY \`time\` DESC
    LIMIT 1
  `;
  
  pool.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Include ESP32 connection status
    const response = {
      ...(results[0] || {}),
      esp32Connected: isEsp32DataConnected,
      mqttConnected: isMqttConnected
    };
    
    res.json(response);
  });
});

//api kiểm tra trạng thái kết nối
app.get('/api/connection-status', (req, res) => {
  res.json({
    esp32Connected: isEsp32DataConnected,
    mqttConnected: isMqttConnected,
    lastDataTimestamp: lastDataTimestamp,
    timeSinceLastData: Date.now() - lastDataTimestamp
  });
});

//api điều khiển đèn
app.post('/api/control', (req, res) => {
  const { deviceName, action } = req.body;
  if (!deviceName || !action) return res.status(400).json({ error: 'Missing fields' });

  // Check if ESP32 is connected before allowing control
  console.log(`Control request: ${deviceName} ${action}, ESP32 connected: ${isEsp32DataConnected}`);
  if (!isEsp32DataConnected) {
    console.log(`ESP32 disconnected - rejecting control command: ${deviceName} ${action}`);
    return res.status(503).json({ error: 'ESP32 disconnected - cannot control devices' });
  }

  // Normalize deviceName/action
  const d = String(deviceName || '').toLowerCase();
  const a = String(action || '').toLowerCase();

  // Allow FE to send either led1/led2/led3 or friendly names
  const map = {
    fan: 'led1',
    air_conditioner: 'led2',
    airconditioner: 'led2',
    'air conditioner': 'led2',
    light: 'led3',
  };
  const led = d.startsWith('led') ? d : (map[d] || d);

  if (!/^led[123]$/.test(led) || !/^(on|off)$/.test(a)) {
    return res.status(400).json({ error: 'Invalid deviceName/action' });
  }

  // Persist original intent to DB
  const description = `Turned ${a} the ${deviceName}`;
  const sql = `INSERT INTO action_history (device_name, action, timestamp, description) VALUES (?, ?, NOW(), ?)`;
  const params = [led, a, description];

  pool.query(sql, params, (err) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`Action history saved: ${led} ${a}`);

    // ESP32 expects: led1on / led2off / led3on
    const command = `${led}${a}`;

    console.log(`Attempting to publish MQTT command: ${command} to topic: ${COMMAND_TOPIC}`);
    console.log(`MQTT client connected: ${isMqttConnected}`);

    mqttClient.publish(COMMAND_TOPIC, command, (pubErr) => {
      if (pubErr) {
        console.error('MQTT publish error:', pubErr);
        return res.status(500).json({ error: 'MQTT publish error: ' + pubErr.message });
      }
      console.log(`✅ MQTT command sent successfully: ${command} to ${COMMAND_TOPIC}`);
      res.json({ success: true, message: `Action ${a} sent to ${led}` });
    });
  });
});
//api phân trang lấy dữ liệu cảm biến
app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const filterType = req.query.filterType;
  const searchQuery = req.query.searchQuery;
  const sortColumn = req.query.sortColumn;
  const sortDirection = (req.query.sortDirection || 'desc').toLowerCase();

  const allowedCols = ['id', 'temperature', 'light', 'humidity', 'time'];
  const sortColSafe = allowedCols.includes(sortColumn) ? sortColumn : 'time';
  const sortDirSafe = sortDirection === 'asc' ? 'ASC' : 'DESC';

  let baseQuery = 'SELECT id, temperature, light, humidity, `time` FROM sensor_data';
  let countQuery = 'SELECT COUNT(*) as total FROM sensor_data';
  let whereClause = '';
  const params = [];

  if (searchQuery && filterType && filterType !== 'all' && allowedCols.includes(filterType)) {
    whereClause = ` WHERE \`${filterType}\` LIKE ?`;
    params.push(`%${searchQuery}%`);
  }

  baseQuery += whereClause + ` ORDER BY \`${sortColSafe}\` ${sortDirSafe} LIMIT ${limit} OFFSET ${offset}`;
  countQuery += whereClause;

  // Use callback-based query
  pool.query(countQuery, params, (err, countResults) => {
    if (err) {
      console.error('Count query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    pool.query(baseQuery, params, (err2, results) => {
      if (err2) {
        console.error('Data query error:', err2);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const total = countResults[0]?.total || 0;
      res.json({
        data: results,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      });
    });
  });
});
//api phân trang lấy lịch sử điều khiển

app.get('/api/actions/history', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;
  const filterType = req.query.filterType;
  const searchQuery = req.query.searchQuery;
  const sortColumn = req.query.sortColumn || 'timestamp';
  const sortDirection = (req.query.sortDirection || 'desc').toLowerCase();

  const allowedCols = ['device_name', 'action', 'timestamp'];
  const sortColSafe = allowedCols.includes(sortColumn) ? sortColumn : 'timestamp';
  const sortDirSafe = sortDirection === 'asc' ? 'ASC' : 'DESC';

  let baseQuery = 'SELECT id, device_name, action, timestamp FROM action_history';
  let countQuery = 'SELECT COUNT(*) as total FROM action_history';
  let whereClause = '';
  const params = [];

  if (searchQuery && filterType && filterType !== 'all' && allowedCols.includes(filterType)) {
    if (filterType === 'timestamp') {
      whereClause = ' WHERE DATE_FORMAT(timestamp, "%Y-%m-%d %H:%i:%s") LIKE ?';
    } else {
      whereClause = ` WHERE \`${filterType}\` LIKE ?`;
    }
    params.push(`%${searchQuery}%`);
  }

  baseQuery += whereClause + ` ORDER BY \`${sortColSafe}\` ${sortDirSafe} LIMIT ${limit} OFFSET ${offset}`;
  countQuery += whereClause;

  // Use callback-based query
  pool.query(countQuery, params, (err, countResults) => {
    if (err) {
      console.error('Count query error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    pool.query(baseQuery, params, (err2, results) => {
      if (err2) {
        console.error('Data query error:', err2);
        return res.status(500).json({ error: 'Database error' });
      }
      
      const total = countResults[0]?.total || 0;
      res.json({
        data: results,
        pagination: {
          total,
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      });
    });
  });
});

// Update database initialization section
const initializeServer = async () => {
  try {
    console.log('Initializing IoT Backend Server...');
    console.log('Database Config:', {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    // Test database connection before proceeding
    const dbConnection = await pool.promise().getConnection();
    console.log('Database connection test successful');
    dbConnection.release();

    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      throw new Error('Database initialization failed - check your database credentials in .env file');
    }

    server.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log(`MQTT Broker: ${mqttBrokerUrl}`);
    });

    const shutdown = (signal) => {
      console.log(`${signal} received, shutting down...`);
      server.close(() => {
        try { mqttClient.end(true); } catch {}
        process.exit(0);
      });
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Server initialization failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Database access denied - please check your database credentials');
      console.error('Make sure your .env file contains correct DB_USER and DB_PASSWORD');
    }
    process.exit(1);
  }
};

initializeServer();
module.exports = app;
