
CREATE DATABASE IF NOT EXISTS iot_sensor_db;
USE iot_sensor_db;


DROP TABLE IF EXISTS sensor_data;
DROP TABLE IF EXISTS sensors;
DROP TABLE IF EXISTS sensor_type;
DROP TABLE IF EXISTS Location;


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


CREATE TABLE sensor_data (
    Reading_ID INT(10) AUTO_INCREMENT PRIMARY KEY,
    Sensor_ID INT(10) NOT NULL,
    Temperatue DECIMAL(5,2) NULL,
    Humidity DECIMAL(5,2) NULL,
    Light INT(10) NULL,
    Datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Sensor_ID) REFERENCES sensors(Sensor_ID) ON DELETE CASCADE
);


CREATE TABLE action_history (
    id INT(10) AUTO_INCREMENT PRIMARY KEY,
    device_name VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT NULL
);


CREATE INDEX idx_sensor_data_datetime ON sensor_data(Datetime);
CREATE INDEX idx_sensor_data_sensor_id ON sensor_data(Sensor_ID);
CREATE INDEX idx_sensors_location ON sensors(Location_ID);
CREATE INDEX idx_sensors_type ON sensors(Sensor_type_ID);
CREATE INDEX idx_action_history_timestamp ON action_history(timestamp);
CREATE INDEX idx_action_history_device ON action_history(device_name);
