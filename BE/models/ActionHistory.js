const { pool } = require('../config/database');

/**
 * ActionHistory Model - Handles all action history operations
 */
class ActionHistory {
    static async getAll(limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM action_history 
                ORDER BY timestamp DESC 
                LIMIT ${offset}, ${limit}
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error getting action history: ${error.message}`);
        }
    }

    static async getFiltered(whereClause, queryParams, limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM action_history
                ${whereClause}
                ORDER BY timestamp DESC
                LIMIT ${offset}, ${limit}
            `, queryParams);
            return rows;
        } catch (error) {
            throw new Error(`Error getting filtered action history: ${error.message}`);
        }
    }

    static async getFilteredCount(whereClause, queryParams) {
        try {
            const [rows] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM action_history
                ${whereClause}
            `, queryParams);
            return rows[0].count;
        } catch (error) {
            throw new Error(`Error getting filtered count: ${error.message}`);
        }
    }

    static async getById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM action_history WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            throw new Error(`Error getting action history by ID: ${error.message}`);
        }
    }

    static async getByDevice(deviceName, limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM action_history 
                WHERE device_name = ? 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            `, [deviceName, limit, offset]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting action history by device: ${error.message}`);
        }
    }

    static async getByAction(action, limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM action_history 
                WHERE action = ? 
                ORDER BY timestamp DESC 
                LIMIT ? OFFSET ?
            `, [action, limit, offset]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting action history by action: ${error.message}`);
        }
    }

    static async getByDateRange(startDate, endDate, deviceName = null) {
        try {
            let query = `
                SELECT * FROM action_history 
                WHERE timestamp BETWEEN ? AND ?
            `;
            let params = [startDate, endDate];

            if (deviceName) {
                query += ' AND device_name = ?';
                params.push(deviceName);
            }

            query += ' ORDER BY timestamp DESC';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting action history by date range: ${error.message}`);
        }
    }

    static async getLatestForAllDevices() {
        try {
            const [rows] = await pool.execute(`
                SELECT * FROM action_history 
                WHERE timestamp = (
                    SELECT MAX(ah2.timestamp) 
                    FROM action_history ah2 
                    WHERE ah2.device_name = action_history.device_name
                )
                ORDER BY device_name
            `);
            return rows;
        } catch (error) {
            throw new Error(`Error getting latest action history: ${error.message}`);
        }
    }

    static async create(deviceName, action, description = null, timestamp = null) {
        try {
            const [result] = await pool.execute(
                'INSERT INTO action_history (device_name, action, description, timestamp) VALUES (?, ?, ?, ?)',
                [deviceName, action, description, timestamp || new Date()]
            );
            return result.insertId;
        } catch (error) {
            throw new Error(`Error creating action history: ${error.message}`);
        }
    }

    static async update(id, deviceName, action, description, timestamp) {
        try {
            const [result] = await pool.execute(
                'UPDATE action_history SET device_name = ?, action = ?, description = ?, timestamp = ? WHERE id = ?',
                [deviceName, action, description, timestamp, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating action history: ${error.message}`);
        }
    }

    static async delete(id) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM action_history WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting action history: ${error.message}`);
        }
    }

    static async getTotalCount() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as count FROM action_history');
            return rows[0].count;
        } catch (error) {
            throw new Error(`Error getting action history count: ${error.message}`);
        }
    }

    static async getStatistics(startDate = null, endDate = null) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total_actions,
                    COUNT(DISTINCT device_name) as unique_devices,
                    COUNT(CASE WHEN action = 'on' THEN 1 END) as turn_on_count,
                    COUNT(CASE WHEN action = 'off' THEN 1 END) as turn_off_count
                FROM action_history
            `;
            let params = [];

            if (startDate && endDate) {
                query += ' WHERE timestamp BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            const [rows] = await pool.execute(query, params);
            return rows[0];
        } catch (error) {
            throw new Error(`Error getting action history statistics: ${error.message}`);
        }
    }

    static async getDeviceUsageSummary(deviceName = null) {
        try {
            let query = `
                SELECT 
                    device_name,
                    COUNT(*) as total_actions,
                    COUNT(CASE WHEN action = 'on' THEN 1 END) as turn_on_count,
                    COUNT(CASE WHEN action = 'off' THEN 1 END) as turn_off_count,
                    MAX(timestamp) as last_action_time
                FROM action_history
            `;
            let params = [];

            if (deviceName) {
                query += ' WHERE device_name = ?';
                params.push(deviceName);
            }

            query += ' GROUP BY device_name ORDER BY total_actions DESC';

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting device usage summary: ${error.message}`);
        }
    }
}

module.exports = ActionHistory;
