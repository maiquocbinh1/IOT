import React, { useState, useEffect, useCallback } from "react";
import "./DataSensor.css";
import apiService from "../../services/api";
import webSocketService from "../../services/websocket";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

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

const DataSensor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("time");
  const [sortDirection, setSortDirection] = useState("desc");
  
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSensor, setNewSensor] = useState({
    temperature: '',
    humidity: '',
    light: '',
    datetime: ''
  });
  
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchSensorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: 13,
        search: searchTerm.trim(),
        sortKey: sortField,
        sortDirection: sortDirection === 'asc' ? 'ascending' : 'descending'
      };

      const response = await apiService.getSensorData(params);
      
      if (response && response.data && Array.isArray(response.data)) {
        setSensorData(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalRecords(response.pagination?.total || 0);
      } else {
        setError('No data received from server');
        setSensorData([]);
      }
    } catch (err) {
      setError('Failed to fetch sensor data');
      setSensorData([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortField, sortDirection]);

  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchSensorData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [debouncedSearchTerm, sortField, sortDirection]);

  // Auto-sync sort field with filter type
  useEffect(() => {
    if (filterType === 'All') {
      setSortField('time');
    } else {
      setSortField(filterType.toLowerCase());
    }
  }, [filterType]);

  useEffect(() => {
    const handleUpdate = () => {
      if (currentPage === 1 && !searchTerm && filterType === 'All') {
        fetchSensorData();
      }
    };
    const unsubscribe = webSocketService.on('sensorData', handleUpdate);
    return () => unsubscribe();
  }, [currentPage, searchTerm, filterType, fetchSensorData]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleAddSensor = () => setShowAddModal(true);
  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewSensor({ temperature: '', humidity: '', light: '', datetime: '' });
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSensor(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmitSensor = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await apiService.post('/sensor-data', newSensor);
      if (response.success) {
        handleCloseModal();
        fetchSensorData();
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
          <button key={i} className={`page-btn ${currentPage === i ? 'active' : ''}`} onClick={() => handlePageChange(i)}>
            {i}
          </button>
        );
      }
    } else {
      pages.push(
        <button key={1} className={`page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => handlePageChange(1)}>1</button>
      );
      if (currentPage > 3) pages.push(<span key="el1" className="ellipsis">...</span>);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(
          <button key={i} className={`page-btn ${currentPage === i ? 'active' : ''}`} onClick={() => handlePageChange(i)}>{i}</button>
        );
      }
      if (currentPage < totalPages - 2) pages.push(<span key="el2" className="ellipsis">...</span>);
      pages.push(
        <button key={totalPages} className={`page-btn ${currentPage === totalPages ? 'active' : ''}`} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="data-sensor-page">
      <div className="header">
        <h1 className="page-title">Data Sensor</h1>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by ID, temp, humidity, light, or date/time"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter">
          <option>All</option>
          <option>Temperature</option>
          <option>Humidity</option>
          <option>Light</option>
        </select>
        <select
          value={sortDirection}
          onChange={(e) => setSortDirection(e.target.value)}
          className="filter"
          style={{ marginLeft: '10px' }}
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <button className="add-sensor-btn" onClick={handleAddSensor}>+ Add Sensor</button>
      </div>
      
      <div className="table-container">
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                {(filterType === 'All' || filterType === 'Temperature') && <th>Temperature (°C)</th>}
                {(filterType === 'All' || filterType === 'Humidity') && <th>Humidity (%)</th>}
                {(filterType === 'All' || filterType === 'Light') && <th>Light (nits)</th>}
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {sensorData.length > 0 ? (
                sensorData.map((row) => (
                  <tr key={row.id}>
                    <td><span className="id-tag">{row.id}</span></td>
                    {(filterType === 'All' || filterType === 'Temperature') && <td>{row.temperature}</td>}
                    {(filterType === 'All' || filterType === 'Humidity') && <td>{row.humidity}</td>}
                    {(filterType === 'All' || filterType === 'Light') && <td>{row.light}</td>}
                    <td>{getFormattedDate(row.time)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={filterType === 'All' ? 5 : 3} className="no-data">
                    <p>🔍 No results found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="pagination">
        <span>Showing {currentPage} of {totalPages} pages</span>
        <div className="pagination-controls">
          <button className="page-btn prev" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
            ‹
          </button>
          {renderPagination()}
          <button className="page-btn next" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
            ›
          </button>
        </div>
        <span>Total: {totalRecords} records</span>
      </div>

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
                <input type="number" step="0.1" name="temperature" value={newSensor.temperature} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Humidity (%):</label>
                <input type="number" name="humidity" value={newSensor.humidity} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Light (nits):</label>
                <input type="number" name="light" value={newSensor.light} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Date & Time:</label>
                <input type="datetime-local" name="datetime" value={newSensor.datetime} onChange={handleInputChange} required />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseModal} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-submit">Add Sensor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSensor;
