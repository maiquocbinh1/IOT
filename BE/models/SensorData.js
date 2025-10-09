const { pool } = require('../config/database');

/**
 * SensorData Model - Handles all sensor data operations
 */
class SensorData {
    static async getAll(limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    id,
                    temperature,
                    humidity,
                    light,
                    time
                FROM sensor_data
                ORDER BY time DESC
                LIMIT ${offset}, ${limit}
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error getting sensor data: ${error.message}`);
        }
    }

    static async getById(id) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    id,
                    temperature,
                    humidity,
                    light,
                    time
                FROM sensor_data
                WHERE id = ?
            `, [id]);
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error getting sensor data by ID: ${error.message}`);
        }
    }

    static async getLatest(limit = 1) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    id,
                    temperature,
                    humidity,
                    light,
                    time
                FROM sensor_data
                ORDER BY time DESC
                LIMIT ${limit}
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error getting latest sensor data: ${error.message}`);
        }
    }

    static async getByDateRange(startDate, endDate) {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    id,
                    temperature,
                    humidity,
                    light,
                    time
                FROM sensor_data
                WHERE time BETWEEN ? AND ?
                ORDER BY time DESC
            `, [startDate, endDate]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting sensor data by date range: ${error.message}`);
        }
    }

    static async getLatestForAllSensors() {
        try {
            const [rows] = await pool.execute(`
                SELECT 
                    id,
                    temperature,
                    humidity,
                    light,
                    time
                FROM sensor_data
                ORDER BY time DESC
                LIMIT 1
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error getting latest sensor data: ${error.message}`);
        }
    }

    static async create(temperature, humidity, light, datetime = null) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO sensor_data (temperature, humidity, light, time) VALUES (?, ?, ?, ?)',
                [temperature, humidity, light, datetime || new Date()]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error creating sensor data: ${error.message}`);
        }
    }

    static async update(id, temperature, humidity, light, datetime) {
        try {
            const [result] = await pool.execute(
                'UPDATE sensor_data SET temperature = ?, humidity = ?, light = ?, time = ? WHERE id = ?',
                [temperature, humidity, light, datetime, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating sensor data: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM sensor_data WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting sensor data: ${error.message}`);
        }
    }

    static async getTotalCount() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as count FROM sensor_data');
            return rows[0].count;
        } catch (error) {
            throw new Error(`Error getting sensor data count: ${error.message}`);
        }
    }

    static async getStatistics(startDate = null, endDate = null) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_readings,
                    AVG(temperature) as avg_temperature,
                    MIN(temperature) as min_temperature,
                    MAX(temperature) as max_temperature,
                    AVG(humidity) as avg_humidity,
                    MIN(humidity) as min_humidity,
                    MAX(humidity) as max_humidity,
                    AVG(light) as avg_light,
                    MIN(light) as min_light,
                    MAX(light) as max_light
                FROM sensor_data 
            `;
            let params = [];

            if (startDate && endDate) {
                query += ' WHERE time BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            const [rows] = await pool.execute(query, params);
            return rows[0];
        } catch (error) {
            throw new Error(`Error getting sensor statistics: ${error.message}`);
        }
    }
}

module.exports = SensorData;
