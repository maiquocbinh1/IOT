const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Database configuration without database name first
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
};

async function setupDatabase() {
    console.log('🚀 Setting up IoT Database...\n');

    try {
        // Connect to MySQL without specifying database
        const connection = mysql.createConnection(dbConfig);
        
        console.log('1. Connecting to MySQL server...');
        await connection.promise().connect();
        console.log('✅ Connected to MySQL server\n');

        // Read schema file
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('2. Creating database and tables...');
        await connection.promise().query(schema);
        console.log('✅ Database and tables created successfully\n');

        // Test the database
        console.log('3. Testing database connection...');
        const [rows] = await connection.promise().query('SELECT COUNT(*) as count FROM sensor_data');
        console.log(`✅ Database test successful - sensor_data table has ${rows[0].count} records\n`);

        // Insert sample data
        console.log('4. Inserting sample data...');
        const sampleData = [
            [25.5, 65.2, 450, new Date()],
            [26.1, 67.8, 380, new Date(Date.now() - 300000)], // 5 minutes ago
            [24.8, 63.5, 520, new Date(Date.now() - 600000)], // 10 minutes ago
            [27.2, 70.1, 340, new Date(Date.now() - 900000)], // 15 minutes ago
            [25.9, 66.3, 480, new Date(Date.now() - 1200000)] // 20 minutes ago
        ];

        for (const data of sampleData) {
            await connection.promise().query(
                'INSERT INTO sensor_data (temperature, humidity, light, time) VALUES (?, ?, ?, ?)',
                data
            );
        }
        console.log('✅ Sample data inserted successfully\n');

        // Insert sample action history
        const sampleActions = [
            ['Fan', 'on', 'Fan turned on via setup', new Date()],
            ['Air Conditioner', 'off', 'AC turned off via setup', new Date()],
            ['Light', 'on', 'Light turned on via setup', new Date()]
        ];

        for (const action of sampleActions) {
            await connection.promise().query(
                'INSERT INTO action_history (device_name, action, description, timestamp) VALUES (?, ?, ?, ?)',
                action
            );
        }
        console.log('✅ Sample action history inserted successfully\n');

        await connection.promise().end();
        
        console.log('🎉 Database setup completed successfully!');
        console.log('📊 Your IoT database is ready with sample data.');
        console.log('🔗 You can now start the backend server.');

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        console.error('💡 Make sure:');
        console.error('   1. MySQL server is running');
        console.error('   2. MySQL credentials are correct in .env file');
        console.error('   3. You have permission to create databases');
        process.exit(1);
    }
}

// Run the setup
setupDatabase();
