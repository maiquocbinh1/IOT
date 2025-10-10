const express = require('express');
const router = express.Router();
const ActionHistory = require('../models/ActionHistory');



router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        
        // Get filter parameters
        const { search, device, time, sortField, sortDirection, filterType } = req.query;
        
        // Build filter conditions
        let whereConditions = [];
        let queryParams = [];
        
        if (search) {
            // Exact match search
            whereConditions.push(`(id = ? OR device_name = ? OR action = ? OR description = ? OR timestamp = ?)`);
            queryParams.push(search, search, search, search, search);
        }
        
        if (device && device !== 'ALL') {
            whereConditions.push(`device_name = ?`);
            queryParams.push(device);
        }
        
        if (time) {
            whereConditions.push(`timestamp >= ?`);
            queryParams.push(new Date(time));
        }
        
        // Build WHERE clause
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        // Build ORDER BY clause
        let orderBy = 'ORDER BY timestamp DESC';
        if (sortField && sortDirection) {
            orderBy = `ORDER BY ${sortField} ${sortDirection.toUpperCase()}`;
        }
        
        // Get filtered data
        const actionHistory = await ActionHistory.getFiltered(whereClause, queryParams, limit, offset);
        const totalCount = await ActionHistory.getFilteredCount(whereClause, queryParams);
        const totalPages = Math.ceil(totalCount / limit);
        
        res.json({
            success: true,
            data: actionHistory,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Error fetching action history:', error);
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
                message: 'Invalid action history ID'
            });
        }

        const actionHistory = await ActionHistory.getById(id);
        if (!actionHistory) {
            return res.status(404).json({
                success: false,
                message: 'Action history not found'
            });
        }

        res.json({
            success: true,
            data: actionHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/device/:deviceName', async (req, res) => {
    try {
        const { deviceName } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const actionHistory = await ActionHistory.getByDevice(deviceName, limit, offset);
        res.json({
            success: true,
            data: actionHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/action/:action', async (req, res) => {
    try {
        const { action } = req.params;
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        const actionHistory = await ActionHistory.getByAction(action, limit, offset);
        res.json({
            success: true,
            data: actionHistory
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
        const { startDate, endDate, deviceName } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const actionHistory = await ActionHistory.getByDateRange(startDate, endDate, deviceName);
        res.json({
            success: true,
            data: actionHistory
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
        const actionHistory = await ActionHistory.getLatestForAllDevices();
        res.json({
            success: true,
            data: actionHistory
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
        const { device_name, action, description, timestamp } = req.body;

        if (!device_name || !action) {
            return res.status(400).json({
                success: false,
                message: 'Device name and action are required'
            });
        }

        const id = await ActionHistory.create(
            device_name.trim(), 
            action.trim(), 
            description || null, 
            timestamp || null
        );

        res.status(201).json({
            success: true,
            message: 'Action history created successfully',
            data: { id, device_name: device_name.trim(), action: action.trim(), description, timestamp }
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
                message: 'Invalid action history ID'
            });
        }

        const { device_name, action, description, timestamp } = req.body;

        if (!device_name || !action) {
            return res.status(400).json({
                success: false,
                message: 'Device name and action are required'
            });
        }

        const updated = await ActionHistory.update(id, device_name.trim(), action.trim(), description, timestamp);
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Action history not found'
            });
        }

        res.json({
            success: true,
            message: 'Action history updated successfully'
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
                message: 'Invalid action history ID'
            });
        }

        const deleted = await ActionHistory.delete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Action history not found'
            });
        }

        res.json({
            success: true,
            message: 'Action history deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get('/statistics', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const statistics = await ActionHistory.getStatistics(startDate, endDate);
        
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

router.get('/usage-summary', async (req, res) => {
    try {
        const { deviceName } = req.query;
        const summary = await ActionHistory.getDeviceUsageSummary(deviceName);
        
        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;