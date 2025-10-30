import React, { useState, useEffect, useCallback } from "react";
import "./DataSensor.css";
import apiService from "../../services/api";
import webSocketService from "../../services/websocket";

// --- CÁC HÀM TIỆN ÍCH CHO TÌM KIẾM THỜI GIAN ---

// Hàm parse thời gian linh hoạt (chấp nhận nhiều định dạng)
function parseFlexibleDateTime(input) {
  if (!input) return null;
  const txt = String(input).trim().replace(',', '');
  let d = new Date(txt);
  if (!isNaN(d.getTime())) return d;

  let m = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    d = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10), parseInt(m[4] || '0', 10), parseInt(m[5] || '0', 10), parseInt(m[6] || '0', 10));
    if (!isNaN(d.getTime())) return d;
  }

  m = txt.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10), parseInt(m[4] || '0', 10), parseInt(m[5] || '0', 10), parseInt(m[6] || '0', 10));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

// Hàm so sánh hai thời gian có cùng giây hay không
function isSameSecond(a, b) {
  return a && b && a.getTime() - (a.getTime() % 1000) === b.getTime() - (b.getTime() % 1000);
}

// --- COMPONENT CHÍNH ---

const DataSensor = () => {
  // Các state để quản lý input của người dùng
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [timeSearch, setTimeSearch] = useState("");
  
  // State cho logic phân trang và sắp xếp
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("time");
  const [sortDirection, setSortDirection] = useState("desc");
  
  // State cho dữ liệu và modal
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

  // Hàm fetch dữ liệu được cập nhật
  const fetchSensorData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Logic tìm kiếm thời gian thông minh
      const hasTimeInSearch = /(\d{1,2}:\d{2})/.test(searchTerm);
      let effectiveTimeSearch = timeSearch;
      if (hasTimeInSearch) {
          const parsedDate = parseFlexibleDateTime(searchTerm);
          if (parsedDate) {
              // Gửi ngày lên backend để lọc trước
              effectiveTimeSearch = parsedDate.toISOString().split('T')[0];
          }
      }

      const params = {
        page: currentPage,
        limit: 11,
        sortColumn: sortField,
        sortDirection: sortDirection,
        searchQuery: searchTerm.trim(),
        filterType: filterType,
        timeSearch: effectiveTimeSearch
      };

      const response = await apiService.getSensorData(params);
      
      if (response && response.data && Array.isArray(response.data)) {
        let finalData = response.data;
        // Nếu người dùng tìm theo thời gian chính xác, lọc lại ở frontend
        if (hasTimeInSearch) {
            const targetDate = parseFlexibleDateTime(searchTerm);
            if (targetDate) {
                const exactMatch = finalData.filter(row => isSameSecond(new Date(row.time), targetDate));
                if (exactMatch.length > 0) {
                    finalData = exactMatch;
                }
            }
        }
        setSensorData(finalData);
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
  }, [currentPage, searchTerm, filterType, timeSearch, sortField, sortDirection]);

  // useEffect để gọi fetchSensorData
  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);
  
  // WebSocket và các hàm xử lý modal giữ nguyên
  useEffect(() => {
    const handleUpdate = () => {
      if (currentPage === 1 && !searchTerm && filterType === 'All' && !timeSearch) {
        fetchSensorData();
      }
    };
    const unsubscribe = webSocketService.on('sensorData', handleUpdate);
    return () => unsubscribe();
  }, [currentPage, searchTerm, filterType, timeSearch, fetchSensorData]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleAddSensor = () => setShowAddModal(true);
  const handleCloseModal = () => { /* ... */ };
  const handleInputChange = (e) => { /* ... */ };
  const handleSubmitSensor = async (e) => { /* ... */ };
  const renderPagination = () => { /* ... */ };

  return (
    <div className="data-sensor-page">
      {/* Giao diện JSX của bạn được giữ nguyên hoàn toàn */}
      <div className="header">
        <h1 className="page-title">Data Sensor</h1>
      </div>
      <div className="search-bar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={'Search by ID or paste full time...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchSensorData()}
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
      </div>
      <div className="individual-filters">
        <div className="filter-group">
          <input
            type="date"
            value={timeSearch}
            onChange={(e) => setTimeSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchSensorData()}
            className="filter-input"
          />
        </div>
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
                {sensorData.length > 0 ? (
                  sensorData.map((row) => (
                    <tr key={row.id}>
                      <td><span className="id-tag">{row.id}</span></td>
                      <td>{row.temperature}</td>
                      <td>{row.humidity}</td>
                      <td>{row.light}</td>
                      <td>{new Date(row.time).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">
                      <p>🔍 No results found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination and Modal JSX không đổi */}
    </div>
  );
};

export default DataSensor;