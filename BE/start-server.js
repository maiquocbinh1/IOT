const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import configurations
const { initializeDatabase } = require('./config/database');
const mqttClient = require('./config/mqtt');
const webSocketManager = require('./config/websocket');

// Import models
const SensorData = require('./models/SensorData');
const ActionHistory = require('./models/ActionHistory');

// Import routes
const sensorTypeRoutes = require('./routes/sensorTypes');
const locationRoutes = require('./routes/locations');
const sensorRoutes = require('./routes/sensors');
const sensorDataRoutes = require('./routes/sensorData');
const actionHistoryRoutes = require('./routes/actionHistory');

// Import MQTT topic routes
const sensorDataTopicRoutes = require('./routes/mqtt/sensorDataTopic');
const ledControlTopicRoutes = require('./routes/mqtt/ledControlTopic');
const ledStatusTopicRoutes = require('./routes/mqtt/ledStatusTopic');

// Create Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        mqtt: mqttClient.isClientConnected(),
        websocket: webSocketManager.isInitialized(),
        connectedClients: webSocketManager.getConnectedClientsCount()
    });
});

// API Routes
app.use('/api/sensor-types', sensorTypeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/sensor-data', sensorDataRoutes);
app.use('/api/action-history', actionHistoryRoutes);

// MQTT Topic Routes
app.use('/api/mqtt/sensor-data', sensorDataTopicRoutes);
app.use('/api/mqtt/led', ledControlTopicRoutes);
app.use('/api/mqtt/led', ledStatusTopicRoutes);

// LED Control API endpoint
app.post('/api/led/control', async (req, res) => {
    try {
        const { action, device_name = 'LED1', description } = req.body;

        if (!action || !['on', 'off'].includes(action.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "on" or "off"'
            });
        }

        // Map device names to ESP32 commands
        const deviceMap = {
            'LED1': 'led1',
            'LED2': 'led2', 
            'LED3': 'led3',
            'Fan': 'led1',      // Map Fan to LED1
            'Air Conditioner': 'led2', // Map AC to LED2
            'Light': 'led3'     // Map Light to LED3
        };

        const espCommand = deviceMap[device_name] || 'led1';
        const mqttCommand = `${espCommand}${action.toLowerCase()}`;

        console.log(`Sending MQTT command: ${mqttCommand}`);

        // Publish LED control command via MQTT (ESP32 expects simple string commands)
        const published = mqttClient.publishLedControl(mqttCommand);
        
        if (!published) {
            return res.status(503).json({
                success: false,
                message: 'MQTT client not connected'
            });
        }

        // Map LED names back to device names for display
        const displayNameMap = {
            'LED1': 'Fan',
            'LED2': 'Air Conditioner', 
            'LED3': 'Light'
        };
        const displayName = displayNameMap[device_name] || device_name;

        // Save action to history
        const actionHistoryId = await ActionHistory.create(
            displayName,
            action.toLowerCase(),
            description || `${displayName} turned ${action.toLowerCase()}`,
            new Date()
        );

        res.json({
            success: true,
            message: `LED control command sent: ${mqttCommand}`,
            data: {
                command: mqttCommand,
                device_name: displayName,
                action: action.toLowerCase(),
                actionHistoryId
            }
        });

    } catch (error) {
        console.error('Error controlling LED:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Get system status
app.get('/api/system/status', (req, res) => {
    res.json({
        success: true,
        data: {
            mqtt: {
                connected: mqttClient.isClientConnected(),
                topics: mqttClient.getTopics()
            },
            websocket: {
                initialized: webSocketManager.isInitialized(),
                connectedClients: webSocketManager.getConnectedClientsCount(),
                clients: webSocketManager.getConnectedClients()
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }
        }
    });
});

// Test endpoint to add sample sensor data
app.post('/api/test/sensor-data', async (req, res) => {
    try {
        const { temperature, humidity, light } = req.body;
        
        // Create sample sensor data
        const sensorDataId = await SensorData.create(
            temperature || Math.random() * 20 + 20, // Random temp between 20-40°C
            humidity || Math.random() * 40 + 40,    // Random humidity between 40-80%
            light || Math.random() * 500 + 200,     // Random light between 200-700 lux
            new Date()
        );

        console.log('Test sensor data saved to database:', sensorDataId);

        res.json({
            success: true,
            message: 'Test sensor data created successfully',
            data: {
                id: sensorDataId,
                temperature: temperature || 'random',
                humidity: humidity || 'random',
                light: light || 'random',
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error creating test sensor data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// MQTT message handlers
const setupMQTTHandlers = () => {
    // Handle sensor data from MQTT
    mqttClient.subscribe(mqttClient.getTopics().sensorData, async (message, topic) => {
        try {
            console.log('Raw MQTT message:', message);
            
            // Parse JSON message from ESP32
            let data;
            if (typeof message === 'string') {
                data = JSON.parse(message);
            } else {
                data = message;
            }
            
            console.log('Parsed sensor data:', data);
            
            // Save sensor data to database
            const sensorDataId = await SensorData.create(
                data.temperature,
                data.humidity,
                data.light,
                data.timestamp || new Date()
            );

            console.log('Sensor data saved to database:', sensorDataId);

            // Broadcast to WebSocket clients
            webSocketManager.broadcastSensorData({
                id: sensorDataId,
                ...data
            });

        } catch (error) {
            console.error('Error processing sensor data:', error);
            webSocketManager.broadcastError(error);
        }
    });

    // Handle LED status from MQTT
    mqttClient.subscribe(mqttClient.getTopics().ledStatus, async (message, topic) => {
        try {
            console.log('Raw LED status message:', message);
            
            // Parse LED status message from ESP32 (format: "led1:1,led2:0,led3:1")
            let statusData = {};
            if (typeof message === 'string') {
                const parts = message.split(',');
                parts.forEach(part => {
                    const [led, value] = part.split(':');
                    statusData[led.trim()] = parseInt(value.trim()) === 1;
                });
            } else {
                statusData = message;
            }
            
            console.log('Parsed LED status:', statusData);
            
            // Save action to history for each LED
            const timestamp = new Date();
            const promises = [];
            
            Object.keys(statusData).forEach(led => {
                const isOn = statusData[led];
                promises.push(
                    ActionHistory.create(
                        led.toUpperCase(),
                        isOn ? 'on' : 'off',
                        `${led.toUpperCase()} turned ${isOn ? 'on' : 'off'}`,
                        timestamp
                    )
                );
            });
            
            const actionHistoryIds = await Promise.all(promises);
            console.log('LED status saved to database:', actionHistoryIds);

            // Broadcast to WebSocket clients
            webSocketManager.broadcastLedStatus({
                timestamp,
                ...statusData
            });

        } catch (error) {
            console.error('Error processing LED status:', error);
            webSocketManager.broadcastError(error);
        }
    });
};

// Initialize server
const initializeServer = async () => {
    try {
        console.log('🚀 Initializing IoT Backend Server...');

        // Initialize database
        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            throw new Error('Failed to initialize database');
        }

        // Initialize WebSocket
        webSocketManager.initialize(server);

        // Connect to MQTT broker
        mqttClient.connect();

        // Setup MQTT message handlers
        setupMQTTHandlers();

        // Start server
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`✅ WebSocket server ready`);
            console.log(`✅ Health check: http://localhost:${PORT}/health`);
            console.log(`✅ API base URL: http://localhost:${PORT}/api`);
            console.log(`✅ Test endpoint: http://localhost:${PORT}/api/test/sensor-data`);
            console.log('\n📊 Database is ready to save data!');
        });

    } catch (error) {
        console.error('❌ Failed to initialize server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server gracefully...');
    
    server.close(() => {
        console.log('HTTP server closed');
        
        mqttClient.disconnect();
        console.log('MQTT client disconnected');
        
        process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});

// Start the server
initializeServer();

module.exports = app;
