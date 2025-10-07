import React, { useState } from 'react';
import './ActionHistory.css';

// ActionHistory Component
const ActionHistory = () => {
  // State Management
  const [filterType, setFilterType] = useState('ALL');
  const [timeSearch, setTimeSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Event Handlers
  const handleSearch = () => {
    console.log('Search with:', { filterType, timeSearch });
    // TODO: Call backend API
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const handleTimeSearchChange = (e) => {
    setTimeSearch(e.target.value);
  };

  // Mock Data
  const actionHistoryData = [
    { id: "#2051", device: "AIR_CONDITIONER", action: "ON", time: "14:20:11 24/08/2025", status: "Success" },
    { id: "#2050", device: "LED", action: "OFF", time: "14:05:47 24/08/2025", status: "Fail" },
    { id: "#2049", device: "FAN", action: "ON", time: "13:59:02 24/08/2025", status: "Success" },
    { id: "#2048", device: "AIR_CONDITIONER", action: "ON", time: "13:40:18 24/08/2025", status: "Success" },
    { id: "#2047", device: "LED", action: "OFF", time: "13:10:55 24/08/2025", status: "Fail" },
    { id: "#2046", device: "FAN", action: "OFF", time: "12:45:33 24/08/2025", status: "Success" },
    { id: "#2045", device: "AIR_CONDITIONER", action: "OFF", time: "12:30:15 24/08/2025", status: "Success" },
    { id: "#2044", device: "LED", action: "ON", time: "12:15:42 24/08/2025", status: "Success" },
    { id: "#2043", device: "FAN", action: "ON", time: "11:58:27 24/08/2025", status: "Fail" },
    { id: "#2042", device: "AIR_CONDITIONER", action: "ON", time: "11:40:18 24/08/2025", status: "Success" },
  ];

  // Pagination Component
  const renderPagination = () => {
    return (
      <>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <span className="page-ellipsis">...</span>
        <button className="page-btn">40</button>
      </>
    );
  };

  return (
    <div className="action-history-page">
      {/* Header */}
      <div className="header">
        <h1 className="page-title">Action History</h1>
        <div className="bell">🔔</div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="search-filter-section">
        <div className="filter-dropdown">
          <select value={filterType} onChange={handleFilterChange}>
            <option value="ALL">ALL</option>
            <option value="AIR_CONDITIONER">AIR_CONDITIONER</option>
            <option value="LED">LED</option>
            <option value="FAN">FAN</option>
          </select>
        </div>
        
        <div className="time-search">
          <input
            type="text"
            placeholder="hh:mm:ss dd/mm/yyyy"
            value={timeSearch}
            onChange={handleTimeSearchChange}
          />
        </div>
        
        <button className="search-btn" onClick={handleSearch}>
          🔍 Search
        </button>
      </div>

      {/* Action History Table */}
      <div className="table-container">
        <table className="action-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Device</th>
              <th>Action</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {actionHistoryData.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="id-badge">{item.id}</span>
                </td>
                <td className="device-cell">{item.device}</td>
                <td className="action-cell">{item.action}</td>
                <td className="time-cell">{item.time}</td>
                <td>
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

          {/* Pagination */}
          <div className="pagination">
            <span>Showing {currentPage} of 40 pages</span>
            <div className="pagination-controls">
              <button className="page-btn prev">‹</button>
              {renderPagination()}
              <button className="page-btn next">›</button>
            </div>
            <span>Total: 40 pages</span>
          </div>
    </div>
  );
};

export default ActionHistory;
