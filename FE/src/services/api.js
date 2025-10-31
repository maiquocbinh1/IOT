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
        const {
            page = 1,
            limit = 13,
            search,
            searchQuery,
            searchField,
            sortKey,
            sortColumn,
            sortBy,
            sortDirection,
            order
        } = params;

        const searchValue = (search ?? searchQuery ?? '').toString().trim();
        const searchFieldValue = (searchField ?? '').toString().trim();
        const sortKeyValue = (sortKey || sortColumn || sortBy || '').toString().trim();
        const sortDirectionValue = (sortDirection || order || '').toString().trim();

        const queryParams = {
            page,
            limit,
            ...(searchValue && { search: searchValue }),
            ...(searchFieldValue && { searchField: searchFieldValue }),
            ...(sortKeyValue && { sortKey: sortKeyValue }),
            ...(sortDirectionValue && { sortDirection: sortDirectionValue })
        };

        return this.get('/data/history', queryParams);
    }

    async getSensorHistory(params = {}) {
        return this.getSensorData(params);
    }

    // Action History API - Updated to match backend
    async getActionHistory(params = {}) {
        const { page = 1, limit = 12, filterType, searchQuery, sortColumn, sortDirection, device_name, action } = params;
        const queryParams = {
            page,
            limit,
            ...(filterType && { filterType }),
            ...(searchQuery && { searchQuery }),
            ...(sortColumn && { sortColumn }),
            ...(sortDirection && { sortDirection }),
            ...(device_name && { device_name }),
            ...(action && { action })
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
