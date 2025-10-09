const express = require('express');
const router = express.Router();
const ActionHistory = require('../../models/ActionHistory');
const mqttClient = require('../../config/mqtt');
const webSocketManager = require('../../config/websocket');

/**
 * MQTT Topic: iot/led/status
 * 
 * File này xử lý tất cả API liên quan đến topic iot/led/status
 * - ESP32 gửi trạng thái LED sau khi thực hiện lệnh điều khiển
 * - Backend nhận, lưu database và broadcast qua WebSocket
 */

// GET /api/mqtt/led/status - Lấy trạng thái LED hiện tại từ database
router.get('/status', async (req, res) => {
    try {
        const { device_name } = req.query;
        
        let actionHistory;
        if (device_name) {
            actionHistory = await ActionHistory.getLatestForAllDevices();
            actionHistory = actionHistory.filter(item => item.device_name === device_name);
        } else {
            actionHistory = await ActionHistory.getLatestForAllDevices();
        }

        res.json({
            success: true,
            topic: 'iot/led/status',
            message: 'LED status retrieved from database',
            data: actionHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/status',
            message: error.message
        });
    }
});

// GET /api/mqtt/led/status/history - Lấy lịch sử trạng thái LED
router.get('/status/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const { device_name, startDate, endDate } = req.query;

        let actionHistory;
        if (startDate && endDate) {
            actionHistory = await ActionHistory.getByDateRange(startDate, endDate, device_name);
        } else if (device_name) {
            actionHistory = await ActionHistory.getByDevice(device_name, limit, offset);
        } else {
            actionHistory = await ActionHistory.getAll(limit, offset);
        }

        res.json({
            success: true,
            topic: 'iot/led/status',
            message: 'LED status history retrieved',
            data: actionHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/status',
            message: error.message
        });
    }
});

// GET /api/mqtt/led/status/device/:deviceName - Lấy trạng thái của thiết bị cụ thể
router.get('/status/device/:deviceName', async (req, res) => {
    try {
        const { deviceName } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const actionHistory = await ActionHistory.getByDevice(deviceName, limit, offset);
        
        // Lấy trạng thái mới nhất
        const latestStatus = actionHistory.length > 0 ? actionHistory[0] : null;

        res.json({
            success: true,
            topic: 'iot/led/status',
            message: `Status for device: ${deviceName}`,
            data: {
                device_name: deviceName,
                current_status: latestStatus,
                recent_history: actionHistory
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/status',
            message: error.message
        });
    }
});

// POST /api/mqtt/led/status/simulate - Mô phỏng gửi trạng thái LED qua MQTT
router.post('/status/simulate', async (req, res) => {
    try {
        const { device_name = 'LED', status, description } = req.body;

        if (!status || !['on', 'off'].includes(status.toLowerCase())) {
            return res.status(400).json({
                success: false,
                topic: 'iot/led/status',
                message: 'Invalid status. Must be "on" or "off"'
            });
        }

        // Tạo dữ liệu trạng thái mô phỏng
        const statusData = {
            device_name,
            status: status.toLowerCase(),
            description: description || `${device_name} status: ${status.toLowerCase()}`,
            timestamp: new Date().toISOString(),
            status_id: `status_${Date.now()}`
        };

        // Publish qua MQTT topic iot/led/status
        const published = mqttClient.publish('iot/led/status', statusData);
        
        if (!published) {
            return res.status(503).json({
                success: false,
                topic: 'iot/led/status',
                message: 'MQTT client not connected'
            });
        }

        res.json({
            success: true,
            topic: 'iot/led/status',
            message: 'LED status published to MQTT topic',
            data: statusData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/status',
            message: error.message
        });
    }
});

// GET /api/mqtt/led/status/statistics - Thống kê trạng thái LED
router.get('/status/statistics', async (req, res) => {
    try {
        const { startDate, endDate, device_name } = req.query;
        
        const statistics = await ActionHistory.getStatistics(startDate, endDate);
        const usageSummary = await ActionHistory.getDeviceUsageSummary(device_name);

        res.json({
            success: true,
            topic: 'iot/led/status',
            message: 'LED status statistics',
            data: {
                general_statistics: statistics,
                device_usage_summary: usageSummary,
                period: {
                    start_date: startDate,
                    end_date: endDate
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/status',
            message: error.message
        });
    }
});

// GET /api/mqtt/led/status/monitor - Monitor real-time trạng thái LED
router.get('/status/monitor', (req, res) => {
    res.json({
        success: true,
        topic: 'iot/led/status',
        message: 'LED status monitoring endpoint',
        data: {
            monitoring_active: true,
            websocket_available: webSocketManager.isInitialized(),
            connected_clients: webSocketManager.getConnectedClientsCount(),
            mqtt_connected: mqttClient.isClientConnected(),
            real_time_updates: 'Available via WebSocket events: led_status_update',
            last_check: new Date().toISOString()
        }
    });
});

// GET /api/mqtt/led/status/topic-info - Thông tin về MQTT topic
router.get('/status/topic-info', (req, res) => {
    res.json({
        success: true,
        topic: 'iot/led/status',
        description: 'Topic for receiving LED status updates from ESP32',
        direction: 'ESP32 → Backend',
        data_format: {
            device_name: 'string',
            status: 'string (on/off)',
            description: 'string',
            timestamp: 'ISO string',
            status_id: 'string'
        },
        example_status: {
            device_name: 'LED',
            status: 'on',
            description: 'LED turned on successfully',
            timestamp: '2024-01-15T08:00:00Z',
            status_id: 'status_1705312800000'
        },
        mqtt_status: mqttClient.isClientConnected(),
        websocket_status: webSocketManager.isInitialized(),
        real_time_events: [
            'led_status_update - Broadcast to all WebSocket clients',
            'action_history_update - Update action history in real-time'
        ]
    });
});

module.exports = router;
