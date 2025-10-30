import React from 'react';
import CurrentParameters from './CurrentParameters.jsx';
import TemperatureHumidityChart from './TemperatureHumidityChart.jsx';
import DeviceControl from './DeviceControl.jsx';
import './Dashboard.css';

const DashboardPage = ({ sensorData, deviceStatus, connectionStatus }) => {
  return (
    <div className="dashboard-page">
      <div className="header">
        <h1 className="page-title">Dashboard</h1>
      </div>
      
      <div className="dashboard-content">
        <div className="current-parameters">
          <CurrentParameters params={sensorData} connectionStatus={connectionStatus} />
        </div>
        <div className="temperature-humidity-chart">
          <TemperatureHumidityChart liveData={sensorData} />
        </div>
        <div className="device-control">
          <DeviceControl initialStatus={deviceStatus} isConnected={connectionStatus?.esp32Connected} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;