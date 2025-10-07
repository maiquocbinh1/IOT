import React, { useState } from 'react';
import './DeviceControl.css';

// Device Control Component
const DeviceControl = () => {
  // State Management
  const [devices, setDevices] = useState({
    fan: false,
    airConditioner: false,
    light: false,
  });

  // Event Handlers
  const toggleDevice = (device) => {
    setDevices((prev) => ({ ...prev, [device]: !prev[device] }));
  };

  const DeviceCard = ({ on, label, onClick, icon, children }) => (
    <div className="device-card">
      <div className="device-header">
        <div className="device-info">
          {icon}
          <div className="device-name">{label}</div>
        </div>
        <button
          className={`toggle-switch ${on ? 'active' : ''}`}
          onClick={onClick}
          role="switch"
          aria-checked={on}
          aria-label={`${label} power`}
        >
          <span className={`toggle-slider ${on ? 'active' : ''}`} />
        </button>
      </div>
      <div className="device-status">Status: {on ? 'On' : 'Off'}</div>
    </div>
  );

  return (
    <div className="device-control">
      <h2 className="section-title">Device Control</h2>

      <div className="devices-grid">
        {/* Fan */}
        <DeviceCard
          on={devices.fan}
          label="Fan"
          onClick={() => toggleDevice('fan')}
          icon={
            <div className={`device-icon fan-icon ${devices.fan ? 'spinning' : ''}`}>
              <div className="fan-blades">
                <div className="blade blade-1" />
                <div className="blade blade-2" />
                <div className="blade blade-3" />
              </div>
              <div className="fan-center" />
            </div>
          }
        />

        {/* AC */}
        <DeviceCard
          on={devices.airConditioner}
          label="Air Conditioner"
          onClick={() => toggleDevice('airConditioner')}
          icon={
            <div className={`device-icon ac-icon ${devices.airConditioner ? 'spinning' : ''}`}>❄️</div>
          }
        />

        {/* Light */}
        <DeviceCard
          on={devices.light}
          label="Light"
          onClick={() => toggleDevice('light')}
          icon={
            <div className={`device-icon light-icon ${devices.light ? 'glowing' : ''}`}>💡</div>
          }
        />
      </div>
    </div>
  );
};

export default DeviceControl;
