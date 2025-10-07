import React from 'react';
import './Sidebar.css';

// Sidebar Navigation Component
const Sidebar = ({ activePage, onPageChange }) => {
  return (
    <div className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo">🌿</div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div 
          className={`nav-item ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onPageChange('dashboard')}
        >
          <div className="nav-icon">⊞</div>
          <span className="nav-text">Dashboard</span>
        </div>
        
        <div 
          className={`nav-item ${activePage === 'data-sensor' ? 'active' : ''}`}
          onClick={() => onPageChange('data-sensor')}
        >
          <div className="nav-icon">〰️</div>
          <span className="nav-text">Data Sensor</span>
        </div>
        
        <div 
          className={`nav-item ${activePage === 'action-history' ? 'active' : ''}`}
          onClick={() => onPageChange('action-history')}
        >
          <div className="nav-icon">🕐</div>
          <span className="nav-text">Action History</span>
        </div>
        
        <div 
          className={`nav-item ${activePage === 'profile' ? 'active' : ''}`}
          onClick={() => onPageChange('profile')}
        >
          <div className="nav-icon">👤</div>
          <span className="nav-text">Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
