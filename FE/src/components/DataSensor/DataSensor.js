import React, { useState } from "react";
import "./DataSensor.css";

// Data Sensor Component
const DataSensor = () => {
  // State Management
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [currentPage] = useState(1);
  
  // Individual search filters
  const [temperatureFilter, setTemperatureFilter] = useState("");
  const [humidityFilter, setHumidityFilter] = useState("");
  const [lightFilter, setLightFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  
  // Sort state
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const totalPages = 40;

  // Handle search functionality
  const handleSearch = () => {
    const searchParams = {
      general: searchTerm,
      temperature: temperatureFilter,
      humidity: humidityFilter,
      light: lightFilter,
      time: timeFilter,
      sortField: sortField,
      sortDirection: sortDirection,
      page: currentPage
    };
    
    console.log('Searching with params:', searchParams);
    // TODO: Call backend API with search parameters
  };

  // Handle sort functionality
  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    
    // TODO: Call backend API for sorting
    console.log(`Sorting by ${field} in ${newDirection} direction`);
  };

  // Handle add sensor
  const handleAddSensor = () => {
    console.log('Add new sensor');
    // TODO: Open modal or navigate to add sensor page
  };

  const sensorData = [
    { id: "#1024", temperature: 22.4, humidity: 48, light: 720, time: "2025-08-24 09:15" },
    { id: "#1023", temperature: 22.1, humidity: 49, light: 680, time: "2025-08-24 09:00" },
    { id: "#1022", temperature: 21.9, humidity: 50, light: 640, time: "2025-08-24 08:45" },
    { id: "#1021", temperature: 21.7, humidity: 50, light: 610, time: "2025-08-24 08:30" },
    { id: "#1020", temperature: 21.6, humidity: 51, light: 580, time: "2025-08-24 08:15" },
    { id: "#1019", temperature: 21.4, humidity: 52, light: 550, time: "2025-08-24 08:00" },
    { id: "#1018", temperature: 21.2, humidity: 53, light: 520, time: "2025-08-24 07:45" },
    { id: "#1017", temperature: 21.0, humidity: 54, light: 490, time: "2025-08-24 07:30" },
    { id: "#1016", temperature: 20.8, humidity: 55, light: 460, time: "2025-08-24 07:15" },
    { id: "#1015", temperature: 20.6, humidity: 56, light: 430, time: "2025-08-24 07:00" },
  ];

  const renderPagination = () => {
    return (
      <>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <span className="ellipsis">...</span>
        <button className="page-btn">40</button>
      </>
    );
  };

  return (
    <div className="data-sensor-page">
      <div className="main-content">
        <div className="header">
          <h2>Data Sensor</h2>
          <div className="bell">🔔</div>
        </div>

         <div className="search-bar">
           <div className="search-wrapper">
             <span className="search-icon">🔍</span>
             <input
               type="text"
               placeholder="Search by ID, Temperature, Humidity, Light, or Time"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           <select
             value={filterType}
             onChange={(e) => setFilterType(e.target.value)}
             className="filter"
           >
             <option>All</option>
             <option>Temperature</option>
             <option>Humidity</option>
             <option>Light</option>
           </select>

           <button className="search-btn" onClick={handleSearch}>Search</button>
           <button className="add-sensor-btn" onClick={handleAddSensor}>+ Add Sensor</button>
         </div>

         {/* Individual Search Filters */}
         <div className="individual-filters">
           <div className="filter-group">
             <label>Temperature (°C):</label>
             <input
               type="number"
               placeholder="Min"
               value={temperatureFilter}
               onChange={(e) => setTemperatureFilter(e.target.value)}
               className="filter-input"
             />
           </div>
           
           <div className="filter-group">
             <label>Humidity (%):</label>
             <input
               type="number"
               placeholder="Min"
               value={humidityFilter}
               onChange={(e) => setHumidityFilter(e.target.value)}
               className="filter-input"
             />
           </div>
           
           <div className="filter-group">
             <label>Light (nits):</label>
             <input
               type="number"
               placeholder="Min"
               value={lightFilter}
               onChange={(e) => setLightFilter(e.target.value)}
               className="filter-input"
             />
           </div>
           
           <div className="filter-group">
             <label>Time Range:</label>
             <input
               type="text"
               placeholder="YYYY-MM-DD HH:MM"
               value={timeFilter}
               onChange={(e) => setTimeFilter(e.target.value)}
               className="filter-input"
             />
           </div>
         </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable-header">
                  ID 
                  <span className="arrow">
                    {sortField === 'id' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                  </span>
                </th>
                <th onClick={() => handleSort('temperature')} className="sortable-header">
                  Temperature (°C) 
                  <span className="arrow">
                    {sortField === 'temperature' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                  </span>
                </th>
                <th onClick={() => handleSort('humidity')} className="sortable-header">
                  Humidity (%) 
                  <span className="arrow">
                    {sortField === 'humidity' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                  </span>
                </th>
                <th onClick={() => handleSort('light')} className="sortable-header">
                  Light (nits) 
                  <span className="arrow">
                    {sortField === 'light' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                  </span>
                </th>
                <th onClick={() => handleSort('time')} className="sortable-header">
                  Time 
                  <span className="arrow">
                    {sortField === 'time' ? (sortDirection === 'asc' ? '↑' : '↓') : '↑↓'}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sensorData.map((row) => (
                <tr key={row.id}>
                  <td><span className="id-tag">{row.id}</span></td>
                  <td>{row.temperature}</td>
                  <td>{row.humidity}</td>
                  <td>{row.light}</td>
                  <td>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Showing {currentPage} of {totalPages} pages</span>
          <div className="pagination-controls">
            <button>&lt;</button>
            {renderPagination()}
            <button>&gt;</button>
          </div>
          <span>Total: {totalPages} pages</span>
         </div>
       </div>
     </div>
  );
};

export default DataSensor;
