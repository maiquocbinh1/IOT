CREATE DATABASE IF NOT EXISTS iot_sensor_db;
USE iot_sensor_db;

-- Drop existing tables
DROP TABLE IF EXISTS sensor_data;
DROP TABLE IF EXISTS action_history;

-- Create sensor_data table 
CREATE TABLE sensor_data (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2) NULL,
    light INT(10) NULL,
    humidity INT(10) NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create action_history table 
CREATE TABLE action_history (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NULL
);

CREATE INDEX idx_sensor_data_time ON sensor_data(time);
CREATE INDEX idx_action_history_timestamp ON action_history(timestamp);
CREATE INDEX idx_action_history_device ON action_history(device_name);
