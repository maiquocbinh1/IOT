import React, { useState, useEffect, useCallback } from "react";
import "./DataSensor.css";
import apiService from "../../services/api";
import webSocketService from "../../services/websocket";

//searchbar


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

// Định dạng thời gian theo local thành 'YYYY-MM-DD HH:mm:ss' (không lệch múi giờ)
function formatLocalYMDHMS(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const MM = String(date.getMinutes()).padStart(2, '0');
  const SS = String(date.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

// --- COMPONENT CHÍNH ---

const DataSensor = () => {
  // Các state để quản lý input của người dùng
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  
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

      // Logic tìm kiếm thời gian thông minh (hỗ trợ hh:mm hoặc hh:mm:ss)
      const hasTimeInSearch = /(\d{1,2}:\d{2}(:\d{2})?)/.test(searchTerm);
      let effectiveTimeSearch = '';
      let exactTimeParam = '';
      if (hasTimeInSearch) {
          const parsedDate = parseFlexibleDateTime(searchTerm);
          console.log("🕓 Parsed date:", parsedDate);
          if (parsedDate) {
              // timeExact: chính xác tới giây; backend sẽ ưu tiên và bỏ qua range khác
              exactTimeParam = formatLocalYMDHMS(parsedDate);
              console.log("✅ timeExact:", exactTimeParam);
              // Đồng thời trích ngày (phòng trường hợp BE cũ); nhưng khi gửi timeExact sẽ không gửi timeSearch
              effectiveTimeSearch = formatLocalYMDHMS(parsedDate).slice(0, 10);
          }
      }

      const params = {
        page: currentPage,
        limit: hasTimeInSearch ? 1 : 13,
        sortColumn: sortField,
        sortDirection: sortDirection,
        // If user pasted a full time, don't send raw text to backend; rely on day filter
        searchQuery: hasTimeInSearch ? '' : searchTerm.trim(),
        filterType: filterType.toLowerCase(),
        ...(exactTimeParam ? { timeExact: exactTimeParam, time: exactTimeParam } : (effectiveTimeSearch ? { timeSearch: effectiveTimeSearch } : {})),
        // Hint backend to select minimal columns when filtering a metric
        ...(filterType !== 'All' ? { columnFilter: filterType.toLowerCase() } : {})
      };

      console.log("🚀 Params gửi lên:", params);
      const response = await apiService.getSensorData(params);
      
      if (response && response.data && Array.isArray(response.data)) {
        let finalData = response.data;

        // Debug params và kết quả
        console.log(" Params gửi lên:", params);
        console.log(" Records received:", finalData.length);

        // Luôn đảm bảo khi tìm theo thời gian đầy đủ chỉ hiển thị đúng 1 bản ghi
        if (hasTimeInSearch) {
          // So khớp bằng chuỗi local yyyy-MM-dd HH:mm:ss để tránh lệch múi giờ
          const parsed = parseFlexibleDateTime(searchTerm);
          const targetStr = parsed ? formatLocalYMDHMS(parsed) : '';
          if (targetStr) {
            finalData = finalData.filter((row) => {
              const rowStr = formatLocalYMDHMS(new Date(row.time));
              return rowStr === targetStr;
            }).slice(0, 1);
          } else {
            // Fallback theo Date nếu không parse được
            const targetDate = parseFlexibleDateTime(searchTerm);
            if (targetDate) {
              const exactMatch = finalData.filter(row => isSameSecond(new Date(row.time), targetDate));
              finalData = exactMatch.length > 0 ? exactMatch.slice(0, 1) : [];
            } else {
              finalData = [];
            }
          }
        }

        setSensorData(finalData);
        // Khi tìm theo thời gian đầy đủ, hiển thị duy nhất 1 bản ghi và cập nhật phân trang cho khớp
        if (hasTimeInSearch) {
          setTotalPages(1);
          setTotalRecords(finalData.length);
        } else {
          setTotalPages(response.pagination?.totalPages || 1);
          setTotalRecords(response.pagination?.total || finalData.length || 0);
        }
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
  }, [currentPage, searchTerm, filterType, sortField, sortDirection]);

  // useEffect để gọi fetchSensorData
  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  // Đồng bộ sortField với filterType (bỏ chọn Sort by thủ công)
  useEffect(() => {
    if (filterType === 'All') {
      setSortField('time');
    } else {
      setSortField(filterType.toLowerCase());
    }
  }, [filterType]);
  
  // WebSocket và các hàm xử lý modal giữ nguyên
  useEffect(() => {
    const handleUpdate = () => {
      if (currentPage === 1 && !searchTerm && filterType === 'All') {
        fetchSensorData();
      }
    };
    const unsubscribe = webSocketService.on('sensorData', handleUpdate);
    return () => unsubscribe();
  }, [currentPage, searchTerm, filterType, fetchSensorData]);

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

  // Pagination renderer
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
      pages.push(
        <button
          key={1}
          className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => setCurrentPage(1)}
        >
          1
        </button>
      );
      if (currentPage > 3) pages.push(<span key="el1" className="ellipsis">...</span>);
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
      if (currentPage < totalPages - 2) pages.push(<span key="el2" className="ellipsis">...</span>);
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
    return pages;
  };

  return (
    <div className="data-sensor-page">
      {/*  */}
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
        {/* Global direction control only */}
        <select
          value={sortDirection}
          onChange={(e) => { setSortDirection(e.target.value); setCurrentPage(1); }}
          className="filter"
          style={{ marginLeft: '10px' }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        <button className="add-sensor-btn" onClick={handleAddSensor}>+ Add Sensor</button>
      </div>
      {/* Date filter removed as requested */}
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
                  {(filterType === 'All' || filterType === 'Temperature') && (
                    <th>Temperature (°C)</th>
                  )}
                  {(filterType === 'All' || filterType === 'Humidity') && (
                    <th>Humidity (%)</th>
                  )}
                  {(filterType === 'All' || filterType === 'Light') && (
                    <th>Light (nits)</th>
                  )}
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {sensorData.length > 0 ? (
                  sensorData.map((row) => (
                    <tr key={row.id}>
                      <td><span className="id-tag">{row.id}</span></td>
                      {(filterType === 'All' || filterType === 'Temperature') && (
                        <td>{row.temperature}</td>
                      )}
                      {(filterType === 'All' || filterType === 'Humidity') && (
                        <td>{row.humidity}</td>
                      )}
                      {(filterType === 'All' || filterType === 'Light') && (
                        <td>{row.light}</td>
                      )}
                      <td>{new Date(row.time).toLocaleString('vi-VN')}</td>
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
        
        {/* Pagination */}
        <div className="pagination">
          <span>Showing {currentPage} of {totalPages} pages</span>
          <div className="pagination-controls">
            <button
              className="page-btn prev"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              ‹
            </button>
            {renderPagination()}
            <button
              className="page-btn next"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              ›
            </button>
          </div>
          <span>Total: {totalRecords} records</span>
        </div>

        {/* Modal JSX giữ nguyên */}
    </div>
  );
};

export default DataSensor;