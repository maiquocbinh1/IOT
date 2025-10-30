import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Common/Sidebar.jsx';
import DashboardPage from './components/Dashboard/Dashboard.jsx';
import DataSensor from './components/DataSensor/DataSensor.jsx';
import ActionHistory from './components/ActionHistory/ActionHistory.jsx';
import Profile from './components/Profile/Profile.jsx';
import webSocketService from './services/websocket';
import apiService from './services/api';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  // Global dashboard state (lifted up)
  const [sensorData, setSensorData] = useState({ temperature: 0, humidity: 0, light: 0, time: null });
  const [deviceStatus, setDeviceStatus] = useState({ led1: 'off', led2: 'off', led3: 'off' });
  const [connectionStatus, setConnectionStatus] = useState({ esp32Connected: false, mqttConnected: false });

  // Initialize WebSocket connection and wire listeners once
  useEffect(() => {
    const init = async () => {
      try {
        const latest = await apiService.getLatestSensorData();
        setSensorData({
          temperature: parseFloat(latest?.temperature || 0),
          humidity: parseFloat(latest?.humidity || 0),
          light: parseFloat(latest?.light || 0),
          time: latest?.time || null
        });
        setConnectionStatus((prev) => ({
          ...prev,
          esp32Connected: !!latest?.esp32Connected,
          mqttConnected: !!latest?.mqttConnected
        }));
      } catch {}

      try { webSocketService.connect(); } catch {}

      const onSensor = (data) => {
        setSensorData({
          temperature: parseFloat(data?.temperature || 0),
          humidity: parseFloat(data?.humidity || 0),
          light: parseFloat(data?.light || 0),
          time: data?.time || null
        });
      };
      const onLed = (payload) => {
        const s = payload?.status || payload || {};
        setDeviceStatus({
          led1: s.led1 ? (s.led1 === true ? 'on' : s.led1) : deviceStatus.led1,
          led2: s.led2 ? (s.led2 === true ? 'on' : s.led2) : deviceStatus.led2,
          led3: s.led3 ? (s.led3 === true ? 'on' : s.led3) : deviceStatus.led3
        });
      };
      const onDataStatus = (d) => setConnectionStatus((p) => ({ ...p, esp32Connected: !!d?.isConnected }));
      const onMqtt = (d) => setConnectionStatus((p) => ({ ...p, mqttConnected: !!d?.isConnected }));

      const u1 = webSocketService.on('sensorData', onSensor);
      const u2 = webSocketService.on('LED_STATUS', onLed);
      const u2b = webSocketService.on('ledStatus', onLed);
      const u3 = webSocketService.on('dataStatus', onDataStatus);
      const u4 = webSocketService.on('mqttStatus', onMqtt);

      return () => {
        try { u1 && u1(); u2 && u2(); u2b && u2b(); u3 && u3(); u4 && u4(); } catch {}
        try { webSocketService.disconnect(); } catch {}
      };
    };
    const cleanupPromise = init();
    return () => { try { cleanupPromise && cleanupPromise(); } catch {} };
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage
            sensorData={sensorData}
            deviceStatus={deviceStatus}
            connectionStatus={connectionStatus}
          />
        );
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