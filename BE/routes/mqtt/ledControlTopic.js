const express = require('express');
const router = express.Router();
const ActionHistory = require('../../models/ActionHistory');
const mqttClient = require('../../config/mqtt');
const webSocketManager = require('../../config/websocket');

/**
 * MQTT Topic: iot/led/control
 * 
 * File này xử lý tất cả API liên quan đến topic iot/led/control
 * - Backend gửi lệnh điều khiển LED qua topic này
 * - ESP32 nhận lệnh và thực hiện điều khiển
 */

// POST /api/mqtt/led/control - Gửi lệnh điều khiển LED qua MQTT
router.post('/control', async (req, res) => {
    try {
        const { action, device_name = 'LED', description } = req.body;

        if (!action || !['on', 'off'].includes(action.toLowerCase())) {
            return res.status(400).json({
                success: false,
                topic: 'iot/led/control',
                message: 'Invalid action. Must be "on" or "off"'
            });
        }

        // Tạo lệnh điều khiển
        const command = {
            action: action.toLowerCase(),
            device_name,
            timestamp: new Date().toISOString(),
            command_id: `cmd_${Date.now()}`
        };

        // Publish lệnh điều khiển qua MQTT topic iot/led/control
        const published = mqttClient.publish('iot/led/control', command);
        
        if (!published) {
            return res.status(503).json({
                success: false,
                topic: 'iot/led/control',
                message: 'MQTT client not connected'
            });
        }

        // Lưu lệnh điều khiển vào action history
        const actionHistoryId = await ActionHistory.create(
            device_name,
            action.toLowerCase(),
            description || `${device_name} control command: ${action.toLowerCase()}`,
            new Date()
        );

        // Broadcast qua WebSocket
        webSocketManager.broadcastActionHistory({
            id: actionHistoryId,
            device_name,
            action: action.toLowerCase(),
            description: description || `${device_name} control command: ${action.toLowerCase()}`,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            topic: 'iot/led/control',
            message: `LED control command sent: ${action}`,
            data: {
                command,
                actionHistoryId,
                mqtt_published: true
            }
        });

    } catch (error) {
        console.error('Error controlling LED:', error);
        res.status(500).json({
            success: false,
            topic: 'iot/led/control',
            message: error.message
        });
    }
});

// POST /api/mqtt/led/control/batch - Gửi nhiều lệnh điều khiển cùng lúc
router.post('/control/batch', async (req, res) => {
    try {
        const { commands } = req.body;

        if (!Array.isArray(commands) || commands.length === 0) {
            return res.status(400).json({
                success: false,
                topic: 'iot/led/control',
                message: 'Commands array is required'
            });
        }

        const results = [];
        const actionHistoryIds = [];

        for (const cmd of commands) {
            const { action, device_name = 'LED', description } = cmd;

            if (!action || !['on', 'off'].includes(action.toLowerCase())) {
                results.push({
                    success: false,
                    device_name,
                    message: 'Invalid action. Must be "on" or "off"'
                });
                continue;
            }

            const command = {
                action: action.toLowerCase(),
                device_name,
                timestamp: new Date().toISOString(),
                command_id: `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            const published = mqttClient.publish('iot/led/control', command);
            
            if (published) {
                const actionHistoryId = await ActionHistory.create(
                    device_name,
                    action.toLowerCase(),
                    description || `${device_name} control command: ${action.toLowerCase()}`,
                    new Date()
                );

                actionHistoryIds.push(actionHistoryId);
                results.push({
                    success: true,
                    device_name,
                    action: action.toLowerCase(),
                    command_id: command.command_id
                });
            } else {
                results.push({
                    success: false,
                    device_name,
                    message: 'MQTT client not connected'
                });
            }
        }

        res.json({
            success: true,
            topic: 'iot/led/control',
            message: 'Batch LED control commands processed',
            data: {
                results,
                actionHistoryIds,
                total_commands: commands.length,
                successful_commands: results.filter(r => r.success).length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/control',
            message: error.message
        });
    }
});

// GET /api/mqtt/led/control/history - Lấy lịch sử lệnh điều khiển LED
router.get('/control/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const { device_name } = req.query;

        let actionHistory;
        if (device_name) {
            actionHistory = await ActionHistory.getByDevice(device_name, limit, offset);
        } else {
            actionHistory = await ActionHistory.getAll(limit, offset);
        }

        res.json({
            success: true,
            topic: 'iot/led/control',
            message: 'LED control history retrieved',
            data: actionHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            topic: 'iot/led/control',
            message: error.message
        });
    }
});

// GET /api/mqtt/led/control/status - Kiểm tra trạng thái MQTT và lệnh điều khiển
router.get('/control/status', (req, res) => {
    res.json({
        success: true,
        topic: 'iot/led/control',
        message: 'LED control status',
        data: {
            mqtt_connected: mqttClient.isClientConnected(),
            websocket_initialized: webSocketManager.isInitialized(),
            connected_clients: webSocketManager.getConnectedClientsCount(),
            topic: 'iot/led/control',
            direction: 'Backend → ESP32',
            last_check: new Date().toISOString()
        }
    });
});

// GET /api/mqtt/led/control/topic-info - Thông tin về MQTT topic
router.get('/control/topic-info', (req, res) => {
    res.json({
        success: true,
        topic: 'iot/led/control',
        description: 'Topic for sending LED control commands to ESP32',
        direction: 'Backend → ESP32',
        data_format: {
            action: 'string (on/off)',
            device_name: 'string',
            timestamp: 'ISO string',
            command_id: 'string'
        },
        example_command: {
            action: 'on',
            device_name: 'LED',
            timestamp: '2024-01-15T08:00:00Z',
            command_id: 'cmd_1705312800000'
        },
        mqtt_status: mqttClient.isClientConnected(),
        websocket_status: webSocketManager.isInitialized()
    });
});

module.exports = router;
