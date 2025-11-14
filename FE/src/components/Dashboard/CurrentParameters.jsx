import React from 'react';
import './CurrentParameters.css';

const CurrentParameters = ({ params, connectionStatus }) => {
  const temperature = params?.temperature;
  const humidity = params?.humidity;
  const light = params?.light;
  const dust = params?.dust;
  const co2 = params?.co2;
  const alertTriggered = !!params?.alertTriggered;
  const esp32Connected = !!connectionStatus?.esp32Connected;

  return (
    <div className="current-parameters">
      <div className="section-header">
        <h2 className="section-title">Current Parameters</h2>
        <div className="connection-status">
          <div className={`status-indicator ${esp32Connected ? 'connected' : 'disconnected'}`}>
            <div className="status-dot"></div>
            <span>{esp32Connected ? 'ESP32 Connected' : 'ESP32 Disconnected'}</span>
          </div>
        </div>
      </div>
      <div className="parameters-grid">
        <div className="parameter-card">
          <div className="parameter-icon">🌡️</div>
          <div className="parameter-content">
            <div className="parameter-value">{Number.isFinite(temperature) ? temperature.toFixed(2) : 'N/A'}°C</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">💧</div>
          <div className="parameter-content">
            <div className="parameter-value">{Number.isFinite(humidity) ? humidity.toFixed(2) : 'N/A'}%</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">☀️</div>
          <div className="parameter-content">
            <div className="parameter-value">{Number.isFinite(light) ? light.toFixed(0) : 'N/A'} nits</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">💨</div>
          <div className="parameter-content">
            <div className="parameter-value">{Number.isFinite(dust) ? dust.toFixed(0) : 'N/A'}</div>
            <div className="parameter-label">Dust (0-1000)</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">🔬</div>
          <div className="parameter-content">
            <div className="parameter-value">{Number.isFinite(co2) ? co2.toFixed(1) : 'N/A'}</div>
            <div className="parameter-label">CO2 (0-100)</div>
            <div className="parameter-status">
              {esp32Connected ? 'Updated just now' : 'Last data from database'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentParameters;