const { Server } = require('socket.io');

class WebSocketManager {
    constructor() {
        this.io = null;
        this.connectedClients = new Map();
    }

    // Initialize WebSocket server
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        this.setupEventHandlers();
        console.log('✅ WebSocket server initialized');
    }

    // Setup WebSocket event handlers
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            this.connectedClients.set(socket.id, {
                socket: socket,
                connectedAt: new Date(),
                rooms: new Set()
            });

            // Handle client joining rooms
            socket.on('join_room', (room) => {
                socket.join(room);
                const client = this.connectedClients.get(socket.id);
                if (client) {
                    client.rooms.add(room);
                }
                console.log(`📡 Client ${socket.id} joined room: ${room}`);
            });

            // Handle client leaving rooms
            socket.on('leave_room', (room) => {
                socket.leave(room);
                const client = this.connectedClients.get(socket.id);
                if (client) {
                    client.rooms.delete(room);
                }
                console.log(`📡 Client ${socket.id} left room: ${room}`);
            });

            // Handle client disconnection
            socket.on('disconnect', (reason) => {
                console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
                this.connectedClients.delete(socket.id);
            });

            // Handle custom events
            socket.on('ping', () => {
                socket.emit('pong', { timestamp: new Date().toISOString() });
            });

            // Send initial connection confirmation
            socket.emit('connected', {
                message: 'Connected to IoT WebSocket server',
                clientId: socket.id,
                timestamp: new Date().toISOString()
            });
        });
    }

    // Broadcast sensor data to all clients
    broadcastSensorData(sensorData) {
        if (this.io) {
            this.io.emit('sensor_data_update', {
                type: 'sensor_data',
                data: sensorData,
                timestamp: new Date().toISOString()
            });
            console.log('📡 Broadcasted sensor data to all clients');
        }
    }

    // Broadcast action history to all clients
    broadcastActionHistory(actionHistory) {
        if (this.io) {
            this.io.emit('action_history_update', {
                type: 'action_history',
                data: actionHistory,
                timestamp: new Date().toISOString()
            });
            console.log('📡 Broadcasted action history to all clients');
        }
    }

    // Broadcast LED status update
    broadcastLedStatus(ledStatus) {
        if (this.io) {
            this.io.emit('led_status_update', {
                type: 'led_status',
                data: ledStatus,
                timestamp: new Date().toISOString()
            });
            console.log('📡 Broadcasted LED status to all clients');
        }
    }

    // Send message to specific room
    sendToRoom(room, event, data) {
        if (this.io) {
            this.io.to(room).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 Sent ${event} to room: ${room}`);
        }
    }

    // Send message to specific client
    sendToClient(clientId, event, data) {
        if (this.io) {
            this.io.to(clientId).emit(event, {
                ...data,
                timestamp: new Date().toISOString()
            });
            console.log(`📡 Sent ${event} to client: ${clientId}`);
        }
    }

    // Broadcast system status
    broadcastSystemStatus(status) {
        if (this.io) {
            this.io.emit('system_status', {
                type: 'system_status',
                data: status,
                timestamp: new Date().toISOString()
            });
            console.log('📡 Broadcasted system status to all clients');
        }
    }

    // Broadcast error message
    broadcastError(error) {
        if (this.io) {
            this.io.emit('error', {
                type: 'error',
                message: error.message || 'Unknown error occurred',
                timestamp: new Date().toISOString()
            });
            console.log('📡 Broadcasted error to all clients:', error.message);
        }
    }

    // Get connected clients count
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    // Get connected clients info
    getConnectedClients() {
        const clients = [];
        this.connectedClients.forEach((client, socketId) => {
            clients.push({
                socketId,
                connectedAt: client.connectedAt,
                rooms: Array.from(client.rooms)
            });
        });
        return clients;
    }

    // Get WebSocket server instance
    getIO() {
        return this.io;
    }

    // Check if WebSocket server is initialized
    isInitialized() {
        return this.io !== null;
    }
}

// Create singleton instance
const webSocketManager = new WebSocketManager();

module.exports = webSocketManager;
