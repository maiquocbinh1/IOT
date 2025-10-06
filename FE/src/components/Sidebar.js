import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="search-icon">🔍</div>
        <div className="search-line"></div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-item active">
          <div className="nav-icon">📊</div>
          <span className="nav-text">Dashboard</span>
        </div>
        
        <div className="nav-item">
          <div className="nav-icon">📈</div>
          <span className="nav-text">Data Sensor</span>
        </div>
        
        <div className="nav-item">
          <div className="nav-icon">🕐</div>
          <span className="nav-text">Action History</span>
        </div>
        
        <div className="nav-item">
          <div className="nav-icon">👤</div>
          <span className="nav-text">Profile</span>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
