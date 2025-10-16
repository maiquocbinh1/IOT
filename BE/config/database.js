const mysql = require('mysql2');
require('dotenv').config();

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'iot_sensor_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Create promise-based wrapper
const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const connection = await promisePool.getConnection();
        console.log('Database connected successfully');
        connection.release();
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        return false;
    }
};

// Initialize database
const initializeDatabase = async () => {
    try {
        // Test connection first
        const isConnected = await testConnection();
        if (!isConnected) {
            throw new Error('Cannot connect to database');
        }
        
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Database initialization failed:', error.message);
        return false;
    }
};

// Get connection for simple queries
const getConnection = () => {
    return pool;
};

module.exports = {
    pool: promisePool,
    testConnection,
    initializeDatabase,
    getConnection
};
