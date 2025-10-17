import React, { useState, useEffect } from 'react';
import './CurrentParameters.css';
import apiService from '../../services/api';
import webSocketService from '../../services/websocket';

const CurrentParameters = () => {
  const [sensorData, setSensorData] = useState({
    temperature: null,
    humidity: null,
    light: null,
    time: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [esp32Connected, setEsp32Connected] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch latest sensor data
        const response = await apiService.getLatestSensorData();
        
        console.log('CurrentParameters API Response:', response);
        
        if (response && response.temperature) {
          setSensorData({
            temperature: parseFloat(response.temperature).toFixed(1),
            humidity: parseInt(response.humidity),
            light: parseInt(response.light),
            time: new Date(response.time).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          });
        } else {
          // Use default data if no real data available
          setSensorData({
            temperature: 22.4,
            humidity: 48,
            light: 720,
            time: new Date().toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          });
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        // Use default data on error
        setSensorData({
          temperature: 22.4,
          humidity: 48,
          light: 720,
          time: new Date().toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    
    const interval = setInterval(async () => {
      // Only update sensor data if ESP32 is connected
      if (esp32Connected) {
        try {
          const response = await apiService.getLatestSensorData();
          if (response && response.temperature) {
            setSensorData({
              temperature: parseFloat(response.temperature).toFixed(1),
              humidity: parseInt(response.humidity),
              light: parseInt(response.light),
              time: new Date(response.time).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })
            });
          }
        } catch (error) {
          console.error('Error updating sensor data:', error);
        }
      } else {
        console.log('ESP32 disconnected - skipping sensor data update');
      }
    }, 5000); // Check every 5 seconds

    // WebSocket listeners with error handling
    let unsubscribeSensorData, unsubscribeConnection, unsubscribeDataStatus, unsubscribeMqttStatus;
    
    try {
      unsubscribeSensorData = webSocketService.on('sensorData', (newData) => {
        console.log('Received real-time sensor data:', newData);
        
        // Only update if ESP32 is connected
        if (esp32Connected && newData && newData.temperature) {
          setSensorData({
            temperature: parseFloat(newData.temperature).toFixed(1),
            humidity: parseInt(newData.humidity),
            light: parseInt(newData.light),
            time: new Date(newData.time).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          });
        } else {
          console.log('ESP32 disconnected - keeping current sensor data state');
        }
      });

      unsubscribeConnection = webSocketService.on('connection', (data) => {
        setWsConnected(data.status === 'connected');
      });

      unsubscribeDataStatus = webSocketService.on('dataStatus', (data) => {
        console.log('ESP32 Data Status:', data);
        setEsp32Connected(data.isConnected);
      });

      unsubscribeMqttStatus = webSocketService.on('mqttStatus', (data) => {
        console.log('MQTT Status:', data);
        // MQTT status can also indicate ESP32 connection
        if (data.isConnected) {
          setEsp32Connected(true);
        }
      });
    } catch (error) {
      console.error('Error setting up WebSocket listeners:', error);
    }

    return () => {
      clearInterval(interval);
      try {
        if (unsubscribeSensorData) unsubscribeSensorData();
        if (unsubscribeConnection) unsubscribeConnection();
        if (unsubscribeDataStatus) unsubscribeDataStatus();
        if (unsubscribeMqttStatus) unsubscribeMqttStatus();
      } catch (error) {
        console.error('Error cleaning up WebSocket listeners:', error);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="current-parameters">
        <h2 className="section-title">Current Parameters</h2>
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="current-parameters">
      <div className="section-header">
        <h2 className="section-title">Current Parameters</h2>
        <div className="connection-status">
          <div className={`status-indicator ${esp32Connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>{esp32Connected ? 'ESP32 Connected' : 'ESP32 Disconnected'}</span>
          </div>
        </div>
      </div>
      <div className="parameters-grid">
        <div className="parameter-card">
          <div className="parameter-icon">🌡️</div>
          <div className="parameter-content">
            <div className="parameter-value">{sensorData.temperature}°C</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">💧</div>
          <div className="parameter-content">
            <div className="parameter-value">{sensorData.humidity}%</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">☀️</div>
          <div className="parameter-content">
            <div className="parameter-value">{sensorData.light} nits</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentParameters;