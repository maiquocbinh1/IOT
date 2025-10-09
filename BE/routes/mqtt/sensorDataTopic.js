const express = require('express');
const router = express.Router();
const SensorData = require('../../models/SensorData');
const mqttClient = require('../../config/mqtt');
const webSocketManager = require('../../config/websocket');

/**
 * MQTT Topic: iot/sensor/data
 * 
 * File này xử lý tất cả API liên quan đến topic iot/sensor/data
 * - ESP32 gửi dữ liệu cảm biến qua topic này
 * - Backend nhận, lưu database và broadcast qua WebSocket
 */

// GET /api/mqtt/sensor-data - Lấy dữ liệu cảm biến từ database
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        
        const sensorData = await SensorData.getAll(limit, offset);
        res.json({
            success: true,
            topic: 'iot/sensor/data',
            message: 'Sensor data retrieved from database',
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/sensor/data',
            message: error.message
        });
    }
});

// GET /api/mqtt/sensor-data/latest - Lấy dữ liệu cảm biến mới nhất
router.get('/latest', async (req, res) => {
    try {
        const sensorData = await SensorData.getLatestForAllSensors();
        res.json({
            success: true,
            topic: 'iot/sensor/data',
            message: 'Latest sensor data retrieved',
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/sensor/data',
            message: error.message
        });
    }
});

// GET /api/mqtt/sensor-data/sensor/:sensorId - Lấy dữ liệu theo sensor ID
router.get('/sensor/:sensorId', async (req, res) => {
    try {
        const sensorId = parseInt(req.params.sensorId);
        if (isNaN(sensorId)) {
            return res.status(400).json({
                success: false,
                topic: 'iot/sensor/data',
                message: 'Invalid sensor ID'
            });
        }

        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const sensorData = await SensorData.getBySensorId(sensorId, limit, offset);
        res.json({
            success: true,
            topic: 'iot/sensor/data',
            message: `Sensor data for sensor ID ${sensorId}`,
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/sensor/data',
            message: error.message
        });
    }
});

// POST /api/mqtt/sensor-data/simulate - Mô phỏng gửi dữ liệu cảm biến qua MQTT
router.post('/simulate', async (req, res) => {
    try {
        const { sensor_id, temperature, humidity, light } = req.body;

        if (!sensor_id) {
            return res.status(400).json({
                success: false,
                topic: 'iot/sensor/data',
                message: 'Sensor ID is required'
            });
        }

        // Tạo dữ liệu mô phỏng
        const sensorData = {
            sensor_id: parseInt(sensor_id),
            temperature: temperature || (Math.random() * 30 + 15).toFixed(1), // 15-45°C
            humidity: humidity || (Math.random() * 50 + 30).toFixed(1), // 30-80%
            light: light || Math.floor(Math.random() * 500 + 100), // 100-600 lux
            timestamp: new Date().toISOString()
        };

        // Publish qua MQTT topic iot/sensor/data
        const published = mqttClient.publish('iot/sensor/data', sensorData);
        
        if (!published) {
            return res.status(503).json({
                success: false,
                topic: 'iot/sensor/data',
                message: 'MQTT client not connected'
            });
        }

        res.json({
            success: true,
            topic: 'iot/sensor/data',
            message: 'Sensor data published to MQTT topic',
            data: sensorData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/sensor/data',
            message: error.message
        });
    }
});

// GET /api/mqtt/sensor-data/statistics/:sensorId - Thống kê dữ liệu cảm biến
router.get('/statistics/:sensorId', async (req, res) => {
    try {
        const sensorId = parseInt(req.params.sensorId);
        if (isNaN(sensorId)) {
            return res.status(400).json({
                success: false,
                topic: 'iot/sensor/data',
                message: 'Invalid sensor ID'
            });
        }

        const { startDate, endDate } = req.query;
        const statistics = await SensorData.getStatistics(sensorId, startDate, endDate);
        
        res.json({
            success: true,
            topic: 'iot/sensor/data',
            message: `Statistics for sensor ID ${sensorId}`,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/sensor/data',
            message: error.message
        });
    }
});

// GET /api/mqtt/sensor-data/topic-info - Thông tin về MQTT topic
router.get('/topic-info', (req, res) => {
    res.json({
        success: true,
        topic: 'iot/sensor/data',
        description: 'Topic for receiving sensor data from ESP32',
        direction: 'ESP32 → Backend',
        data_format: {
            sensor_id: 'integer',
            temperature: 'decimal',
            humidity: 'decimal', 
            light: 'integer',
            timestamp: 'ISO string'
        },
        mqtt_status: mqttClient.isClientConnected(),
        websocket_status: webSocketManager.isInitialized()
    });
});

module.exports = router;
