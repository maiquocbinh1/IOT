import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Common/Sidebar.jsx';
import DashboardPage from './components/Dashboard/Dashboard.jsx';
import DataSensor from './components/DataSensor/DataSensor.jsx';
import ActionHistory from './components/ActionHistory/ActionHistory.jsx';
import Profile from './components/Profile/Profile.jsx';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

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
      <div className="app-layout">
        <Sidebar activePage={activePage} onPageChange={setActivePage} />
        <main className="main-content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;