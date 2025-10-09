const { pool } = require('../config/database');

class SensorType {
    // Get all sensor types
    static async getAll() {
        try {
            const [rows] = await pool.execute('SELECT * FROM sensor_type ORDER BY Sensor_type_ID');
            return rows;
        } catch (error) {
            throw new Error(`Error getting sensor types: ${error.message}`);
        }
    }

    // Get sensor type by ID
    static async getById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM sensor_type WHERE Sensor_type_ID = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error getting sensor type by ID: ${error.message}`);
        }
    }

    // Create new sensor type
    static async create(sensorTypeName) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO sensor_type (Sensor_type_name) VALUES (?)',
                [sensorTypeName]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Sensor type name already exists');
            }
            throw new Error(`Error creating sensor type: ${error.message}`);
        }
    }

    // Update sensor type
    static async update(id, sensorTypeName) {
        try {
            const [result] = await pool.execute(
                'UPDATE sensor_type SET Sensor_type_name = ? WHERE Sensor_type_ID = ?',
                [sensorTypeName, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Sensor type name already exists');
            }
            throw new Error(`Error updating sensor type: ${error.message}`);
        }
    }

    // Delete sensor type
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sensor_type WHERE Sensor_type_ID = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new Error('Cannot delete sensor type: it is being used by sensors');
            }
            throw new Error(`Error deleting sensor type: ${error.message}`);
        }
    }
}

module.exports = SensorType;
