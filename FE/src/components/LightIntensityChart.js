import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './LightIntensityChart.css';

const LightIntensityChart = () => {
  const data = [
    { day: 'Mon', light: 600 },
    { day: 'Tue', light: 600 },
    { day: 'Wed', light: 600 },
    { day: 'Thu', light: 600 },
    { day: 'Fri', light: 600 },
    { day: 'Sat', light: 600 },
    { day: 'Sun', light: 600 }
  ];

  return (
    <div className="chart-container">
      <h2 className="section-title">Light Intensity</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[300, 1200]} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="light" 
              stroke="#8B4513" 
              strokeWidth={3}
              name="Light"
              dot={{ fill: '#8B4513', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LightIntensityChart;
