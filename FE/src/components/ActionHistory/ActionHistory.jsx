import React, { useState, useEffect } from 'react';
import './ActionHistory.css';
import apiService from '../../services/api';
import webSocketService from '../../services/websocket';

function getFormattedDate(timestamp) {
  // Backend returns dd/mm/yyyy, hh:mm:ss format
  // new Date() cannot parse this format, so we need to convert it
  
  if (!timestamp) return "-";
  
  // If it's already in the expected format (dd/mm/yyyy, hh:mm:ss), return as is
  if (/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
    return timestamp;
  }
  
  // If it's ISO format or other format, try to parse and convert
  try {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('en-GB', { hour12: false });
    }
  } catch (e) {
    console.warn('Invalid date:', timestamp);
  }
  
  return "-";
}

const ActionHistory = () => {
  // State Management
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('any'); 
  const [actionHistoryData, setActionHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Sort state - always sort by timestamp
  const [sortDirection, setSortDirection] = useState("desc");

  // Fetch action history from backend
  const fetchActionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build search parameters
      const params = {
        page: currentPage,
        limit: 12,
        sortColumn: 'timestamp',
        sortDirection: sortDirection,
        searchQuery: searchTerm.trim()
      };

      // Apply device filter if selected
      if (filterType !== 'ALL') {
        const deviceKey = filterType === 'LED1' ? 'led1' : filterType === 'LED2' ? 'led2' : 'led3';
        params.device_name = deviceKey;
      }

      // Apply action filter if selected
      if (actionFilter !== 'any') {
        params.action = actionFilter;
      }

      const response = await apiService.getActionHistory(params);
      
      if (response.data) {
        setActionHistoryData(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
        setError(null);
      } else {
        setError('Failed to fetch action history');
        setActionHistoryData([]);
        setTotalPages(1);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Error fetching action history:', err);
      setError('Failed to fetch action history');
      setActionHistoryData([]);
      setTotalPages(1);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (field === 'timestamp') { // Only allow sorting by timestamp
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchActionHistory();
  }, [currentPage, filterType, searchTerm, sortDirection, actionFilter]);

  // Auto-refresh data every 15 seconds (only when no active filters)
  useEffect(() => {
    const interval = setInterval(() => {
      const noActiveFilter = (filterType === 'ALL' && searchTerm.trim() === '') ||
                              (filterType !== 'ALL' && searchTerm.trim() === '' && actionFilter === 'any');
      if (currentPage === 1 && noActiveFilter) fetchActionHistory();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [currentPage, filterType, actionFilter, searchTerm]);

  // WebSocket listener for real-time data updates
  useEffect(() => {
    let unsubscribeDataStatus;
    
    try {
      unsubscribeDataStatus = webSocketService.on('dataStatus', (data) => {
        console.log('ESP32 Data Status in ActionHistory:', data);
      });

    } catch (error) {
      console.error('Error setting up WebSocket listeners in ActionHistory:', error);
    }

    return () => {
      try {
        if (unsubscribeDataStatus) unsubscribeDataStatus();
      } catch (error) {
        console.error('Error cleaning up WebSocket listeners in ActionHistory:', error);
      }
    };
  }, []);

  // Event Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    fetchActionHistory();
  };

  const handleFilterChange = (e) => {
    setFilterType(e.target.value);
  };

  const handleSearchTermChange = (e) => {
    setSearchTerm(e.target.value);
  };


  // Pagination Component
  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <button 
            key={i}
            className={`page-btn ${currentPage === i ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      // Show first page
      pages.push(
        <button 
          key={1}
          className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      
      // Show ellipsis if needed
      if (currentPage > 3) {
        pages.push(<span key="ellipsis1" className="page-ellipsis">...</span>);
      }
      
      // Show current page and surrounding pages
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(
          <button 
            key={i}
            className={`page-btn ${currentPage === i ? 'active' : ''}`}
            onClick={() => setCurrentPage(i)}
          >
            {i}
          </button>
        );
      }
      
      // Show ellipsis if needed
      if (currentPage < totalPages - 2) {
        pages.push(<span key="ellipsis2" className="page-ellipsis">...</span>);
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(
          <button 
            key={totalPages}
            className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
            onClick={() => setCurrentPage(totalPages)}
          >
            {totalPages}
          </button>
        );
      }
    }
    
    return pages;
  };

  const renderDeviceFriendly = (name) => {
    const n = String(name || '').toLowerCase();
    if (n === 'led1' || n === 'fan') return 'Fan';
    if (n === 'led2' || n === 'air_conditioner' || n === 'air conditioner' || n === 'ac') return 'Air Conditioner';
    if (n === 'led3' || n === 'light' || n === 'led') return 'Light';
    return name || '-';
  };

  return (
    <div className="action-history-page">
      {/* Header */}
      <div className="header">
        <h1 className="page-title">Action History</h1>
      </div>
      
      {/* Search and Filter Section - single row like DataSensor */}
      <div className="search-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by ID, device, action, or date/time"
            value={searchTerm}
            onChange={handleSearchTermChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                setCurrentPage(1);
                fetchActionHistory();
              }
            }}
          />
        </div>

        {/* Device filter */}
        <select 
          value={filterType} 
          onChange={(e) => {
            handleFilterChange(e);
            setCurrentPage(1);
          }} 
          className="filter"
        >
          <option value="ALL">ALL</option>
          <option value="LED1">Fan</option>
          <option value="LED2">Air Conditioner</option>
          <option value="LED3">Light</option>
        </select>

        {/* Action filter */}
        <select 
          value={actionFilter} 
          onChange={(e) => {
            setActionFilter(e.target.value);
            setCurrentPage(1);
          }} 
          className="filter"
        >
          <option value="any">Any</option>
          <option value="on">ON</option>
          <option value="off">OFF</option>
        </select>

        {/* Sort controls */}
        <select 
          value={sortDirection} 
          onChange={(e) => {
            setSortDirection(e.target.value);
            setCurrentPage(1);
          }} 
          className="filter"
          style={{ marginLeft: '10px' }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Date filter removed as requested */}

      {/* Action History Table */}
      <div className="table-container">
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading action history...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={fetchActionHistory} className="retry-btn">Retry</button>
          </div>
        ) : (
          <table className="action-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable-header">
                  ID {sortDirection === 'asc' ? '↑' : '↓'}
                </th>
                {filterType === 'ALL' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Device {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                {filterType === 'ALL' && <th onClick={() => handleSort('action')} className="sortable-header">
                  Action {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortDirection === 'asc' ? '↑' : '↓'}
                </th>
                {filterType === 'ALL' && <th>Status</th>}
                {filterType === 'LED1' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Fan {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                {filterType === 'LED1' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                {filterType === 'LED2' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Air Conditioner {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                {filterType === 'LED2' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                {filterType === 'LED3' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Light {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
                {filterType === 'LED3' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortDirection === 'asc' ? '↑' : '↓'}
                </th>}
              </tr>
            </thead>
            <tbody>
              {actionHistoryData.length > 0 ? (
                actionHistoryData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="id-badge">#{item.id}</span>
                    </td>
                    {filterType === 'ALL' && (
                      <td className="device-cell">{renderDeviceFriendly(item.device_name)}</td>
                    )}
                    {filterType === 'ALL' && (
                      <td className="action-cell">{item.action.toUpperCase()}</td>
                    )}
                    <td className="time-cell">
                      {getFormattedDate(item.timestamp)}
                    </td>
                    {filterType === 'ALL' && (
                      <td>
                        <span className={`status-badge success`}>
                          Success
                        </span>
                      </td>
                    )}
                    {filterType === 'LED1' && (
                      <td className="device-cell">
                        {item.action.toUpperCase()}
                      </td>
                    )}
                    {filterType === 'LED1' && (
                      <td className="time-cell">
                        {getFormattedDate(item.timestamp)}
                      </td>
                    )}
                    {filterType === 'LED2' && (
                      <td className="device-cell">
                        {item.action.toUpperCase()}
                      </td>
                    )}
                    {filterType === 'LED2' && (
                      <td className="time-cell">
                        {getFormattedDate(item.timestamp)}
                      </td>
                    )}
                    {filterType === 'LED3' && (
                      <td className="device-cell">
                        {item.action.toUpperCase()}
                      </td>
                    )}
                    {filterType === 'LED3' && (
                      <td className="time-cell">
                        {getFormattedDate(item.timestamp)}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={filterType === 'ALL' ? "5" : "3"} className="no-data">
                    <div className="no-data-message">
                      <p>🔍 Không tìm thấy kết quả nào</p>
                      <p>Thử thay đổi điều kiện lọc hoặc tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <span>Showing {currentPage} of {totalPages} pages</span>
        <div className="pagination-controls">
          <button 
            className="page-btn prev"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {renderPagination()}
          <button 
            className="page-btn next"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
        <span>Total: {totalRecords} records</span>
      </div>

    </div>
  );
};

export default ActionHistory;