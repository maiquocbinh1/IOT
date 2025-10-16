CREATE DATABASE IF NOT EXISTS iot_sensor_db;
USE iot_sensor_db;

-- Drop existing tables
DROP TABLE IF EXISTS stream_data;
DROP TABLE IF EXISTS device_history;

-- Create stream_data table (for sensor data)
CREATE TABLE stream_data (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2) NULL,
    light INT(10) NULL,
    humidity INT(10) NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create device_history table (for device control history)
CREATE TABLE device_history (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_stream_data_time ON stream_data(time);
CREATE INDEX idx_device_history_timestamp ON device_history(timestamp);
CREATE INDEX idx_device_history_device ON device_history(device_name);

-- Insert sample data
INSERT INTO stream_data (temperature, humidity, light) VALUES 
(25.5, 60, 300),
(26.0, 65, 280),
(24.8, 58, 320);

INSERT INTO device_history (device_name, action, description) VALUES 
('LED1', 'on', 'Turned on the LED1'),
('LED2', 'off', 'Turned off the LED2'),
('FAN1', 'on', 'Turned on the FAN1');
