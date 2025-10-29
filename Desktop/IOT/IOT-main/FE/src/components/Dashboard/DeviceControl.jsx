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
  const [hardwareConnected, setHardwareConnected] = useState(true);
  const [esp32Connected, setEsp32Connected] = useState(false); // Start with false, will be updated by WebSocket
  const [savedDeviceStates, setSavedDeviceStates] = useState(null);

  // Initialize WebSocket connection and load device status
  useEffect(() => {
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

    // Initial connection
    connectWebSocket();

    // Reconnect on failure
    const reconnectInterval = setInterval(() => {
      if (!wsConnected) {
        console.log('Attempting to reconnect WebSocket...');
        connectWebSocket();
      }
    }, 5000);

    return () => {
      clearInterval(reconnectInterval);
    };
  }, [wsConnected]);

  // Load initial device status and connection status
  useEffect(() => {
    const loadDeviceStatus = async () => {
      try {
        // Get connection status from API
        const connectionStatus = await apiService.getConnectionStatus();
        console.log('Connection status from API:', connectionStatus);
        setEsp32Connected(connectionStatus.esp32Connected);
      } catch (err) {
        console.error('Error loading device status:', err);
        // Keep default values
      }
    };

    loadDeviceStatus();

    // Set up WebSocket listeners for connection status
    let unsubscribeDataStatus, unsubscribeMqttStatus;
    
    try {
      unsubscribeDataStatus = webSocketService.on('dataStatus', (data) => {
        console.log('ESP32 Data Status in DeviceControl:', data);
        setEsp32Connected(data.isConnected);
      });

      unsubscribeMqttStatus = webSocketService.on('mqttStatus', (data) => {
        console.log('MQTT Status in DeviceControl:', data);
        // MQTT status can also indicate ESP32 connection
        if (data.isConnected) {
          setEsp32Connected(true);
        }
      });
    } catch (error) {
      console.error('Error setting up WebSocket listeners in DeviceControl:', error);
    }

    // Check ESP32 connection status periodically
    const checkEsp32Connection = async () => {
      try {
        const connectionStatus = await apiService.getConnectionStatus();
        console.log('Periodic ESP32 connection check:', connectionStatus);
        setEsp32Connected(connectionStatus.esp32Connected);
      } catch (error) {
        console.error('Error checking ESP32 connection:', error);
        setEsp32Connected(false);
      }
    };

    // Check every 3 seconds
    const connectionCheckInterval = setInterval(checkEsp32Connection, 3000);
    checkEsp32Connection(); // Initial check

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
    const unsubscribeConnection = webSocketService.on('connection', (data) => {
      setWsConnected(data.status === 'connected');
    });

    // Cleanup
    return () => {
      unsubscribeLEDStatus();
      unsubscribeConnection();
      unsubscribeDataStatus();
      unsubscribeMqttStatus();
      clearInterval(connectionCheckInterval);
    };
  }, [hardwareConnected, devices, savedDeviceStates]);

  // Function to turn off all devices
  const turnOffAllDevices = async () => {
    try {
      const devices = ['Fan', 'Air Conditioner', 'Light'];
      
      for (const device of devices) {
        console.log(`Turning off ${device}`);
        const response = await apiService.controlDevice(device.toLowerCase(), 'off');
        if (response.success) {
          console.log(`${device} turned off successfully`);
        } else {
          console.error(`Failed to turn off ${device}:`, response.message);
        }
        
        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error turning off devices:', error);
    }
  };

  // Function to restore device states by sending actual control commands
  const restoreDeviceStates = async (states) => {
    try {
      // Wait a bit for hardware to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Send control commands for each device based on saved state
      for (const [deviceName, isOn] of Object.entries(states)) {
        if (isOn) {
          const deviceDisplayName = deviceName === 'fan' ? 'Fan' : 
                                  deviceName === 'airConditioner' ? 'Air Conditioner' : 
                                  'Light';
          
          console.log(`Restoring ${deviceDisplayName} to ON state`);
          
          // Send control command
          const response = await apiService.controlDevice(deviceName, 'on');
          if (response.success) {
            console.log(`${deviceDisplayName} restored to ON successfully`);
          } else {
            console.error(`Failed to restore ${deviceDisplayName}:`, response.message);
          }
          
          // Small delay between commands
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      console.error('Error restoring device states:', error);
    }
  };

  const toggleDevice = async (deviceName) => {
    console.log(`Toggle device called: ${deviceName}, ESP32 connected: ${esp32Connected}`);
    
    // Only allow control when ESP32 is connected
    if (!esp32Connected) {
      console.log('ESP32 not connected, cannot control device');
      setError(`Cannot control device: ESP32 disconnected`);
      setTimeout(() => setError(null), 5000);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newStatus = !devices[deviceName];
      
      // Map frontend device names to backend device names
      const deviceNameMap = {
        'fan': 'led1',
        'airConditioner': 'led2',
        'light': 'led3'
      };
      
      const backendDeviceName = deviceNameMap[deviceName];
      const userDisplayName = deviceName === 'fan' ? 'Fan' : 
                            deviceName === 'airConditioner' ? 'Air Conditioner' : 
                            'Light';
      
      // Update local state immediately for better UX
      setDevices(prev => ({
        ...prev,
        [deviceName]: newStatus
      }));

      // Send command via API
      try {
        console.log(`🔄 Sending control command: ${backendDeviceName} -> ${newStatus ? 'on' : 'off'}`);
        const response = await apiService.controlDevice(backendDeviceName, newStatus ? 'on' : 'off');
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
      {!esp32Connected && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '10px 15px',
          borderRadius: '8px',
          marginBottom: '15px',
          border: '1px solid #ffeaa7',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          ⚠️ ESP32 Disconnected - Device controls are disabled
        </div>
      )}
      <div className="devices-grid">
        <div className={`device-card ${!esp32Connected ? 'disconnected' : ''}`}>
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
                     <div className={`toggle-switch ${devices.fan ? 'active' : ''} ${!esp32Connected ? 'disabled' : ''}`} 
                          onClick={() => {
                            if (esp32Connected) {
                              toggleDevice('fan');
                            } else {
                              console.log('ESP32 disconnected - cannot control fan');
                            }
                          }}>
                       <div className={`toggle-slider ${devices.fan ? 'active' : ''}`}></div>
                     </div>
                   </div>
                 </div>
        </div>
        
        <div className={`device-card ${!esp32Connected ? 'disconnected' : ''}`}>
          <div className={`device-icon ac-icon ${devices.airConditioner ? 'spinning' : ''}`}>❄️</div>
                 <div className="device-content">
                   <div className="device-name">Air Conditioner</div>
                   <div className="device-status-row">
                     <div className="device-status">
                       Status: {devices.airConditioner ? 'On' : 'Off'}
                     </div>
                     <div className={`toggle-switch ${devices.airConditioner ? 'active' : ''} ${!esp32Connected ? 'disabled' : ''}`} 
                          onClick={() => {
                            if (esp32Connected) {
                              toggleDevice('airConditioner');
                            } else {
                              console.log('ESP32 disconnected - cannot control air conditioner');
                            }
                          }}>
                       <div className={`toggle-slider ${devices.airConditioner ? 'active' : ''}`}></div>
                     </div>
                   </div>
                 </div>
        </div>
        
        <div className={`device-card ${!esp32Connected ? 'disconnected' : ''}`}>
          <div className={`device-icon light-icon ${devices.light ? 'glowing' : ''}`}>💡</div>
                 <div className="device-content">
                   <div className="device-name">Light</div>
                   <div className="device-status-row">
                     <div className="device-status">
                       Status: {devices.light ? 'On' : 'Off'}
                     </div>
                     <div className={`toggle-switch ${devices.light ? 'active' : ''} ${!esp32Connected ? 'disabled' : ''}`} 
                          onClick={() => {
                            if (esp32Connected) {
                              toggleDevice('light');
                            } else {
                              console.log('ESP32 disconnected - cannot control light');
                            }
                          }}>
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