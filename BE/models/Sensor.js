const { pool } = require('../config/database');

class Sensor {
    // Get all sensors with type and location information
    static async getAll() {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    s.Sensor_ID,
                    s.Sensor_type_ID,
                    s.Location_ID,
                    st.Sensor_type_name,
                    l.Location_name
                FROM sensors s
                JOIN sensor_type st ON s.Sensor_type_ID = st.Sensor_type_ID
                JOIN Location l ON s.Location_ID = l.Location_ID
                ORDER BY s.Sensor_ID
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error getting sensors: ${error.message}`);
        }
    }

    // Get sensor by ID with type and location information
    static async getById(id) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    s.Sensor_ID,
                    s.Sensor_type_ID,
                    s.Location_ID,
                    st.Sensor_type_name,
                    l.Location_name
                FROM sensors s
                JOIN sensor_type st ON s.Sensor_type_ID = st.Sensor_type_ID
                JOIN Location l ON s.Location_ID = l.Location_ID
                WHERE s.Sensor_ID = ?
            `, [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error getting sensor by ID: ${error.message}`);
        }
    }

    // Get sensors by location
    static async getByLocation(locationId) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    s.Sensor_ID,
                    s.Sensor_type_ID,
                    s.Location_ID,
                    st.Sensor_type_name,
                    l.Location_name
                FROM sensors s
                JOIN sensor_type st ON s.Sensor_type_ID = st.Sensor_type_ID
                JOIN Location l ON s.Location_ID = l.Location_ID
                WHERE s.Location_ID = ?
                ORDER BY s.Sensor_ID
            `, [locationId]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting sensors by location: ${error.message}`);
        }
    }

    // Get sensors by type
    static async getByType(sensorTypeId) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    s.Sensor_ID,
                    s.Sensor_type_ID,
                    s.Location_ID,
                    st.Sensor_type_name,
                    l.Location_name
                FROM sensors s
                JOIN sensor_type st ON s.Sensor_type_ID = st.Sensor_type_ID
                JOIN Location l ON s.Location_ID = l.Location_ID
                WHERE s.Sensor_type_ID = ?
                ORDER BY s.Sensor_ID
            `, [sensorTypeId]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting sensors by type: ${error.message}`);
        }
    }

    // Create new sensor
    static async create(sensorTypeId, locationId) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO sensors (Sensor_type_ID, Location_ID) VALUES (?, ?)',
                [sensorTypeId, locationId]
            );
            return result.insertId;
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('Invalid sensor type ID or location ID');
            }
            throw new Error(`Error creating sensor: ${error.message}`);
        }
    }

    // Update sensor
    static async update(id, sensorTypeId, locationId) {
        try {
            const [result] = await pool.execute(
                'UPDATE sensors SET Sensor_type_ID = ?, Location_ID = ? WHERE Sensor_ID = ?',
                [sensorTypeId, locationId, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            if (error.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new Error('Invalid sensor type ID or location ID');
            }
            throw new Error(`Error updating sensor: ${error.message}`);
        }
    }

    // Delete sensor
    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sensors WHERE Sensor_ID = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting sensor: ${error.message}`);
        }
    }
}

module.exports = Sensor;
