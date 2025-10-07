import React from 'react';
import CurrentParameters from './CurrentParameters';
import TemperatureHumidityChart from './TemperatureHumidityChart';
import LightIntensityChart from './LightIntensityChart';
import DeviceControl from './DeviceControl';
import './Dashboard.css';

// Dashboard Page Component
const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="main-header">
        <h1 className="main-title">Dashboard</h1>
        <div className="notification-icon">🔔</div>
      </div>
      
      {/* Main Content */}
      <div className="dashboard-content">
        <div className="current-parameters">
          <CurrentParameters />
        </div>
        <div className="temperature-humidity-chart">
          <TemperatureHumidityChart />
        </div>
        <div className="light-intensity-chart">
          <LightIntensityChart />
        </div>
        <div className="device-control">
          <DeviceControl />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
