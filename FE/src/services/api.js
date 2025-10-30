// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

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

    // Sensor Data API - Updated to match backend
    async getLatestSensorData() {
        return this.get('/sensor-data');
    }

    async getSensorData(params = {}) {
        const { page = 1, limit = 5, filterType, searchQuery, sortColumn, sortDirection, timeSearch } = params;
        const queryParams = {
            page,
            limit,
            ...(filterType && { filterType }),
            ...(searchQuery && { searchQuery }),
            ...(timeSearch && { timeSearch }),
            ...(sortColumn && { sortColumn }),
            ...(sortDirection && { sortDirection })
        };
        return this.get('/data', queryParams);
    }

    async getSensorHistory(params = {}) {
        const { limit = 5, page = 1 } = params;
        return this.get('/data', { limit, page });
    }

    // Action History API - Updated to match backend
    async getActionHistory(params = {}) {
        const { page = 1, limit = 5, filterType, searchQuery, sortColumn, sortDirection } = params;
        const queryParams = {
            page,
            limit,
            ...(filterType && { filterType }),
            ...(searchQuery && { searchQuery }),
            ...(sortColumn && { sortColumn }),
            ...(sortDirection && { sortDirection })
        };
        return this.get('/actions/history', queryParams);
    }

    // Device Control API - Updated to match backend
    async controlDevice(deviceName, action) {
        return this.post('/control', {
            deviceName: deviceName,
            action: action
        });
    }

    async controlLED(action, deviceName = 'led1') {
        return this.post('/control', {
            deviceName: deviceName,
            action: action
        });
    }

    // Connection Status API
    async getConnectionStatus() {
        return this.get('/connection-status');
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
    getActionHistory,
    controlDevice,
    controlLED
} = apiService;
