import React, { useState, useEffect } from "react";
import "./DataSensor.css";
import apiService from "../../services/api";

// Data Sensor Component
const DataSensor = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [idSearch, setIdSearch] = useState("");
  
  // Individual search filters
  const [temperatureFilter, setTemperatureFilter] = useState("");
  const [humidityFilter, setHumidityFilter] = useState("");
  const [lightFilter, setLightFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  
  // Sort state
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  
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

      // If ID search is provided, search by ID directly
      if (idSearch.trim()) {
        try {
          const response = await apiService.getSensorDataById(parseInt(idSearch.trim()));
          if (response.success && response.data) {
            setSensorData([response.data]);
            setTotalPages(1);
            setTotalRecords(1);
          } else {
            setSensorData([]);
            setTotalPages(0);
            setTotalRecords(0);
          }
          return;
        } catch (err) {
          console.error('Error fetching by ID:', err);
          setSensorData([]);
          setTotalPages(0);
          setTotalRecords(0);
          return;
        }
      }

      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        filterType: filterType,
        temperature: temperatureFilter,
        humidity: humidityFilter,
        light: lightFilter,
        time: timeFilter,
        sortField: sortField,
        sortDirection: sortDirection
      };

      // Apply specific field filtering
      if (filterType !== 'All' && searchTerm) {
        // Clear general search and use specific field
        params.search = undefined;
        if (filterType === 'Temperature') {
          params.temperature = searchTerm;
        } else if (filterType === 'Humidity') {
          params.humidity = searchTerm;
        } else if (filterType === 'Light') {
          params.light = searchTerm;
        }
      }
      
      // Clear individual filters when using general search
      if (filterType === 'All' && searchTerm) {
        params.temperature = undefined;
        params.humidity = undefined;
        params.light = undefined;
        params.time = undefined;
      }

      const response = await apiService.getSensorData(params);
      
      console.log('DataSensor API Response:', response);
      
      if (response.success) {
        setSensorData(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.totalCount || 0);
        console.log('Pagination:', response.pagination);
      } else {
        setError(response.message || 'Failed to fetch sensor data');
        // Use sample data as fallback
        setSensorData([
          { id: "#1024", temperature: 22.4, humidity: 48, light: 720, time: "2025-08-24 09:15" },
          { id: "#1023", temperature: 22.1, humidity: 49, light: 680, time: "2025-08-24 09:00" },
          { id: "#1022", temperature: 21.9, humidity: 50, light: 640, time: "2025-08-24 08:45" },
          { id: "#1021", temperature: 21.7, humidity: 50, light: 610, time: "2025-08-24 08:30" },
          { id: "#1020", temperature: 21.6, humidity: 51, light: 580, time: "2025-08-24 08:15" },
        ]);
        setTotalPages(1);
        setTotalRecords(5);
      }
    } catch (err) {
      console.error('Error fetching sensor data:', err);
      setError('Failed to fetch sensor data');
      // Use sample data as fallback
      setSensorData([
        { id: "#1024", temperature: 22.4, humidity: 48, light: 720, time: "2025-08-24 09:15" },
        { id: "#1023", temperature: 22.1, humidity: 49, light: 680, time: "2025-08-24 09:00" },
        { id: "#1022", temperature: 21.9, humidity: 50, light: 640, time: "2025-08-24 08:45" },
        { id: "#1021", temperature: 21.7, humidity: 50, light: 610, time: "2025-08-24 08:30" },
        { id: "#1020", temperature: 21.6, humidity: 51, light: 580, time: "2025-08-24 08:15" },
      ]);
      setTotalPages(1);
      setTotalRecords(5);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchSensorData();
  }, [currentPage, searchTerm, filterType, temperatureFilter, humidityFilter, lightFilter, timeFilter, idSearch, sortField, sortDirection]);

  // Auto-refresh data every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPage === 1) { // Only auto-refresh on first page
        fetchSensorData();
      }
    }, 10000);
    
    return () => clearInterval(interval);
  }, [currentPage]);

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle ID search change
  const handleIdSearchChange = (e) => {
    setIdSearch(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("All");
    setTemperatureFilter("");
    setHumidityFilter("");
    setLightFilter("");
    setTimeFilter("");
    setIdSearch("");
    setSortField("");
    setSortDirection("asc");
    setCurrentPage(1);
  };

  // Handle add sensor
  const handleAddSensor = () => {
    console.log('Add new sensor');
    // TODO: Open modal or navigate to add sensor page
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
      <div className="header">
        <h2>Data Sensor</h2>
      </div>

         <div className="search-bar">
           <div className="search-wrapper">
             <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder={
                    filterType === 'Temperature' ? 'Enter exact temperature value (e.g., 34.5)' :
                    filterType === 'Humidity' ? 'Enter exact humidity value (e.g., 57)' :
                    filterType === 'Light' ? 'Enter exact light value (e.g., 200)' :
                    'Search exact values: ID, Temperature, Humidity, Light, or Time'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
           </div>

           <div className="id-search-wrapper">
             <span className="search-icon">#</span>
             <input
               type="number"
               placeholder="Search by ID (e.g., 123)"
               value={idSearch}
               onChange={handleIdSearchChange}
             />
           </div>

           <select
             value={filterType}
             onChange={(e) => {
               setFilterType(e.target.value);
               setSearchTerm(''); // Clear search term when changing filter type
               // Clear individual filters when changing filter type
               setTemperatureFilter('');
               setHumidityFilter('');
               setLightFilter('');
               setTimeFilter('');
             }}
             className="filter"
           >
             <option>All</option>
             <option>Temperature</option>
             <option>Humidity</option>
             <option>Light</option>
           </select>

           <button className="search-btn" onClick={fetchSensorData}>Search</button>
           <button className="add-sensor-btn" onClick={handleAddSensor}>+ Add Sensor</button>
         </div>

         {/* Individual Search Filters */}
         <div className="individual-filters">
           <div className="filter-group">
             <label>Temperature (°C):</label>
             <input
               type="number"
               placeholder="Min value"
               value={temperatureFilter}
               onChange={(e) => setTemperatureFilter(e.target.value)}
               className="filter-input"
             />
           </div>
           
           <div className="filter-group">
             <label>Humidity (%):</label>
             <input
               type="number"
               placeholder="Min value"
               value={humidityFilter}
               onChange={(e) => setHumidityFilter(e.target.value)}
               className="filter-input"
             />
           </div>
           
           <div className="filter-group">
             <label>Light (nits):</label>
             <input
               type="number"
               placeholder="Min value"
               value={lightFilter}
               onChange={(e) => setLightFilter(e.target.value)}
               className="filter-input"
             />
           </div>
           
           <div className="filter-group">
             <label>Time Range:</label>
             <input
               type="datetime-local"
               value={timeFilter}
               onChange={(e) => setTimeFilter(e.target.value)}
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
                        {filterType === 'Temperature' && <td>{row.temperature}</td>}
                        {filterType === 'Temperature' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                        {filterType === 'Humidity' && <td>{row.humidity}</td>}
                        {filterType === 'Humidity' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                        {filterType === 'Light' && <td>{row.light}</td>}
                        {filterType === 'Light' && <td>{new Date(row.time).toLocaleString('vi-VN')}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={filterType === 'All' ? "5" : "3"} className="no-data">
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
     </div>
  );
};

export default DataSensor;