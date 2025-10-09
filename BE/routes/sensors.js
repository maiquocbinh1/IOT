const express = require('express');
const router = express.Router();
const Sensor = require('../models/Sensor');

// GET /api/sensors - Get all sensors
router.get('/', async (req, res) => {
    try {
        const sensors = await Sensor.getAll();
        res.json({
            success: true,
            data: sensors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/sensors/:id - Get sensor by ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor ID'
            });
        }

        const sensor = await Sensor.getById(id);
        if (!sensor) {
            return res.status(404).json({
                success: false,
                message: 'Sensor not found'
            });
        }

        res.json({
            success: true,
            data: sensor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/sensors/location/:locationId - Get sensors by location
router.get('/location/:locationId', async (req, res) => {
    try {
        const locationId = parseInt(req.params.locationId);
        if (isNaN(locationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }

        const sensors = await Sensor.getByLocation(locationId);
        res.json({
            success: true,
            data: sensors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/sensors/type/:typeId - Get sensors by type
router.get('/type/:typeId', async (req, res) => {
    try {
        const typeId = parseInt(req.params.typeId);
        if (isNaN(typeId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor type ID'
            });
        }

        const sensors = await Sensor.getByType(typeId);
        res.json({
            success: true,
            data: sensors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/sensors - Create new sensor
router.post('/', async (req, res) => {
    try {
        const { sensor_type_id, location_id } = req.body;

        if (!sensor_type_id || !location_id) {
            return res.status(400).json({
                success: false,
                message: 'Sensor type ID and location ID are required'
            });
        }

        const sensorTypeId = parseInt(sensor_type_id);
        const locationId = parseInt(location_id);

        if (isNaN(sensorTypeId) || isNaN(locationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor type ID or location ID'
            });
        }

        const id = await Sensor.create(sensorTypeId, locationId);
        res.status(201).json({
            success: true,
            message: 'Sensor created successfully',
            data: { id, sensor_type_id: sensorTypeId, location_id: locationId }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/sensors/:id - Update sensor
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor ID'
            });
        }

        const { sensor_type_id, location_id } = req.body;

        if (!sensor_type_id || !location_id) {
            return res.status(400).json({
                success: false,
                message: 'Sensor type ID and location ID are required'
            });
        }

        const sensorTypeId = parseInt(sensor_type_id);
        const locationId = parseInt(location_id);

        if (isNaN(sensorTypeId) || isNaN(locationId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor type ID or location ID'
            });
        }

        const updated = await Sensor.update(id, sensorTypeId, locationId);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Sensor not found'
            });
        }

        res.json({
            success: true,
            message: 'Sensor updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /api/sensors/:id - Delete sensor
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sensor ID'
            });
        }

        const deleted = await Sensor.delete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Sensor not found'
            });
        }

        res.json({
            success: true,
            message: 'Sensor deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
