// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Service class
class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // GET request
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // Sensor Data API
    async getSensorData(params = {}) {
        const { page = 1, limit = 10, sortField, sortDirection, search, temperature, humidity, light, time } = params;
        const queryParams = {
            page,
            limit,
            ...(sortField && { sortField }),
            ...(sortDirection && { sortDirection }),
            ...(search && { search }),
            ...(temperature && { temperature }),
            ...(humidity && { humidity }),
            ...(light && { light }),
            ...(time && { time })
        };
        return this.get('/sensor-data', queryParams);
    }

    async getLatestSensorData() {
        return this.get('/sensor-data/latest/all');
    }

    async getSensorHistory(params = {}) {
        const { limit = 7, sort = 'desc' } = params;
        return this.get('/sensor-data', { limit, page: 1 });
    }

    async getSensorDataByDateRange(startDate, endDate) {
        return this.get('/sensor-data/date-range', { startDate, endDate });
    }

    async getSensorStatistics(startDate, endDate) {
        return this.get('/sensor-data/statistics', { startDate, endDate });
    }

    async getSensorDataById(id) {
        return this.get(`/sensor-data/${id}`);
    }

    // Action History API
    async getActionHistory(params = {}) {
        const { page = 1, limit = 10, device, time, id } = params;
        const queryParams = {
            page,
            limit,
            ...(device && { device }),
            ...(time && { time }),
            ...(id && { id })
        };
        return this.get('/action-history', queryParams);
    }

    async getActionHistoryByDevice(deviceName, limit = 100, offset = 0) {
        return this.get('/action-history/device', { deviceName, limit, offset });
    }

    async getActionHistoryByDateRange(startDate, endDate, deviceName = null) {
        const params = { startDate, endDate };
        if (deviceName) params.deviceName = deviceName;
        return this.get('/action-history/date-range', params);
    }

    async getActionHistoryById(id) {
        return this.get(`/action-history/${id}`);
    }

           // Device Control API
           async getDeviceStatus() {
               // Check MQTT control status
               return this.get('/mqtt/led/control/status');
           }

           async controlDevice(deviceName, action) {
               return this.post('/led/control', {
                   action: action,
                   device_name: deviceName
               });
           }

    // LED Control API
    async controlLED(action, deviceName = 'LED', description = null) {
        return this.post('/led/control', {
            action,
            device_name: deviceName,
            description
        });
    }

    // System Status API
    async getSystemStatus() {
        return this.get('/system/status');
    }

    async getHealthStatus() {
        return this.get('/health');
    }

    // MQTT Sensor Data API
    async getMQTTSensorData(limit = 100, offset = 0) {
        return this.get('/mqtt/sensor-data', { limit, offset });
    }

    async getLatestMQTTSensorData() {
        return this.get('/mqtt/sensor-data/latest');
    }

    async simulateSensorData(sensorData) {
        return this.post('/mqtt/sensor-data/simulate', sensorData);
    }

    // MQTT LED Control API
    async publishLEDControl(action, deviceName = 'LED', description = null) {
        return this.post('/mqtt/led/control', {
            action,
            device_name: deviceName,
            description
        });
    }

    async getLEDControlHistory(limit = 100, offset = 0) {
        return this.get('/mqtt/led/control/history', { limit, offset });
    }

    // MQTT LED Status API
    async getLEDStatus() {
        return this.get('/mqtt/led/status');
    }

    async getLEDStatusHistory(limit = 100, offset = 0) {
        return this.get('/mqtt/led/status/history', { limit, offset });
    }

    async simulateLEDStatus(deviceName, status, description) {
        return this.post('/mqtt/led/status/simulate', {
            device_name: deviceName,
            status,
            description
        });
    }
}

// Create and export API instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
    getSensorData,
    getLatestSensorData,
    getSensorHistory,
    getSensorDataByDateRange,
    getSensorStatistics,
    getActionHistory,
    getActionHistoryByDevice,
    getActionHistoryByDateRange,
    getDeviceStatus,
    controlDevice,
    controlLED,
    getSystemStatus,
    getHealthStatus,
    getMQTTSensorData,
    getLatestMQTTSensorData,
    simulateSensorData,
    publishLEDControl,
    getLEDControlHistory,
    getLEDStatus,
    getLEDStatusHistory,
    simulateLEDStatus
} = apiService;
