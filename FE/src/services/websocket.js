import io from 'socket.io-client';

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
    connect(serverUrl = 'http://localhost:5000') {
        if (this.socket && this.isConnected) {
            console.log('WebSocket already connected');
            return;
        }

        try {
            this.socket = io(serverUrl, {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            });

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
        this.socket.on('connect', () => {
            console.log('✅ WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connection', { status: 'connected' });
        });

        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            this.isConnected = false;
            this.emit('connection', { status: 'disconnected', reason });
            this.handleReconnect();
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.emit('connection', { status: 'error', error: error.message });
            this.handleReconnect();
        });

        // Sensor data events
        this.socket.on('sensor_data_update', (data) => {
            console.log('📊 Received sensor data:', data);
            this.emit('sensorData', data.data); // Extract data from the wrapper
        });

        // LED status events
        this.socket.on('led_status_update', (data) => {
            console.log('💡 Received LED status:', data);
            this.emit('ledStatus', data.data); // Extract data from the wrapper
        });

        // Error events
        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        });

        // Custom events
        this.socket.on('systemStatus', (data) => {
            console.log('🔧 System status update:', data);
            this.emit('systemStatus', data);
        });
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
                this.socket?.connect();
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
    emitToServer(event, data) {
        if (this.socket && this.isConnected) {
            this.socket.emit(event, data);
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            socketId: this.socket?.id || null
        };
    }

    // Request system status
    requestSystemStatus() {
        this.emitToServer('requestSystemStatus');
    }

    // Subscribe to sensor data updates
    subscribeToSensorData() {
        this.emitToServer('subscribeSensorData');
    }

    // Subscribe to LED status updates
    subscribeToLEDStatus() {
        this.emitToServer('subscribeLEDStatus');
    }

    // Unsubscribe from sensor data updates
    unsubscribeFromSensorData() {
        this.emitToServer('unsubscribeSensorData');
    }

    // Unsubscribe from LED status updates
    unsubscribeFromLEDStatus() {
        this.emitToServer('unsubscribeLEDStatus');
    }
}

// Create and export singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;

// Export class for testing
export { WebSocketService };
