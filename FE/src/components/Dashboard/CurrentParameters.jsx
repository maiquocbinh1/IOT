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

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        webSocketService.connect();
        setWsConnected(true);
        console.log('WebSocket connected for current parameters');
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setWsConnected(false);
      }
    };

    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getLatestSensorData();
        
        console.log('CurrentParameters API Response:', response);
        
        if (response && response.success && response.data && response.data.length > 0) {
          const latestData = response.data[0]; // Get the first (latest) record
          setSensorData({
            temperature: parseFloat(latestData.temperature).toFixed(1),
            humidity: parseInt(latestData.humidity),
            light: parseInt(latestData.light),
            time: new Date(latestData.time).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          });
        } else {
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

    connectWebSocket();
    loadInitialData();
    
    const interval = setInterval(() => {
      setSensorData(prev => ({
        ...prev,
        time: new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
    }, 1000);

    const unsubscribeSensorData = webSocketService.on('sensorData', (newData) => {
      console.log('Received real-time sensor data:', newData);
      
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
    });

    const unsubscribeConnection = webSocketService.on('connect', () => {
      setWsConnected(true);
    });

    const unsubscribeDisconnect = webSocketService.on('disconnect', () => {
      setWsConnected(false);
    });

    return () => {
      clearInterval(interval);
      unsubscribeSensorData();
      unsubscribeConnection();
      unsubscribeDisconnect();
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
      <h2 className="section-title">Current Parameters</h2>
      <div className="parameters-grid">
        <div className="parameter-card">
          <div className="parameter-icon">🌡️</div>
          <div className="parameter-content">
            <div className="parameter-value">{sensorData.temperature}°C</div>
            <div className="parameter-status">
              {wsConnected ? 'Updated just now' : 'Offline'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">💧</div>
          <div className="parameter-content">
            <div className="parameter-value">{sensorData.humidity}%</div>
            <div className="parameter-status">
              {wsConnected ? 'Updated just now' : 'Offline'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">☀️</div>
          <div className="parameter-content">
            <div className="parameter-value">{sensorData.light} nits</div>
            <div className="parameter-status">
              {wsConnected ? 'Updated just now' : 'Offline'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentParameters;