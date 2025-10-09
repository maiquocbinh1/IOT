const express = require('express');
const router = express.Router();
const SensorType = require('../models/SensorType');

// GET /api/sensor-types - Get all sensor types
router.get('/', async (req, res) => {
    try {
        const sensorTypes = await SensorType.getAll();
        res.json({
            success: true,
            data: sensorTypes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/sensor-types/:id - Get sensor type by ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor type ID'
            });
        }

        const sensorType = await SensorType.getById(id);
        if (!sensorType) {
            return res.status(404).json({
                success: false,
                message: 'Sensor type not found'
            });
        }

        res.json({
            success: true,
            data: sensorType
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/sensor-types - Create new sensor type
router.post('/', async (req, res) => {
    try {
        const { sensor_type_name } = req.body;

        if (!sensor_type_name || sensor_type_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Sensor type name is required'
            });
        }

        const id = await SensorType.create(sensor_type_name.trim());
        res.status(201).json({
            success: true,
            message: 'Sensor type created successfully',
            data: { id, sensor_type_name: sensor_type_name.trim() }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/sensor-types/:id - Update sensor type
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor type ID'
            });
        }

        const { sensor_type_name } = req.body;

        if (!sensor_type_name || sensor_type_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Sensor type name is required'
            });
        }

        const updated = await SensorType.update(id, sensor_type_name.trim());
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Sensor type not found'
            });
        }

        res.json({
            success: true,
            message: 'Sensor type updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /api/sensor-types/:id - Delete sensor type
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor type ID'
            });
        }

        const deleted = await SensorType.delete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Sensor type not found'
            });
        }

        res.json({
            success: true,
            message: 'Sensor type deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
