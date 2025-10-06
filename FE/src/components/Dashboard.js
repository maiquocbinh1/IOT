import React from 'react';
import Sidebar from './Sidebar';
import CurrentParameters from './CurrentParameters';
import TemperatureHumidityChart from './TemperatureHumidityChart';
import LightIntensityChart from './LightIntensityChart';
import DeviceControl from './DeviceControl';
import './Dashboard.css';

const DashboardPage = () => {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <div className="main-header">
          <h1 className="main-title">Dashboard</h1>
          <div className="notification-icon">🔔</div>
        </div>
        
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
    </div>
  );
};

export default DashboardPage;
