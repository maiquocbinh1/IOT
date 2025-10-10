import React, { useState, useEffect } from 'react';
import './DeviceControl.css';
import apiService from '../../services/api';
import webSocketService from '../../services/websocket';

const DeviceControl = () => {
  const [devices, setDevices] = useState({
    fan: false,
    airConditioner: false,
    light: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Initialize WebSocket connection and load device status
  useEffect(() => {
    // Connect to WebSocket
    const connectWebSocket = () => {
      try {
        webSocketService.connect();
        setWsConnected(true);
        console.log('WebSocket connected for device control');
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setWsConnected(false);
      }
    };

           // Load initial device status
           const loadDeviceStatus = async () => {
             try {
               // For now, use default values since we don't have a real status endpoint
               // The devices will be controlled via MQTT and status will be updated via WebSocket
               console.log('Device status loaded with default values');
             } catch (err) {
               console.error('Error loading device status:', err);
               // Keep default values
             }
           };

    connectWebSocket();
    loadDeviceStatus();

           // Listen for LED status updates
           const unsubscribeLEDStatus = webSocketService.on('ledStatus', (data) => {
             console.log('Received LED status update:', data);
             
             // Map device status to device states
             setDevices(prev => ({
               ...prev,
               fan: data.Fan || data.fan || false,
               airConditioner: data['Air Conditioner'] || data.airConditioner || false,
               light: data.Light || data.light || false
             }));
           });

    // Listen for WebSocket connection status
    const unsubscribeConnection = webSocketService.on('connect', () => {
      setWsConnected(true);
    });

    const unsubscribeDisconnect = webSocketService.on('disconnect', () => {
      setWsConnected(false);
    });

    // Cleanup
    return () => {
      unsubscribeLEDStatus();
      unsubscribeConnection();
      unsubscribeDisconnect();
    };
  }, []);

  const toggleDevice = async (deviceName) => {
    try {
      setLoading(true);
      setError(null);

      const newStatus = !devices[deviceName];
      
             // Use device names directly for backend
             const deviceDisplayName = deviceName === 'fan' ? 'Fan' : 
                                     deviceName === 'airConditioner' ? 'Air Conditioner' : 
                                     'Light';
             
             // Display names for user
             const userDisplayName = deviceDisplayName;
      
      // Update local state immediately for better UX
      setDevices(prev => ({
        ...prev,
        [deviceName]: newStatus
      }));

      // Send command via API
      try {
        console.log(`🔄 Sending control command: ${deviceDisplayName} -> ${newStatus ? 'on' : 'off'}`);
        const response = await apiService.controlDevice(deviceDisplayName, newStatus ? 'on' : 'off');
        console.log('✅ Device control API response:', response);
        
        if (response && response.success) {
          setSuccess(`${userDisplayName} turned ${newStatus ? 'ON' : 'OFF'} successfully!`);
          setError(null);
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(response?.message || 'API returned unsuccessful response');
        }
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        setError(`Failed to control ${userDisplayName}: ${apiError.message}`);
        
        // Revert the state change only if API failed
        setDevices(prev => ({
          ...prev,
          [deviceName]: !prev[deviceName]
        }));
      }

    } catch (err) {
      console.error('Error controlling device:', err);
      setError(`Failed to control ${userDisplayName}`);
      
      // Revert the state change
      setDevices(prev => ({
        ...prev,
        [deviceName]: !prev[deviceName]
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="device-control">
      <h2 className="section-title">Device Control</h2>
      <div className="devices-grid">
        <div className="device-card">
          <div className={`device-icon fan-icon ${devices.fan ? 'spinning' : ''}`}>
            <div className="fan-blades">
              <div className="blade blade-1"></div>
              <div className="blade blade-2"></div>
              <div className="blade blade-3"></div>
            </div>
            <div className="fan-center"></div>
          </div>
                 <div className="device-content">
                   <div className="device-name">Fan</div>
                   <div className="device-status-row">
                     <div className="device-status">
                       Status: {devices.fan ? 'On' : 'Off'}
                     </div>
                     <div className={`toggle-switch ${devices.fan ? 'active' : ''}`} onClick={() => toggleDevice('fan')}>
                       <div className={`toggle-slider ${devices.fan ? 'active' : ''}`}></div>
                     </div>
                   </div>
                 </div>
        </div>
        
        <div className="device-card">
          <div className={`device-icon ac-icon ${devices.airConditioner ? 'spinning' : ''}`}>❄️</div>
                 <div className="device-content">
                   <div className="device-name">Air Conditioner</div>
                   <div className="device-status-row">
                     <div className="device-status">
                       Status: {devices.airConditioner ? 'On' : 'Off'}
                     </div>
                     <div className={`toggle-switch ${devices.airConditioner ? 'active' : ''}`} onClick={() => toggleDevice('airConditioner')}>
                       <div className={`toggle-slider ${devices.airConditioner ? 'active' : ''}`}></div>
                     </div>
                   </div>
                 </div>
        </div>
        
        <div className="device-card">
          <div className={`device-icon light-icon ${devices.light ? 'glowing' : ''}`}>💡</div>
                 <div className="device-content">
                   <div className="device-name">Light</div>
                   <div className="device-status-row">
                     <div className="device-status">
                       Status: {devices.light ? 'On' : 'Off'}
                     </div>
                     <div className={`toggle-switch ${devices.light ? 'active' : ''}`} onClick={() => toggleDevice('light')}>
                       <div className={`toggle-slider ${devices.light ? 'active' : ''}`}></div>
                     </div>
                   </div>
                 </div>
        </div>
      </div>
      
      {success && (
        <div className="success-message">
          <p>✅ {success}</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}
    </div>
  );
};

export default DeviceControl;