const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');

/**
 * Sensor Data Routes - API endpoints for sensor data management
 */

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get filter parameters
        const { search, temperature, humidity, light, time, timeStart, timeEnd, sortField, sortDirection, filterType } = req.query;
        
        // Build filter conditions
        let whereConditions = [];
        let queryParams = [];
        
        if (search) {
            // Exact match search instead of LIKE
            whereConditions.push(`(id = ? OR temperature = ? OR humidity = ? OR light = ? OR time = ?)`);
            queryParams.push(search, parseFloat(search) || search, parseInt(search) || search, parseInt(search) || search, search);
        }
        
        if (temperature) {
            whereConditions.push(`temperature >= ?`);
            queryParams.push(parseFloat(temperature));
        }
        
        if (humidity) {
            whereConditions.push(`humidity >= ?`);
            queryParams.push(parseInt(humidity));
        }
        
        if (light) {
            whereConditions.push(`light >= ?`);
            queryParams.push(parseInt(light));
        }
        
        if (time) {
            whereConditions.push(`time >= ?`);
            queryParams.push(new Date(time));
        }
        
        if (timeStart) {
            whereConditions.push(`time >= ?`);
            queryParams.push(new Date(timeStart));
        }
        
        if (timeEnd) {
            whereConditions.push(`time <= ?`);
            queryParams.push(new Date(timeEnd));
        }
        
        // Build WHERE clause
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Build ORDER BY clause
        let orderBy = 'ORDER BY time DESC';
        if (sortField && sortDirection) {
            orderBy = `ORDER BY ${sortField} ${sortDirection.toUpperCase()}`;
        }
        
        // Get filtered data
        const sensorData = await SensorData.getFiltered(whereClause, queryParams, limit, offset);
        const totalCount = await SensorData.getFilteredCount(whereClause, queryParams);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.json({
            success: true,
            data: sensorData,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Error fetching sensor data:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reading ID'
            });
        }

        const sensorData = await SensorData.getById(id);
        if (!sensorData) {
            return res.status(404).json({
                success: false,
                message: 'Sensor data not found'
            });
        }

        res.json({
            success: true,
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/latest/all', async (req, res) => {
    try {
        const sensorData = await SensorData.getLatestForAllSensors();
        res.json({
            success: true,
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/date-range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const sensorData = await SensorData.getByDateRange(startDate, endDate);
        res.json({
            success: true,
            data: sensorData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const { temperature, humidity, light, datetime } = req.body;
        const id = await SensorData.create(
            temperature || null, 
            humidity || null, 
            light || null, 
            datetime || null
        );
        res.status(201).json({
            success: true,
            message: 'Sensor data created successfully',
            data: { id, temperature, humidity, light, datetime }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reading ID'
            });
        }

        const { temperature, humidity, light, datetime } = req.body;
        const updated = await SensorData.update(id, temperature, humidity, light, datetime);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Sensor data not found'
            });
        }

        res.json({
            success: true,
            message: 'Sensor data updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reading ID'
            });
        }

        const deleted = await SensorData.delete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Sensor data not found'
            });
        }

        res.json({
            success: true,
            message: 'Sensor data deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/statistics/overview', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const statistics = await SensorData.getStatistics(startDate, endDate);
        
        res.json({
            success: true,
            data: statistics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;