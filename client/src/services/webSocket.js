const WS_URL = import.meta.env?.VITE_WS_URL || 'ws://localhost:8080';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.shouldReconnect = true;
    this.isConnecting = false;
  }

  connect(orderId) {
    if (this.isConnecting) {
      console.log('Connection already in progress...');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`${WS_URL}/${orderId}`);

        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.log('Connection timeout, retrying...');
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          console.log('WebSocket connected for order:', orderId);
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.notifyListeners(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          // Only log error if connection is not already open
          if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket connection error (will retry)');
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          console.log('WebSocket disconnected', event.code, event.reason);
          
          // Only reconnect if it wasn't a clean close and we should reconnect
          if (this.shouldReconnect && event.code !== 1000) {
            this.handleReconnect(orderId);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  handleReconnect(orderId) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(orderId), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
  }

  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const callbacks = this.listeners.get(eventType);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifyListeners(message) {
    const { type } = message;
    if (this.listeners.has(type)) {
      this.listeners.get(type).forEach(callback => callback(message.data));
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    this.listeners.clear();
    this.reconnectAttempts = 0;
  }
}

export default new WebSocketService();
