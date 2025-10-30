import React, { useState, useEffect } from "react";
import "./DataSensor.css";
import apiService from "../../services/api";
import webSocketService from "../../services/websocket";

// Data Sensor Component
const DataSensor = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [timeSearch, setTimeSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSensor, setNewSensor] = useState({
    temperature: '',
    humidity: '',
    light: '',
    datetime: ''
  });
  
  // Sort state - default to newest first
  const [sortField, setSortField] = useState("time");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // Data state
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Fetch sensor data from backend
  const fetchSensorData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build search parameters - default to newest first
      const params = {
        page: currentPage,
        limit: 10,
        sortColumn: sortField || "time",
        sortDirection: sortDirection || "desc"
      };

      // Handle search - ID search and specific value search
      if (searchTerm.trim()) {
        // Check if search term is a number (ID search)
        if (!isNaN(searchTerm.trim()) && searchTerm.trim() !== '') {
          params.searchQuery = searchTerm.trim();
          params.filterType = 'id';
        } else {
          // Search by specific values (temperature, humidity, light)
          params.searchQuery = searchTerm.trim();
          params.filterType = filterType === 'All' ? undefined : filterType.toLowerCase();
          // Keep newest first for value searches too
          params.sortColumn = filterType === 'All' ? 'time' : filterType.toLowerCase();
          params.sortDirection = 'desc';
        }
      }

      // Add time range search if provided
      if (timeSearch.trim()) {
        params.searchQuery = timeSearch.trim();
        params.filterType = 'timestamp';
      }

      const response = await apiService.getSensorData(params);
      
      console.log('DataSensor API Response:', response);
      console.log('Response data:', response.data);
      console.log('Response pagination:', response.pagination);
      
      if (response && response.data && Array.isArray(response.data)) {
        console.log('Setting sensor data:', response.data);
        setSensorData(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
        setError(null); // Clear any previous errors
      } else {
        console.log('No valid data received, setting empty array');
        setError('No data received from server');
        setSensorData([]);
        setTotalPages(0);
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Error fetching sensor data:', err);
      setError('Failed to fetch sensor data');
      setSensorData([]);
      setTotalPages(0);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSensorData();
  }, [currentPage, searchTerm, filterType, timeSearch, sortField, sortDirection]);

  // Auto-refresh data every 10 seconds (only when ESP32 connected)
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if ESP32 is connected and on first page
      if (currentPage === 1) {
        fetchSensorData();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentPage]);

  // WebSocket listener for real-time data updates
  useEffect(() => {
    let unsubscribeSensorData, unsubscribeDataStatus;
    
    try {
      unsubscribeSensorData = webSocketService.on('sensorData', (newData) => {
        console.log('Received real-time sensor data for DataSensor:', newData);
        // Only refresh data when new sensor data arrives and ESP32 is connected
        fetchSensorData();
      });

      unsubscribeDataStatus = webSocketService.on('dataStatus', (data) => {
        console.log('ESP32 Data Status in DataSensor:', data);
        // Refresh data when connection status changes
        fetchSensorData();
      });
    } catch (error) {
      console.error('Error setting up WebSocket listeners in DataSensor:', error);
    }

    return () => {
      try {
        if (unsubscribeSensorData) unsubscribeSensorData();
        if (unsubscribeDataStatus) unsubscribeDataStatus();
      } catch (error) {
        console.error('Error cleaning up WebSocket listeners in DataSensor:', error);
      }
    };
  }, [currentPage, searchTerm, timeSearch]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to newest first
    }
  };

  // Fetch data when sort changes
  useEffect(() => {
    fetchSensorData();
  }, [sortField, sortDirection]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("All");
    setTimeSearch("");
    setSortField("time");
    setSortDirection("desc");
    setCurrentPage(1);
  };

  // Handle add sensor
  const handleAddSensor = () => {
    setShowAddModal(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewSensor({
      temperature: '',
      humidity: '',
      light: '',
      datetime: ''
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSensor(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submit
  const handleSubmitSensor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await apiService.post('/sensor-data', newSensor);
      if (response.success) {
        console.log('Sensor added successfully:', response);
        handleCloseModal();
        fetchSensorData(); // Refresh data
      }
    } catch (error) {
      console.error('Error adding sensor:', error);
    } finally {
      setLoading(false);
    }
  };

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
        pages.push(<span key="ellipsis1" className="ellipsis">...</span>);
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
        pages.push(<span key="ellipsis2" className="ellipsis">...</span>);
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

  return (
    <div className="data-sensor-page">
      {/* Header */}
      <div className="header">
        <h1 className="page-title">Data Sensor</h1>
      </div>

      {/* Search and Filter Section */}
      <div className="search-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={
              filterType === 'Temperature' ? 'Enter temperature value (shows from low to high)' :
              filterType === 'Humidity' ? 'Enter humidity value (shows from low to high)' :
              filterType === 'Light' ? 'Enter light value (shows from low to high)' :
              'Search by ID or specific values'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchSensorData();
              }
            }}
          />
        </div>
        
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setSearchTerm(''); // Clear search term when changing filter type
          }}
          className="filter"
        >
          <option>All</option>
          <option>Temperature</option>
          <option>Humidity</option>
          <option>Light</option>
        </select>

        <button
          className="search-btn"
          onClick={() => {
            setCurrentPage(1);
            fetchSensorData();
          }}
          style={{marginLeft: '10px', padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
        >
          Search
        </button>
        
        <button className="add-sensor-btn" onClick={handleAddSensor}>+ Add Sensor</button>
        {timeSearch && (
          <button 
            className="clear-time-btn"
            onClick={() => {
              setTimeSearch('');
              fetchSensorData();
            }}
          >
            Clear Time Filter
          </button>
        )}
      </div>

      {/* Individual Search Filters */}
      <div className="individual-filters">
        <div className="filter-group">
          <label>Search Before Time:</label>
          <input
            type="datetime-local"
            placeholder="mm/dd/yyyy --:--"
            value={timeSearch}
            onChange={(e) => setTimeSearch(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                fetchSensorData();
              }
            }}
            className="filter-input"
          />
        </div>
      </div>

        <div className="table-container">
          {loading ? (
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Loading sensor data...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={fetchSensorData} className="retry-btn">Retry</button>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} className="sortable-header">
                      ID 
                      <span className="arrow">
                        {sortField === 'id' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                      </span>
                    </th>
                    {filterType === 'All' && (
                      <th onClick={() => handleSort('temperature')} className="sortable-header">
                        Temperature (°C) 
                        <span className="arrow">
                          {sortField === 'temperature' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'All' && (
                      <th onClick={() => handleSort('humidity')} className="sortable-header">
                        Humidity (%) 
                        <span className="arrow">
                          {sortField === 'humidity' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'All' && (
                      <th onClick={() => handleSort('light')} className="sortable-header">
                        Light (nits) 
                        <span className="arrow">
                          {sortField === 'light' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'All' && (
                      <th onClick={() => handleSort('time')} className="sortable-header">
                        Time 
                        <span className="arrow">
                          {sortField === 'time' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'All' && (
                      <th onClick={() => handleSort('timeRange')} className="sortable-header">
                        Time Range 
                        <span className="arrow">
                          {sortField === 'timeRange' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Temperature' && (
                      <th onClick={() => handleSort('temperature')} className="sortable-header">
                        Temperature (°C) 
                        <span className="arrow">
                          {sortField === 'temperature' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Temperature' && (
                      <th onClick={() => handleSort('time')} className="sortable-header">
                        Time 
                        <span className="arrow">
                          {sortField === 'time' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Temperature' && (
                      <th onClick={() => handleSort('timeRange')} className="sortable-header">
                        Time Range 
                        <span className="arrow">
                          {sortField === 'timeRange' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Humidity' && (
                      <th onClick={() => handleSort('humidity')} className="sortable-header">
                        Humidity (%) 
                        <span className="arrow">
                          {sortField === 'humidity' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Humidity' && (
                      <th onClick={() => handleSort('time')} className="sortable-header">
                        Time 
                        <span className="arrow">
                          {sortField === 'time' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Humidity' && (
                      <th onClick={() => handleSort('timeRange')} className="sortable-header">
                        Time Range 
                        <span className="arrow">
                          {sortField === 'timeRange' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Light' && (
                      <th onClick={() => handleSort('light')} className="sortable-header">
                        Light (nits) 
                        <span className="arrow">
                          {sortField === 'light' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Light' && (
                      <th onClick={() => handleSort('time')} className="sortable-header">
                        Time 
                        <span className="arrow">
                          {sortField === 'time' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                    {filterType === 'Light' && (
                      <th onClick={() => handleSort('timeRange')} className="sortable-header">
                        Time Range 
                        <span className="arrow">
                          {sortField === 'timeRange' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                        </span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sensorData.length > 0 ? (
                    sensorData.map((row) => (
                      <tr key={row.id}>
                        <td><span className="id-tag">{row.id}</span></td>
                        {filterType === 'All' && <td>{row.temperature}</td>}
                        {filterType === 'All' && <td>{row.humidity}</td>}
                        {filterType === 'All' && <td>{row.light}</td>}
                        {filterType === 'All' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                        {filterType === 'All' && <td>{new Date(row.time).toLocaleDateString('vi-VN')}</td>}
                        {filterType === 'Temperature' && <td>{row.temperature}</td>}
                        {filterType === 'Temperature' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                        {filterType === 'Temperature' && <td>{new Date(row.time).toLocaleDateString('vi-VN')}</td>}
                        {filterType === 'Humidity' && <td>{row.humidity}</td>}
                        {filterType === 'Humidity' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                        {filterType === 'Humidity' && <td>{new Date(row.time).toLocaleDateString('vi-VN')}</td>}
                        {filterType === 'Light' && <td>{row.light}</td>}
                        {filterType === 'Light' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                        {filterType === 'Light' && <td>{new Date(row.time).toLocaleDateString('vi-VN')}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={filterType === 'All' ? "6" : "4"} className="no-data">
                        <div className="no-data-message">
                          <p>🔍 Không tìm thấy kết quả nào</p>
                          <p>Thử thay đổi điều kiện lọc hoặc tìm kiếm</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>

        <div className="pagination">
          <span>Showing {currentPage} of {totalPages} pages</span>
          <div className="pagination-controls">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </button>
            {renderPagination()}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              &gt;
            </button>
          </div>
          <span>Total: {totalRecords} records</span>
         </div>


         {/* Add Sensor Modal */}
         {showAddModal && (
           <div className="modal-overlay">
             <div className="modal-content">
               <div className="modal-header">
                 <h3>Add New Sensor Data</h3>
                 <button className="modal-close" onClick={handleCloseModal}>×</button>
               </div>
               <form onSubmit={handleSubmitSensor} className="modal-form">
                 <div className="form-group">
                   <label>Temperature (°C):</label>
                   <input
                     type="number"
                     step="0.1"
                     name="temperature"
                     value={newSensor.temperature}
                     onChange={handleInputChange}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label>Humidity (%):</label>
                   <input
                     type="number"
                     name="humidity"
                     value={newSensor.humidity}
                     onChange={handleInputChange}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label>Light (nits):</label>
                   <input
                     type="number"
                     name="light"
                     value={newSensor.light}
                     onChange={handleInputChange}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label>Date & Time:</label>
                   <input
                     type="datetime-local"
                     name="datetime"
                     value={newSensor.datetime}
                     onChange={handleInputChange}
                     required
                   />
                 </div>
                 <div className="modal-actions">
                   <button type="button" onClick={handleCloseModal} className="btn-cancel">
                     Cancel
                   </button>
                   <button type="submit" className="btn-submit">
                     Add Sensor
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}
     </div>
  );
};

export default DataSensor;