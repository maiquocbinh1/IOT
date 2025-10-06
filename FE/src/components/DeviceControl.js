import React, { useState } from 'react';
import './DeviceControl.css';

const DeviceControl = () => {
  const [devices, setDevices] = useState({
    fan: false,
    airConditioner: false,
    light: false
  });

  const toggleDevice = (device) => {
    setDevices(prev => ({
      ...prev,
      [device]: !prev[device]
    }));
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
    </div>
  );
};

export default DeviceControl;
