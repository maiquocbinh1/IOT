
const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const path = require('path');
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

// ===== Simple mapping & normalization settings (editable) =====
const DEVICE_NAME_MAP = {
  fan: 'led1',
  air_conditioner: 'led2',
  airconditioner: 'led2',
  'air conditioner': 'led2',
  light: 'led3',
  led1: 'led1',
  led2: 'led2',
  led3: 'led3'
};

function normalizeDeviceName(input) {
  const raw = String(input || '').trim().toLowerCase();
  const key = raw.replace(/\s+/g, '_');
  return DEVICE_NAME_MAP[key] || ( /^led[123]$/.test(key) ? key : raw );
}

function normalizeAction(input) {
  const raw = String(input || '').trim().toLowerCase();
  if (raw === '1' || raw === 'on' || raw === 'true') return 'on';
  if (raw === '0' || raw === 'off' || raw === 'false') return 'off';
  return raw;
}

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
  const raw = message.toString();

  // SENSOR_TOPIC expects strict JSON
  if (topic === SENSOR_TOPIC) {
    try {
      const data = JSON.parse(raw);
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
          const sensorData = {
            type: 'SENSOR_DATA',
            temperature: data.temperature,
            humidity: data.humidity,
            light: data.light,
            time: new Date().toISOString()
          };
          wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(sensorData));
            }
          });
        }
      });
    } catch (e) {
      console.warn('Ignoring non-JSON sensor payload:', raw);
    }
    return;
  }

  // STATUS_TOPIC: support JSON or simple csv "led1:0,led2:1,led3:0" without throwing
  if (topic === STATUS_TOPIC) {
    let handled = false;
    try {
      const data = JSON.parse(raw);
      if (data?.led && (data.status === 'on' || data.status === 'off')) {
        if (currentLedStatus[data.led] !== undefined) {
          currentLedStatus[data.led] = data.status;
          handled = true;
        }
      }
    } catch {}

    if (!handled) {
      raw.split(',').forEach((pair) => {
        const [k, v] = pair.split(':').map((s) => s && s.trim());
        if (k && Object.prototype.hasOwnProperty.call(currentLedStatus, k)) {
          currentLedStatus[k] = v === '1' || v === 'on' ? 'on' : 'off';
        }
      });
    }
    // Broadcast updated LED status to all WS clients
    const ledStatusPayload = {
      type: 'LED_STATUS',
      status: {
        led1: currentLedStatus.led1,
        led2: currentLedStatus.led2,
        led3: currentLedStatus.led3
      }
    };
    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(ledStatusPayload));
      }
    });
  // No retained snapshot publish – device persists its own state
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

// serve project-level IOT.pdf for FE download
app.get('/IOT.pdf', (req, res) => {
  const pdfPath = path.join(__dirname, '..', 'IOT.pdf');
  res.sendFile(pdfPath, (err) => {
    if (err) {
      console.error('Error sending IOT.pdf:', err);
      res.status(err.statusCode || 500).end();
    }
  });
});



