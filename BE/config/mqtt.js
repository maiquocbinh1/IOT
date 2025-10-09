const mqtt = require('mqtt');
require('dotenv').config();

class MQTTClient {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.subscribers = new Map();
        this.topics = {
            sensorData: process.env.MQTT_SENSOR_DATA_TOPIC || 'iot/sensor/data',
            ledControl: process.env.MQTT_LED_CONTROL_TOPIC || 'iot/led/control',
            ledStatus: process.env.MQTT_LED_STATUS_TOPIC || 'iot/led/status'
        };
    }

    // Connect to MQTT broker
    connect() {
        const options = {
            clientId: process.env.MQTT_CLIENT_ID || 'iot_backend_server',
            username: process.env.MQTT_USERNAME || '',
            password: process.env.MQTT_PASSWORD || '',
            clean: true,
            reconnectPeriod: 1000,
            connectTimeout: 30 * 1000,
            keepalive: 60
        };

        const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

        this.client = mqtt.connect(brokerUrl, options);

        this.client.on('connect', () => {
            console.log('✅ MQTT Client connected to broker');
            this.isConnected = true;
            this.subscribeToTopics();
        });

        this.client.on('error', (error) => {
            console.error('❌ MQTT Client error:', error.message);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            console.log('⚠️ MQTT Client connection closed');
            this.isConnected = false;
        });

        this.client.on('reconnect', () => {
            console.log('🔄 MQTT Client reconnecting...');
        });

        this.client.on('offline', () => {
            console.log('📴 MQTT Client offline');
            this.isConnected = false;
        });

        return this.client;
    }

    // Subscribe to all required topics
    subscribeToTopics() {
        if (!this.isConnected) {
            console.error('❌ Cannot subscribe: MQTT client not connected');
            return;
        }

        // Subscribe to sensor data topic
        this.client.subscribe(this.topics.sensorData, (error) => {
            if (error) {
                console.error(`❌ Failed to subscribe to ${this.topics.sensorData}:`, error.message);
            } else {
                console.log(`📡 Subscribed to ${this.topics.sensorData}`);
            }
        });

        // Subscribe to LED status topic
        this.client.subscribe(this.topics.ledStatus, (error) => {
            if (error) {
                console.error(`❌ Failed to subscribe to ${this.topics.ledStatus}:`, error.message);
            } else {
                console.log(`📡 Subscribed to ${this.topics.ledStatus}`);
            }
        });

        // Set up message handler
        this.client.on('message', (topic, message) => {
            this.handleMessage(topic, message);
        });
    }

    // Handle incoming MQTT messages
    handleMessage(topic, message) {
        try {
            const data = JSON.parse(message.toString());
            console.log(`📨 Received message on ${topic}:`, data);

            // Notify subscribers
            if (this.subscribers.has(topic)) {
                const callbacks = this.subscribers.get(topic);
                callbacks.forEach(callback => {
                    try {
                        callback(data, topic);
                    } catch (error) {
                        console.error('❌ Error in MQTT message callback:', error.message);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error parsing MQTT message:', error.message);
        }
    }

    // Subscribe to a specific topic with callback
    subscribe(topic, callback) {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        this.subscribers.get(topic).push(callback);

        // If client is connected, subscribe to the topic
        if (this.isConnected) {
            this.client.subscribe(topic, (error) => {
                if (error) {
                    console.error(`❌ Failed to subscribe to ${topic}:`, error.message);
                } else {
                    console.log(`📡 Subscribed to ${topic}`);
                }
            });
        }
    }

    // Unsubscribe from a topic
    unsubscribe(topic, callback) {
        if (this.subscribers.has(topic)) {
            const callbacks = this.subscribers.get(topic);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
            
            if (callbacks.length === 0) {
                this.subscribers.delete(topic);
                if (this.isConnected) {
                    this.client.unsubscribe(topic);
                }
            }
        }
    }

    // Publish message to a topic
    publish(topic, message, options = {}) {
        if (!this.isConnected) {
            console.error('❌ Cannot publish: MQTT client not connected');
            return false;
        }

        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        
        this.client.publish(topic, messageStr, options, (error) => {
            if (error) {
                console.error(`❌ Failed to publish to ${topic}:`, error.message);
            } else {
                console.log(`📤 Published to ${topic}:`, message);
            }
        });

        return true;
    }

    // Publish LED control command
    publishLedControl(command) {
        return this.publish(this.topics.ledControl, command);
    }

    // Get connection status
    isClientConnected() {
        return this.isConnected;
    }

    // Get available topics
    getTopics() {
        return { ...this.topics };
    }

    // Disconnect from MQTT broker
    disconnect() {
        if (this.client) {
            this.client.end();
            this.isConnected = false;
            console.log('🔌 MQTT Client disconnected');
        }
    }
}

// Create singleton instance
const mqttClient = new MQTTClient();

module.exports = mqttClient;
