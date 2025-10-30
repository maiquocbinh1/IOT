class WebSocketService {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    // Connect to WebSocket server
    connect(serverUrl = 'ws://localhost:5000') {
        if (this.socket && this.isConnected) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            this.socket = new WebSocket(serverUrl);
            this.setupEventListeners();
            console.log('WebSocket connecting to:', serverUrl);
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    // Setup event listeners
    setupEventListeners() {
        if (!this.socket) return;

        // Connection events
        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connection', { status: 'connected' });
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.code, event.reason);
            this.isConnected = false;
            this.emit('connection', { status: 'disconnected', reason: event.reason });
            // Don't auto-reconnect immediately, let user manually reconnect
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket connection error:', error);
            this.emit('connection', { status: 'error', error: error.message });
            // Don't auto-reconnect on error
        };

        // Message events
        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Received WebSocket message:', data);
                
                // Handle different message types
                switch (data.type) {
                    case 'MQTT_STATUS':
                        this.emit('mqttStatus', data);
                        break;
                    case 'DATA_STATUS':
                        console.log('Data Status:', data);
                        this.emit('dataStatus', data);
                        break;
                    case 'LED_STATUS':
                        this.emit('LED_STATUS', data);
                        this.emit('ledStatus', data);
                        break;
                    // No LED_STATUS handling; revert to previous behavior
                    case 'SENSOR_DATA':
                        console.log('Sensor Data:', data);
                        this.emit('sensorData', data);
                        break;
                    default:
                        console.log('Unknown message type:', data);
                        this.emit('message', data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }

    // Handle reconnection
    handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            this.emit('connection', { status: 'failed' });
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (!this.isConnected) {
                this.connect();
            }
        }, delay);
    }

    // Disconnect from WebSocket server
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.listeners.clear();
            console.log('WebSocket disconnected');
        }
    }

    // Emit custom event
    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    // Add event listener
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            const eventListeners = this.listeners.get(event);
            if (eventListeners) {
                eventListeners.delete(callback);
                if (eventListeners.size === 0) {
                    this.listeners.delete(event);
                }
            }
        };
    }

    // Remove event listener
    off(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
        }
    }

    // Send message to server
    sendMessage(data) {
        if (this.socket && this.isConnected) {
            this.socket.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            readyState: this.socket?.readyState || null
        };
    }
}

// Create and export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;

// Export class for testing
export { WebSocketService };