//api điều khiển đèn
app.post('/api/control', (req, res) => {
  console.log('Request body:', req.body);
  const { deviceName, action } = req.body;

  if (!deviceName || !action) {
    return res.status(400).json({ error: 'Thiếu deviceName hoặc action' });
  }

  const normalizedDevice = normalizeDeviceName(deviceName);
  const normalizedAction = normalizeAction(action);

  if (!/^led[123]$/.test(normalizedDevice) || !/^(on|off)$/.test(normalizedAction)) {
    return res.status(400).json({ error: 'Giá trị deviceName/action không hợp lệ' });
  }

  const description = `Turned ${normalizedAction} the ${normalizedDevice}`;
  const sql = `INSERT INTO action_history (device_name, action, timestamp, description) VALUES (?, ?, NOW(), ?)`;
  const params = [normalizedDevice, normalizedAction, description];

  pool.query(sql, params, (err) => {
    if (err) {
      console.error('Lỗi ghi lịch sử điều khiển:', err);
      return res.status(500).json({ error: 'Lỗi hệ thống' });
    }

    // Publish MQTT command to hardware if possible (non-blocking)
    const command = `${normalizedDevice}${normalizedAction}`; // led1on | led2off | led3on
    let published = false;
    if (isMqttConnected) {
      try {
        // 1) Immediate command for compatibility (NOT retained): led1on/led2off/...
        mqttClient.publish(COMMAND_TOPIC, command, (pubErr) => {
          if (pubErr) {
            console.warn('Không thể gửi lệnh MQTT:', pubErr.message);
          }
        });
        // 2) Update in-memory state only for UI/WebSocket purposes
        currentLedStatus[normalizedDevice] = normalizedAction;
        published = true;
      } catch (e) {
        console.warn('MQTT publish exception:', e.message);
      }
    } else {
      console.warn('MQTT chưa kết nối - chỉ lưu DB, chưa gửi phần cứng');
    }

    return res.json({ success: true, published, message: `Đã xử lý lệnh ${normalizedAction} cho ${normalizedDevice}` });
  });
});
//api phân trang lấy dữ liệu cảm biến (ĐÃ NÂNG CẤP VỚI FILTERTYPE)
app.get('/api/data', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 11;
  const offset = (page - 1) * limit;

  // Lấy tất cả các tham số lọc từ frontend
  const { searchQuery, filterType = 'All', timeSearch } = req.query;
  const sortColumn = req.query.sortColumn || 'time';
  const sortDirection = (req.query.sortDirection || 'desc').toLowerCase();

  const allowedCols = ['id', 'temperature', 'light', 'humidity', 'time'];
  const sortColSafe = allowedCols.includes(sortColumn) ? `\`${sortColumn}\`` : '`time`';
  const sortDirSafe = sortDirection === 'asc' ? 'ASC' : 'DESC';

  let whereClauses = [];
  const params = [];

  // 1. Xử lý tìm kiếm theo từ khóa và filterType
  if (searchQuery && searchQuery.trim() !== '') {
    const term = searchQuery.trim();
    const type = filterType.toLowerCase();

    if (type === 'all' || type === '') {
      // Tìm kiếm toàn cục
      const searchTerm = `%${term}%`;
      whereClauses.push(`(CAST(id AS CHAR) LIKE ? OR CAST(temperature AS CHAR) LIKE ? OR CAST(humidity AS CHAR) LIKE ? OR CAST(light AS CHAR) LIKE ? OR \`time\` LIKE ?)`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    } else if (allowedCols.includes(type)) {
      // Tìm kiếm trên một cột cụ thể
      whereClauses.push(`\`${type}\` LIKE ?`);
      params.push(`%${term}%`);
    }
  }
  
  // 2. Xử lý tìm kiếm theo ngày
  if (timeSearch && timeSearch.trim() !== '') {
      whereClauses.push('DATE(`time`) = ?');
      params.push(timeSearch.trim());
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  const baseQuery = `SELECT id, temperature, light, humidity, \`time\` FROM sensor_data ${whereString} ORDER BY ${sortColSafe} ${sortDirSafe} LIMIT ? OFFSET ?`;
  const countQuery = `SELECT COUNT(*) as total FROM sensor_data ${whereString}`;

  const dataParams = [...params, limit, offset];
  const countParams = [...params];

  pool.query(countQuery, countParams, (err, countResults) => {
    if (err) return res.status(500).json({ error: 'Database count query error' });
    
    pool.query(baseQuery, dataParams, (err2, results) => {
      if (err2) return res.status(500).json({ error: 'Database data query error' });
      
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
  const limit = parseInt(req.query.limit) || 10;
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
      whereClause = ' WHERE DATE(`timestamp`) = ?';
      params.push(searchQuery);
    } else {
      whereClause = ` WHERE \`${filterType}\` LIKE ?`;
      params.push(`%${searchQuery}%`);
    }
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
