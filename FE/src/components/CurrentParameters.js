import React from 'react';
import './CurrentParameters.css';

const CurrentParameters = () => {
  return (
    <div className="current-parameters">
      <h2 className="section-title">Current Parameters</h2>
      <div className="parameters-grid">
        <div className="parameter-card">
          <div className="parameter-icon">🌡️</div>
          <div className="parameter-content">
            <div className="parameter-value">22.4°C</div>
            <div className="parameter-status">Updated just now</div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">💧</div>
          <div className="parameter-content">
            <div className="parameter-value">48%</div>
            <div className="parameter-status">Updated just now</div>
          </div>
        </div>
        
        <div className="parameter-card">
          <div className="parameter-icon">☀️</div>
          <div className="parameter-content">
            <div className="parameter-value">720 nits</div>
            <div className="parameter-status">Updated just now</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentParameters;
