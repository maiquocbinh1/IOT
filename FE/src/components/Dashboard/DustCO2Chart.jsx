import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './DustCO2Chart.css';
import apiService from '../../services/api';
import webSocketService from '../../services/websocket';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Helper function to parse backend datetime format
function parseBackendDateTime(dateTimeString) {
  if (!dateTimeString) return new Date();
  
  if (/^\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}$/.test(dateTimeString)) {
    const [datePart, timePart] = dateTimeString.split(', ');
    const [day, month, year] = datePart.split('/');
    const [hours, minutes, seconds] = timePart.split(':');
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }
  
  const dateMatch = dateTimeString.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (dateMatch) {
    return new Date(dateMatch[1], dateMatch[2] - 1, dateMatch[3], dateMatch[4], dateMatch[5], dateMatch[6]);
  }
  
  try {
    const date = new Date(dateTimeString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    console.warn('Cannot parse date:', dateTimeString);
  }
  
  return new Date();
}

const DustCO2Chart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esp32Connected, setEsp32Connected] = useState(false);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getSensorData({
          limit: 10,
          page: 1
        });
        
        let data;
        if (response && response.data && response.data.length > 0) {
          data = response.data.slice(0, 10).reverse().map((item) => {
            const date = parseBackendDateTime(item.time);
            const timeDisplay = item.time.includes(',') ? item.time.split(', ')[1] : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return {
              time: timeDisplay,
              dust: parseInt(item.dust || 0),
              co2: parseInt(item.co2 || 0)
            };
          });
        } else {
          const now = new Date();
          data = [
            { time: new Date(now.getTime() - 9*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 50, co2: 5 },
            { time: new Date(now.getTime() - 8*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 100, co2: 10 },
            { time: new Date(now.getTime() - 7*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 150, co2: 15 },
            { time: new Date(now.getTime() - 6*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 300, co2: 30 },
            { time: new Date(now.getTime() - 5*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 350, co2: 35 },
            { time: new Date(now.getTime() - 4*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 400, co2: 40 },
            { time: new Date(now.getTime() - 3*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 380, co2: 38 },
            { time: new Date(now.getTime() - 2*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 420, co2: 42 },
            { time: new Date(now.getTime() - 1*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 450, co2: 45 },
            { time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 400, co2: 40 }
          ];
        }
        
        const chartDataConfig = {
          labels: data.map(item => item.time),
          datasets: [
            {
              label: 'Dust (0-1000)',
              data: data.map(item => item.dust),
              borderColor: '#ff6b6b',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#ff6b6b',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              yAxisID: 'y'
            },
            {
              label: 'CO2 (0-100)',
              data: data.map(item => item.co2),
              borderColor: '#4ecdc4',
              backgroundColor: 'rgba(78, 205, 196, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#4ecdc4',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              yAxisID: 'y1'
            }
          ]
        };
        
        setChartData(chartDataConfig);
      } catch (err) {
        console.error('Error loading chart data:', err);
        const now = new Date();
        const fallbackData = [
          { time: new Date(now.getTime() - 6*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 300, co2: 30 },
          { time: new Date(now.getTime() - 5*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 350, co2: 35 },
          { time: new Date(now.getTime() - 4*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 400, co2: 40 },
          { time: new Date(now.getTime() - 3*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 380, co2: 38 },
          { time: new Date(now.getTime() - 2*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 420, co2: 42 },
          { time: new Date(now.getTime() - 1*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 450, co2: 45 },
          { time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), dust: 400, co2: 40 }
        ];
        
        const chartDataConfig = {
          labels: fallbackData.map(item => item.time),
          datasets: [
            {
              label: 'Dust (0-1000)',
              data: fallbackData.map(item => item.dust),
              borderColor: '#ff6b6b',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#ff6b6b',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              yAxisID: 'y'
            },
            {
              label: 'CO2 (0-100)',
              data: fallbackData.map(item => item.co2),
              borderColor: '#4ecdc4',
              backgroundColor: 'rgba(78, 205, 196, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#4ecdc4',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
              yAxisID: 'y1'
            }
          ]
        };
        setChartData(chartDataConfig);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
    
    // Real-time updates
           const interval = setInterval(async () => {
             try {
               const response = await apiService.getSensorData({ limit: 10, page: 1 });
        if (response && response.data && response.data.length > 0) {
          const data = response.data.slice(0, 10).reverse().map((item) => {
            const date = parseBackendDateTime(item.time);
            const timeDisplay = item.time.includes(',') ? item.time.split(', ')[1] : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return {
              time: timeDisplay,
              dust: parseInt(item.dust || 0),
              co2: parseInt(item.co2 || 0)
            };
          });
          
          const chartDataConfig = {
            labels: data.map(item => item.time),
            datasets: [
              {
                label: 'Dust (0-1000)',
                data: data.map(item => item.dust),
                borderColor: '#ff6b6b',
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#ff6b6b',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                yAxisID: 'y'
              },
              {
                label: 'CO2 (0-100)',
                data: data.map(item => item.co2),
                borderColor: '#4ecdc4',
                backgroundColor: 'rgba(78, 205, 196, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4ecdc4',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                yAxisID: 'y1'
              }
            ]
          };
          setChartData(chartDataConfig);
        }
      } catch (error) {
        console.error('Error updating chart data:', error);
      }
    }, 5000);
    
    // WebSocket listener
    const unsubscribeSensorData = webSocketService.on('sensorData', (newData) => {
      if (newData && newData.dust !== undefined) {
        apiService.getSensorData({ limit: 10, page: 1 }).then(response => {
          if (response && response.data && response.data.length > 0) {
            const data = response.data.slice(0, 10).reverse().map((item) => {
              const date = parseBackendDateTime(item.time);
              const timeDisplay = item.time.includes(',') ? item.time.split(', ')[1] : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return {
                time: timeDisplay,
                dust: parseInt(item.dust || 0),
                co2: parseInt(item.co2 || 0)
              };
            });
            
            const chartDataConfig = {
              labels: data.map(item => item.time),
              datasets: [
                {
                  label: 'Dust (0-1000)',
                  data: data.map(item => item.dust),
                  borderColor: '#ff6b6b',
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#ff6b6b',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  yAxisID: 'y'
                },
                {
                  label: 'CO2 (0-100)',
                  data: data.map(item => item.co2),
                  borderColor: '#4ecdc4',
                  backgroundColor: 'rgba(78, 205, 196, 0.1)',
                  borderWidth: 3,
                  fill: true,
                  tension: 0.4,
                  pointBackgroundColor: '#4ecdc4',
                  pointBorderColor: '#ffffff',
                  pointBorderWidth: 2,
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  yAxisID: 'y1'
                }
              ]
            };
            setChartData(chartDataConfig);
          }
        }).catch(error => {
          console.error('Error updating chart with real-time data:', error);
        });
      }
    });
    
    return () => {
      clearInterval(interval);
      unsubscribeSensorData();
    };
  }, [esp32Connected]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 12,
          font: {
            size: 12,
            weight: '500'
          },
          boxHeight: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#ddd',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Thời gian',
          color: '#555',
          font: {
            size: 14,
            weight: 'bold',
            family: 'Inter, sans-serif',
          },
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 1000,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          },
          callback: function(value) {
            return value;
          }
        },
        title: {
          display: true,
          text: 'Dust (0-1000)',
          color: '#ff6b6b',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          },
          callback: function(value) {
            return value;
          }
        },
        title: {
          display: true,
          text: 'CO2 (0-100)',
          color: '#4ecdc4',
          font: {
            size: 11,
            weight: 'bold'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 2000,
      easing: 'easeInOutQuart'
    }
  };

  return (
    <div className="chart-container">
      <h2 className="section-title">Dust & CO2 Levels</h2>
      <div className="chart-wrapper">
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>Error: {error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
          </div>
        ) : chartData ? (
          <Line data={chartData} options={options} />
        ) : (
          <div className="no-data-message">
            <p>No data available</p>
            <p>Please check your connection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DustCO2Chart;
