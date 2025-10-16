const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import configurations
const { initializeDatabase, getConnection } = require('./config/database');

// Create Express app
const app = express();

// Lấy kết nối database
const connection = getConnection();

// Middleware
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3000"
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// API 


// 1. API lấy dữ liệu cảm biến mới nhất
app.get('/api/sensor-data', (req, res) => {
    const query = `
        SELECT temperature, humidity, light
        FROM stream_data
        ORDER BY time DESC
        LIMIT 1
    `;

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching data from database');
        }
        res.json(results[0]); // Trả về hàng đầu tiên (mới nhất)
    });
});

// 2. API điều khiển đèn và lưu lịch sử
app.post('/api/control', (req, res) => {
    console.log('Request body:', req.body); // log để kiểm tra

    const { deviceName, action } = req.body;
    console.log(`Device: ${deviceName}, Action: ${action}`);

    if (!deviceName || !action) {
        return res.status(400).json({ error: 'deviceName and action are required' });
    }

    const query = `
        INSERT INTO device_history (device_name, action, timestamp, description)
        VALUES (?, ?, NOW(), ?)
    `;
    const description = `Turned ${action.toLowerCase()} the ${deviceName}`;

    connection.query(query, [deviceName, action, description], (err) => {
        if (err) {
            console.error('Error inserting action into database:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ success: true, message: `Action ${action} sent to ${deviceName}` });
    });
});

// 3. API tìm kiếm phân trang Data
app.get('/api/data/history', (req, res) => {
    const page         = parseInt(req.query.page)  || 1;
    const limit        = parseInt(req.query.limit) || 5;
    const offset       = (page - 1) * limit;
    const filterType   = req.query.filterType;
    const searchQuery  = req.query.searchQuery;
    const sortColumn   = req.query.sortColumn;
    const sortDirection= req.query.sortDirection || 'asc';

    let baseQuery   = 'SELECT id, temperature, light, humidity, time FROM stream_data';
    let countQuery  = 'SELECT COUNT(*) as total FROM stream_data';
    let whereClause = '';
    let params      = [];

    // Add search filtering if provided
    if (searchQuery && filterType && filterType !== 'all') {
        whereClause = ` WHERE ${filterType} LIKE ?`;
        params.push(`%${searchQuery}%`);
    }

    // Add sorting
    let orderClause = ' ORDER BY time DESC';
    if (sortColumn) {
        orderClause = ` ORDER BY ${sortColumn} ${sortDirection}`;
    }

    baseQuery  += whereClause + orderClause + ' LIMIT ? OFFSET ?';
    countQuery += whereClause;

    // Add pagination parameters
    params.push(limit, offset);

    connection.query(countQuery, params.slice(0, -2), (err, countResults) => {
        if (err) {
            console.error('Error executing count query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        connection.query(baseQuery, params, (err, results) => {
            if (err) {
                console.error('Error executing data query:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            res.json({
                data: results,
                pagination: {
                    total: countResults[0].total,
                    currentPage: page,
                    totalPages: Math.ceil(countResults[0].total / limit),
                    limit
                }
            });
        });
    });
});

// 4. API tìm kiếm và phân trang History
app.get('/api/actions/history', (req, res) => {
    const page         = parseInt(req.query.page)  || 1;
    const limit        = parseInt(req.query.limit) || 5;
    const offset       = (page - 1) * limit;
    const filterType   = req.query.filterType;
    const searchQuery  = req.query.searchQuery;
    const sortColumn   = req.query.sortColumn   || 'timestamp';
    const sortDirection= req.query.sortDirection|| 'desc';

    let baseQuery   = 'SELECT id, device_name, action, timestamp FROM device_history';
    let countQuery  = 'SELECT COUNT(*) as total FROM device_history';
    let whereClause = '';
    let params      = [];

    // Add search filtering if provided
    if (searchQuery && filterType && filterType !== 'all') {
        if (filterType === 'timestamp') {
            whereClause = ' WHERE DATE_FORMAT(timestamp, \'%Y-%m-%d %H:%i:%s\') LIKE ?';
        } else {
            whereClause = ` WHERE ${filterType} LIKE ?`;
        }
        params.push(`%${searchQuery}%`);
    }

    // Add sorting
    baseQuery  += whereClause + ` ORDER BY ${sortColumn} ${sortDirection} LIMIT ? OFFSET ?`;
    countQuery += whereClause;

    // Add pagination parameters
    params.push(limit, offset);

    // Execute count query first
    connection.query(countQuery, params.slice(0, -2), (err, countResults) => {
        if (err) {
            console.error('Error executing count query:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Then execute data query
        connection.query(baseQuery, params, (err, results) => {
            if (err) {
                console.error('Error executing data query:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }

            res.json({
                data: results,
                pagination: {
                    total: countResults[0].total,
                    currentPage: page,
                    totalPages: Math.ceil(countResults[0].total / limit),
                    limit
                }
            });
        });
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

const initializeServer = async () => {
    try {
        console.log('Khởi tạo IoT Backend Server...');

        const dbInitialized = await initializeDatabase();
        if (!dbInitialized) {
            throw new Error('Failed to initialize database');
        }

        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server đang chạy trên port ${PORT}`);
            console.log(`API base URL: http://localhost:${PORT}/api`);
            console.log('');
            console.log('CÁC API CÓ SẴN:');
            console.log('   GET  /api/sensor-data     - API lấy dữ liệu cảm biến mới nhất');
            console.log('   POST /api/control         - API điều khiển đèn và lưu lịch sử');
            console.log('   GET  /api/data/history    - API tìm kiếm phân trang Data');
            console.log('   GET  /api/actions/history - API tìm kiếm và phân trang History');
        });

    } catch (error) {
        console.error('Không thể khởi tạo server:', error);
        process.exit(1);
    }
};

const gracefulShutdown = () => {
    console.log('Nhận tín hiệu tắt server, đang đóng server một cách an toàn...');
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});

initializeServer();

module.exports = app;