import React, { useState, useEffect } from 'react';
import { BsSearch } from 'react-icons/bs';
import './ActionHistory.css';
import apiService from '../../services/api';
import webSocketService from '../../services/websocket';

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
  
  // Sort state
  const [sortField, setSortField] = useState("timestamp");
  const [sortDirection, setSortDirection] = useState("desc");

  // Fetch action history from backend
  const fetchActionHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build search parameters
      const params = {
        page: currentPage,
        limit: 10,
        sortColumn: sortField,
        sortDirection: sortDirection
      };

      // Primary filter to minimize payload (priority: date-in-search > action > device > id)
      const term = searchTerm.trim();
      const deviceKey = filterType === 'LED1' ? 'led1' : filterType === 'LED2' ? 'led2' : filterType === 'LED3' ? 'led3' : null;

      // If user types a date like YYYY-MM-DD (or DD/MM/YYYY -> convert), use timestamp filter
      let dateCandidate = null;
      const m = term.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (/^\d{4}-\d{2}-\d{2}/.test(term)) {
        dateCandidate = term.slice(0, 10);
      } else if (m) {
        const dd = m[1].padStart(2, '0');
        const mm = m[2].padStart(2, '0');
        const yyyy = m[3];
        dateCandidate = `${yyyy}-${mm}-${dd}`;
      }

      if (dateCandidate) {
        params.filterType = 'timestamp';
        params.searchQuery = dateCandidate;
      } else if (actionFilter !== 'any') {
        params.filterType = 'action';
        params.searchQuery = actionFilter;
      } else if (deviceKey) {
        params.filterType = 'device_name';
        params.searchQuery = deviceKey;
      } else if (term && !isNaN(term)) {
        params.filterType = 'id';
        params.searchQuery = term;
      }

      const response = await apiService.getActionHistory(params);
      
      console.log('ActionHistory API Response:', response);
      
      if (response.data) {
        let rows = response.data || [];
        // Normalize sort by latest first
        rows.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
        // Apply secondary filters client-side to combine Device consistently
        if (deviceKey) rows = rows.filter(r => String(r.device_name || '').toLowerCase() === deviceKey);
        // If Action filter ON/OFF is chosen, show devices that are currently ON/OFF
        if (actionFilter !== 'any') {
          const latestPerDevice = new Map();
          for (const r of rows) {
            const dev = String(r.device_name || '').toLowerCase();
            if (!latestPerDevice.has(dev)) {
              latestPerDevice.set(dev, r); // rows are sorted desc => first is latest
            }
          }
          rows = Array.from(latestPerDevice.values()).filter(r => String(r.action || '').toLowerCase() === actionFilter);
        }
        // When filterType = ALL and user enters a numeric ID, enforce exact ID match client-side
        if (filterType === 'ALL' && term && !isNaN(term)) {
          const targetId = String(parseInt(term, 10));
          rows = rows.filter(r => String(r.id) === targetId);
        }
        setActionHistoryData(rows);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords((response.pagination?.total || rows.length));
        setError(null); // Clear any previous errors
      } else {
        setError('Failed to fetch action history');
        // Only use fallback data
          setActionHistoryData([
            { id: 2051, device_name: "AIR_CONDITIONER", action: "ON", timestamp: "2025-10-10T03:08:24.000Z", description: "Sample data" },
            { id: 2050, device_name: "LED", action: "OFF", timestamp: "2025-10-10T03:08:23.000Z", description: "Sample data" },
            { id: 2049, device_name: "FAN", action: "ON", timestamp: "2025-10-10T03:08:22.000Z", description: "Sample data" },
            { id: 2048, device_name: "AIR_CONDITIONER", action: "ON", timestamp: "2025-10-10T03:08:21.000Z", description: "Sample data" },
            { id: 2047, device_name: "LED", action: "OFF", timestamp: "2025-10-10T03:08:20.000Z", description: "Sample data" },
          ]);
          setTotalPages(1);
          setTotalRecords(5);
        
      }
    } catch (err) {
      console.error('Error fetching action history:', err);
      setError('Failed to fetch action history');
      // Only use fallback data
        setActionHistoryData([
          { id: "#2051", device: "AIR_CONDITIONER", action: "ON", time: "14:20:11 24/08/2025", status: "Success" },
          { id: "#2050", device: "LED", action: "OFF", time: "14:05:47 24/08/2025", status: "Fail" },
          { id: "#2049", device: "FAN", action: "ON", time: "13:59:02 24/08/2025", status: "Success" },
          { id: "#2048", device: "AIR_CONDITIONER", action: "ON", time: "13:40:18 24/08/2025", status: "Success" },
          { id: "#2047", device: "LED", action: "OFF", time: "13:10:55 24/08/2025", status: "Fail" },
        ]);
        setTotalPages(1);
        setTotalRecords(5);
      
    } finally {
      setLoading(false);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchActionHistory();
  }, [currentPage, filterType, searchTerm, sortField, sortDirection]);

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
      <div className="search-filter-section" style={{display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap'}}>
        <div className="search-wrapper" style={{flex:1, display:'flex', alignItems:'center'}}>
          <BsSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by ID or date/time (YYYY-MM-DD)"
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
        <div className="filter-dropdown">
          <select value={filterType} onChange={(e)=>{ handleFilterChange(e); setCurrentPage(1); }}>
            <option value="ALL">ALL</option>
            <option value="LED1">Fan</option>
            <option value="LED2">Air Conditioner</option>
            <option value="LED3">Light</option>
          </select>
        </div>

        {/* Action filter always visible */}
        <div className="filter-dropdown">
          <select value={actionFilter} onChange={(e)=>{ setActionFilter(e.target.value); setCurrentPage(1); }}>
            <option value="any">Any</option>
            <option value="on">ON</option>
            <option value="off">OFF</option>
          </select>
        </div>

        {/* Sort controls (consistent with DataSensor layout) */}
        <div className="sort-controls" style={{display:'flex', gap:'8px'}}>
          <select value={sortField} onChange={(e)=>{ setSortField(e.target.value); setCurrentPage(1); }}>
            <option value="timestamp">Sort by Time</option>
            <option value="id">Sort by ID</option>
            <option value="device_name">Sort by Device</option>
            <option value="action">Sort by Action</option>
          </select>
          <select value={sortDirection} onChange={(e)=>{ setSortDirection(e.target.value); setCurrentPage(1); }}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
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
                  ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                {filterType === 'ALL' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Device {sortField === 'device_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'ALL' && <th onClick={() => handleSort('action')} className="sortable-header">
                  Action {sortField === 'action' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'ALL' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'ALL' && <th>Status</th>}
                {filterType === 'LED1' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Fan {sortField === 'device_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'LED1' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'LED2' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Air Conditioner {sortField === 'device_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'LED2' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'LED3' && <th onClick={() => handleSort('device_name')} className="sortable-header">
                  Light {sortField === 'device_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>}
                {filterType === 'LED3' && <th onClick={() => handleSort('timestamp')} className="sortable-header">
                  Time {sortField === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
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
                    {filterType === 'ALL' && (
                      <td className="time-cell">{new Date(item.timestamp).toLocaleString('vi-VN')}</td>
                    )}
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
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </td>
                    )}
                    {filterType === 'LED2' && (
                      <td className="device-cell">
                        {item.action.toUpperCase()}
                      </td>
                    )}
                    {filterType === 'LED2' && (
                      <td className="time-cell">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
                      </td>
                    )}
                    {filterType === 'LED3' && (
                      <td className="device-cell">
                        {item.action.toUpperCase()}
                      </td>
                    )}
                    {filterType === 'LED3' && (
                      <td className="time-cell">
                        {new Date(item.timestamp).toLocaleString('vi-VN')}
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
        <span>Total: {totalPages} pages</span>
      </div>

    </div>
  );
};

export default ActionHistory;