const { pool } = require('../config/database');

class Location {
    // Get all locations
    static async getAll() {
        try {
            const [rows] = await pool.execute('SELECT * FROM Location ORDER BY Location_ID');
            return rows;
        } catch (error) {
            throw new Error(`Error getting locations: ${error.message}`);
        }
    }

    // Get location by ID
    static async getById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM Location WHERE Location_ID = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error getting location by ID: ${error.message}`);
        }
    }

    // Create new location
    static async create(locationName) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO Location (Location_name) VALUES (?)',
                [locationName]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Location name already exists');
            }
            throw new Error(`Error creating location: ${error.message}`);
        }
    }

    // Update location
    static async update(id, locationName) {
        try {
            const [result] = await pool.execute(
                'UPDATE Location SET Location_name = ? WHERE Location_ID = ?',
                [locationName, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Location name already exists');
            }
            throw new Error(`Error updating location: ${error.message}`);
        }
    }

    // Delete location
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM Location WHERE Location_ID = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('Cannot delete location: it is being used by sensors');
            }
            throw new Error(`Error deleting location: ${error.message}`);
        }
    }
}

module.exports = Location;
