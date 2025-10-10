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
import './TemperatureHumidityChart.css';
import apiService from '../../services/api';

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

const TemperatureHumidityChart = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChartData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getSensorData({
          limit: 7,
          page: 1
        });
        
        console.log('Chart API Response:', response);
        
        let data;
        if (response && response.success && response.data && response.data.length > 0) {
          console.log('✅ Using REAL data from API:', response.data.length, 'records');
          console.log('📊 Real data sample:', response.data[0]);
          data = response.data.slice(0, 7).reverse().map((item, index) => {
            const date = new Date(item.time);
            return {
              time: date.toLocaleTimeString('vi-VN', { 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              }),
              temperature: parseFloat(item.temperature),
              humidity: parseInt(item.humidity),
              light: parseInt(item.light)
            };
          });
        } else {
          console.log('⚠️ Using FALLBACK data - API response:', response);
          const now = new Date();
          data = [
            { time: new Date(now.getTime() - 6*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 20, humidity: 45, light: 300 },
            { time: new Date(now.getTime() - 5*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 22, humidity: 48, light: 320 },
            { time: new Date(now.getTime() - 4*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 24, humidity: 52, light: 350 },
            { time: new Date(now.getTime() - 3*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 23, humidity: 50, light: 330 },
            { time: new Date(now.getTime() - 2*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 25, humidity: 55, light: 380 },
            { time: new Date(now.getTime() - 1*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 26, humidity: 58, light: 400 },
            { time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 24, humidity: 52, light: 360 }
          ];
        }
        
        const chartDataConfig = {
          labels: data.map(item => item.time),
          datasets: [
            {
              label: 'Temperature (°C)',
              data: data.map(item => item.temperature),
              borderColor: '#ff4444',
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#ff4444',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Humidity (%)',
              data: data.map(item => item.humidity),
              borderColor: '#4444ff',
              backgroundColor: 'rgba(68, 68, 255, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#4444ff',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Light (nits)',
              data: data.map(item => item.light),
              borderColor: '#ffaa00',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#ffaa00',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            }
          ]
        };
        
        console.log('📈 Final chart data:', chartDataConfig);
        setChartData(chartDataConfig);
      } catch (err) {
        console.error('Error loading chart data:', err);
        const now = new Date();
        const fallbackData = [
          { time: new Date(now.getTime() - 6*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 20, humidity: 45, light: 300 },
          { time: new Date(now.getTime() - 5*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 22, humidity: 48, light: 320 },
          { time: new Date(now.getTime() - 4*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 24, humidity: 52, light: 350 },
          { time: new Date(now.getTime() - 3*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 23, humidity: 50, light: 330 },
          { time: new Date(now.getTime() - 2*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 25, humidity: 55, light: 380 },
          { time: new Date(now.getTime() - 1*60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 26, humidity: 58, light: 400 },
          { time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), temperature: 24, humidity: 52, light: 360 }
        ];
        
        const chartDataConfig = {
          labels: fallbackData.map(item => item.time),
          datasets: [
            {
              label: 'Temperature (°C)',
              data: fallbackData.map(item => item.temperature),
              borderColor: '#ff4444',
              backgroundColor: 'rgba(255, 68, 68, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#ff4444',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Humidity (%)',
              data: fallbackData.map(item => item.humidity),
              borderColor: '#4444ff',
              backgroundColor: 'rgba(68, 68, 255, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#4444ff',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            },
            {
              label: 'Light (nits)',
              data: fallbackData.map(item => item.light),
              borderColor: '#ffaa00',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: '#ffaa00',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 6,
              pointHoverRadius: 8,
            }
          ]
        };
        setChartData(chartDataConfig);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
    
    const interval = setInterval(loadChartData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: '500'
          }
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
            return `${label}: ${value}${label.includes('Temperature') ? '°C' : '%'}`;
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
            size: 12
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        min: 0,
        max: 100,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 12
          },
          callback: function(value) {
            return value + '°C';
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
            size: 12
          },
          callback: function(value) {
            return value + '%';
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
            <h2 className="section-title">Temperature, Humidity & Light</h2>
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

export default TemperatureHumidityChart;