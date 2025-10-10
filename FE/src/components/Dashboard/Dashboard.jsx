import React from 'react';
import CurrentParameters from './CurrentParameters.jsx';
import TemperatureHumidityChart from './TemperatureHumidityChart.jsx';
import DeviceControl from './DeviceControl.jsx';
import './Dashboard.css';

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="header">
        <h1 className="page-title">Dashboard</h1>
        <div className="bell">🔔</div>
      </div>
      
      <div className="dashboard-content">
        <div className="current-parameters">
          <CurrentParameters />
        </div>
        <div className="temperature-humidity-chart">
          <TemperatureHumidityChart />
        </div>
        <div className="device-control">
          <DeviceControl />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;