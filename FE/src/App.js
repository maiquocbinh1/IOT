import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Common/Sidebar';
import DashboardPage from './components/Dashboard/Dashboard';
import DataSensor from './components/DataSensor/DataSensor';
import ActionHistory from './components/ActionHistory/ActionHistory';
import Profile from './components/Profile/Profile';

// Main App Component
function App() {
  // State Management
  const [activePage, setActivePage] = useState('dashboard');

  // Page Renderer
  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'data-sensor':
        return <DataSensor />;
      case 'action-history':
        return <ActionHistory />;
      case 'profile':
        return <Profile />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="App">
      <Sidebar activePage={activePage} onPageChange={setActivePage} />
      {renderPage()}
    </div>
  );
}

export default App;
