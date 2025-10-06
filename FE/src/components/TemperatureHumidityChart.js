import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './TemperatureHumidityChart.css';

const TemperatureHumidityChart = () => {
  const data = [
    { day: 'Mon', temperature: 20, humidity: 45 },
    { day: 'Tue', temperature: 22, humidity: 48 },
    { day: 'Wed', temperature: 24, humidity: 52 },
    { day: 'Thu', temperature: 23, humidity: 50 },
    { day: 'Fri', temperature: 25, humidity: 55 },
    { day: 'Sat', temperature: 26, humidity: 58 },
    { day: 'Sun', temperature: 24, humidity: 52 }
  ];

  return (
    <div className="chart-container">
      <h2 className="section-title">Temperature & Humidity</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis yAxisId="temp" orientation="left" domain={[14, 34]} />
            <YAxis yAxisId="humidity" orientation="right" domain={[30, 80]} />
            <Tooltip />
            <Legend />
            <Line 
              yAxisId="temp" 
              type="monotone" 
              dataKey="temperature" 
              stroke="#ff4444" 
              strokeWidth={2}
              name="Temp"
              dot={{ fill: '#ff4444', strokeWidth: 2, r: 4 }}
            />
            <Line 
              yAxisId="humidity" 
              type="monotone" 
              dataKey="humidity" 
              stroke="#4444ff" 
              strokeWidth={2}
              name="Humidity"
              dot={{ fill: '#4444ff', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TemperatureHumidityChart;
