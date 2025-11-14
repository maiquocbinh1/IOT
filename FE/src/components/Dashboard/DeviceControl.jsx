import React, { useState, useEffect, useRef } from 'react';
import './DeviceControl.css';
import apiService from '../../services/api';
import storageService from '../../services/storage';

// Map friendly names in FE to backend-understood device ids
const mapDeviceNameToBackend = (name) => {
  const key = String(name || '').toLowerCase().replace(/\s+/g, '_');
  switch (key) {
    case 'fan':
      return 'led1';
    case 'air_conditioner':
    case 'airconditioner':
      return 'led2';
    case 'light':
      return 'led3';
    default:
      return name; // fallback: send as-is
  }
};

const normalizeAction = (actionBoolOrString) => {
  if (typeof actionBoolOrString === 'boolean') return actionBoolOrString ? 'on' : 'off';
  const a = String(actionBoolOrString || '').toLowerCase();
  if (a === '1' || a === 'on' || a === 'true') return 'on';
  return 'off';
};

const DeviceControl = ({ initialStatus, isConnected, alertTriggered }) => {
  // Initialize with saved state from localStorage, fallback to defaults
  const [devices, setDevices] = useState(() => {
    const saved = storageService.getDeviceState();
    return saved || {
      fan: false,
      airConditioner: false,
      light: false
    };
  });
  const [loading, setLoading] = useState(false);
  const [loadingDevice, setLoadingDevice] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [esp32Connected, setEsp32Connected] = useState(!!isConnected);
  const prevConnectedRef = useRef(!!isConnected);
  const hasRestoredStateRef = useRef(false);

  // Reflect prop changes
  useEffect(() => {
    setEsp32Connected(!!isConnected);
    // If hardware just reconnected, show a brief loading overlay then keep last known state
    if (!!isConnected && !prevConnectedRef.current) {
      setLoadingDevice('reconnect');
      const t = setTimeout(() => setLoadingDevice(null), 1000);
      return () => clearTimeout(t);
    }
    // If hardware just disconnected, show a brief loading overlay before indicating disconnected
    if (!isConnected && prevConnectedRef.current) {
      setLoadingDevice('disconnect');
      const t = setTimeout(() => setLoadingDevice(null), 1000);
      return () => clearTimeout(t);
    }
    prevConnectedRef.current = !!isConnected;
  }, [isConnected]);

  // Auto-save device state to localStorage whenever it changes
  useEffect(() => {
    storageService.saveDeviceState(devices);
  }, [devices]);

  // Restore saved device states from localStorage on component mount
  useEffect(() => {
    if (!hasRestoredStateRef.current && esp32Connected) {
      hasRestoredStateRef.current = true;
      const savedState = storageService.getDeviceState();
      if (savedState && (savedState.fan || savedState.airConditioner || savedState.light)) {
        console.log('Restoring saved device states to hardware:', savedState);
        restoreDeviceStates(savedState);
      }
    }
  }, [esp32Connected]);

  // Sync with initialStatus from parent (from WebSocket/API)
  // But prioritize localStorage if we have saved state
  useEffect(() => {
    if (initialStatus) {
      const savedState = storageService.getDeviceState();
      // Only sync from initialStatus if we don't have saved localStorage state
      if (!savedState || (!savedState.fan && !savedState.airConditioner && !savedState.light)) {
        setDevices({
          fan: initialStatus.led1 === 'on' || initialStatus.led1 === true,
          airConditioner: initialStatus.led2 === 'on' || initialStatus.led2 === true,
          light: initialStatus.led3 === 'on' || initialStatus.led3 === true
        });
      }
    }
  }, [initialStatus]);

  // Function to turn off all devices
  const turnOffAllDevices = async () => {
    try {
      const devices = ['Fan', 'Air Conditioner', 'Light'];
      
      for (const device of devices) {
        console.log(`Turning off ${device}`);
        const backendName = mapDeviceNameToBackend(device);
        const response = await apiService.controlDevice(backendName, 'off');
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
          const backendName = mapDeviceNameToBackend(deviceDisplayName);
          const response = await apiService.controlDevice(backendName, 'on');
          if (response.success) {
            console.log(`${deviceDisplayName} restored to ON`);
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
      setLoadingDevice(deviceName);
      setError(null);

      const newStatus = !devices[deviceName];
      
      // Map frontend device names to backend device names
      const backendDeviceName = mapDeviceNameToBackend(
        deviceName === 'airConditioner' ? 'Air Conditioner' : deviceName
      );
      const userDisplayName = deviceName === 'fan' ? 'Fan' : 
                            deviceName === 'airConditioner' ? 'Air Conditioner' : 
                            'Light';
      
      // Show loading screen for 1s before issuing command
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Send command via API
      try {
        console.log(`Sending control command: ${backendDeviceName} -> ${newStatus ? 'on' : 'off'}`);
        const response = await apiService.controlDevice(backendDeviceName, normalizeAction(newStatus));
        console.log('Device control API response:', response);
        
        if (response && response.success) {
          // Update local state after successful API (actual status will also be corrected by WS)
          setDevices(prev => ({
            ...prev,
            [deviceName]: newStatus
          }));
          setSuccess(`${userDisplayName} turned ${newStatus ? 'ON' : 'OFF'} successfully!`);
          setError(null);
          // Clear success message after 3 seconds
          setTimeout(() => setSuccess(null), 3000);
        } else {
          throw new Error(response?.message || 'API returned unsuccessful response');
        }
      } catch (apiError) {
        console.error('API call failed:', apiError);
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
      
      // Keep previous state (no change)
    } finally {
      setLoading(false);
      setLoadingDevice(null);
    }
  };

  return (
    <div className="device-control" style={{position:'relative'}}>
      {loadingDevice && (
        <div style={{position:'absolute', inset:0, background:'rgba(255,255,255,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2}}>
          <div className="loading-spinner"></div>
        </div>
      )}
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
      <div className="devices-grid" style={{pointerEvents: loadingDevice ? 'none' : 'auto', opacity: loadingDevice ? 0.7 : 1}}>
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

        <div className={`device-card ${alertTriggered ? 'alert-active' : ''}`}>
          <div className={`device-icon alert-icon ${alertTriggered ? 'blinking' : ''}`}>🚨</div>
                 <div className="device-content">
                   <div className="device-name">Alert LED</div>
                   <div className="device-status-row">
                     <div className="device-status">
                       Status: {alertTriggered ? 'Alert!' : 'Normal'}
                     </div>
                     <div className={`alert-indicator ${alertTriggered ? 'active' : ''}`}></div>
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