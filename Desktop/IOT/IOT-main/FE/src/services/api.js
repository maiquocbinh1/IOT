import axios from 'axios';

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000';

const http = axios.create({ baseURL: BASE_URL, timeout: 15000 });

const apiService = {
  async getConnectionStatus() {
    const { data } = await http.get('/api/connection-status');
    return data;
  },

  async controlDevice(deviceName, action) {
    const { data } = await http.post('/api/control', { deviceName, action });
    return data;
  },

  async getSensorData(params) {
    const { data } = await http.get('/api/data', { params });
    return data;
  },

  async getActionHistory(params) {
    const { data } = await http.get('/api/actions/history', { params });
    return data;
  },

  async post(path, payload) {
    const { data } = await http.post(path, payload);
    return data;
  },
};

export default apiService;
