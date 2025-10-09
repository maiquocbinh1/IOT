const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// GET /api/locations - Get all locations
router.get('/', async (req, res) => {
    try {
        const locations = await Location.getAll();
        res.json({
            success: true,
            data: locations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET /api/locations/:id - Get location by ID
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }

        const location = await Location.getById(id);
        if (!location) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.json({
            success: true,
            data: location
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST /api/locations - Create new location
router.post('/', async (req, res) => {
    try {
        const { location_name } = req.body;

        if (!location_name || location_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Location name is required'
            });
        }

        const id = await Location.create(location_name.trim());
        res.status(201).json({
            success: true,
            message: 'Location created successfully',
            data: { id, location_name: location_name.trim() }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// PUT /api/locations/:id - Update location
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }

        const { location_name } = req.body;

        if (!location_name || location_name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Location name is required'
            });
        }

        const updated = await Location.update(id, location_name.trim());
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.json({
            success: true,
            message: 'Location updated successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE /api/locations/:id - Delete location
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location ID'
            });
        }

        const deleted = await Location.delete(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Location not found'
            });
        }

        res.json({
            success: true,
            message: 'Location deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
