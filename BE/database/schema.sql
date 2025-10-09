
CREATE DATABASE IF NOT EXISTS iot_sensor_db;
USE iot_sensor_db;

<<<<<<< HEAD
-- Drop existing tables
=======

>>>>>>> 51160c14b820b69f6d021be94b5a6495bbd17280
DROP TABLE IF EXISTS sensor_data;
DROP TABLE IF EXISTS action_history;

<<<<<<< HEAD
-- Create sensor_data table (for iot/sensor/data topic)
=======

CREATE TABLE sensor_type (
    Sensor_type_ID INT(10) AUTO_INCREMENT PRIMARY KEY,
    Sensor_type_name VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE Location (
    Location_ID INT(10) AUTO_INCREMENT PRIMARY KEY,
    Location_name VARCHAR(50) NOT NULL UNIQUE
);


CREATE TABLE sensors (
    Sensor_ID INT(10) AUTO_INCREMENT PRIMARY KEY,
    Sensor_type_ID INT(10) NOT NULL,
    Location_ID INT(10) NOT NULL,
    FOREIGN KEY (Sensor_type_ID) REFERENCES sensor_type(Sensor_type_ID) ON DELETE CASCADE,
    FOREIGN KEY (Location_ID) REFERENCES Location(Location_ID) ON DELETE CASCADE
);


>>>>>>> 51160c14b820b69f6d021be94b5a6495bbd17280
CREATE TABLE sensor_data (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2) NULL,
    light INT(10) NULL,
    humidity INT(10) NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

<<<<<<< HEAD
-- Create action_history table (for iot/led/control and iot/led/status topics)
=======

>>>>>>> 51160c14b820b69f6d021be94b5a6495bbd17280
CREATE TABLE action_history (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NULL
);

<<<<<<< HEAD


-- Create indexes for better performance
CREATE INDEX idx_sensor_data_time ON sensor_data(time);
=======

CREATE INDEX idx_sensor_data_datetime ON sensor_data(Datetime);
CREATE INDEX idx_sensor_data_sensor_id ON sensor_data(Sensor_ID);
CREATE INDEX idx_sensors_location ON sensors(Location_ID);
CREATE INDEX idx_sensors_type ON sensors(Sensor_type_ID);
>>>>>>> 51160c14b820b69f6d021be94b5a6495bbd17280
CREATE INDEX idx_action_history_timestamp ON action_history(timestamp);
CREATE INDEX idx_action_history_device ON action_history(device_name);
