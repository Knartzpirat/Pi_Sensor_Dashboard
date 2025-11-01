// TODO: FastAPI Integration Service
// Service layer for communicating with the FastAPI backend
// Handles HTTP requests, WebSocket connections, and data streaming
//
// FastAPI Backend Endpoints (to be implemented):
// GET  /api/v1/sensors - List all configured sensors
// POST /api/v1/sensors - Add new sensor configuration
// GET  /api/v1/sensors/{id}/data - Get historical sensor data
// GET  /api/v1/system/status - Get Raspberry Pi system status
// GET  /api/v1/gpio/pins - Get GPIO pin assignments and status
// POST /api/v1/gpio/configure - Configure GPIO pins for sensors
// WS   /api/v1/stream - WebSocket for real-time data streaming
//
// Environment Context Endpoints:
// GET  /api/v1/environments - List all environment contexts
// POST /api/v1/environments - Create new environment context
// PUT  /api/v1/environments/{id} - Update environment context
// DEL  /api/v1/environments/{id} - Delete environment context
// GET  /api/v1/environments/{id}/sensors - Get sensors assigned to environment
// POST /api/v1/environments/{id}/sensors/{sensor_id} - Assign sensor to environment
// DEL  /api/v1/environments/{id}/sensors/{sensor_id} - Unassign sensor from environment
// GET  /api/v1/environments/{id}/measurements - Get measurements by environment context
//
// Sensor Data Types from FastAPI:
// {
//   sensorId: string;
//   timestamp: string;
//   readings: {
//     temperature?: number;
//     humidity?: number;
//     pressure?: number;
//     [key: string]: number | undefined;
//   };
//   metadata: {
//     gpioPin?: number;
//     connectionType: 'gpio' | 'hat' | 'i2c' | 'spi';
//     sensorType: string;
//     unit: string;
//   };
// }
//
// System Status from FastAPI:
// {
//   raspberry_pi: {
//     model: string;
//     cpu_temp: number;
//     cpu_usage: number;
//     memory_usage: { used: number; total: number };
//     uptime: number;
//   };
//   gpio_status: Array<{
//     pin: number;
//     mode: 'input' | 'output' | 'pwm' | 'spi' | 'i2c';
//     value: number | boolean;
//     assigned_sensor?: string;
//   }>;
//   sensors: Array<{
//     id: string;
//     name: string;
//     type: string;
//     status: 'online' | 'offline' | 'error';
//     last_reading: string;
//   }>;
// }

'use client';

// API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
const WS_BASE_URL =
  process.env.NEXT_PUBLIC_FASTAPI_WS_URL || 'ws://localhost:8000';

// TODO: API service functions
export class FastAPIService {
  // Sensor management
  static async getSensors() {
    // TODO: Implement GET /api/v1/sensors
    // Fetch list of all configured sensors
  }

  static async addSensor(sensorConfig: any) {
    // TODO: Implement POST /api/v1/sensors
    // Add new sensor configuration
  }

  static async getSensorData(sensorId: string, timeRange: string) {
    // TODO: Implement GET /api/v1/sensors/{id}/data
    // Get historical data for specific sensor
  }

  // System status
  static async getSystemStatus() {
    // TODO: Implement GET /api/v1/system/status
    // Get current Raspberry Pi system metrics
  }

  // GPIO management
  static async getGPIOPins() {
    // TODO: Implement GET /api/v1/gpio/pins
    // Get current GPIO pin assignments and status
  }

  static async configureGPIO(pinConfig: any) {
    // TODO: Implement POST /api/v1/gpio/configure
    // Configure GPIO pins for sensor connections
  }

  // WebSocket connection for real-time data
  static createWebSocketConnection(onMessage: (data: any) => void) {
    // TODO: Implement WebSocket connection
    // Connect to /api/v1/stream for real-time sensor data

    const ws = new WebSocket(`${WS_BASE_URL}/api/v1/stream`);

    ws.onopen = () => {
      console.log('Connected to FastAPI WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket data:', error);
      }
    };

    ws.onclose = () => {
      console.log('FastAPI WebSocket connection closed');
    };

    ws.onerror = (error) => {
      console.error('FastAPI WebSocket error:', error);
    };

    return ws;
  }

  // Environment Context Management
  static async getEnvironments() {
    // TODO: Implement GET /api/v1/environments
    // Fetch list of all environment contexts (Kühlkammer, Draußen, Auto, etc.)
  }

  static async createEnvironment(environmentConfig: any) {
    // TODO: Implement POST /api/v1/environments
    // Create new environment context with parameters
  }

  static async updateEnvironment(envId: string, updates: any) {
    // TODO: Implement PUT /api/v1/environments/{id}
    // Update environment context configuration
  }

  static async deleteEnvironment(envId: string) {
    // TODO: Implement DELETE /api/v1/environments/{id}
    // Delete environment context
  }

  static async getEnvironmentSensors(envId: string) {
    // TODO: Implement GET /api/v1/environments/{id}/sensors
    // Get sensors assigned to specific environment
  }

  static async assignSensorToEnvironment(envId: string, sensorId: string) {
    // TODO: Implement POST /api/v1/environments/{id}/sensors/{sensor_id}
    // Assign sensor to environment context
  }

  static async unassignSensorFromEnvironment(envId: string, sensorId: string) {
    // TODO: Implement DELETE /api/v1/environments/{id}/sensors/{sensor_id}
    // Remove sensor assignment from environment
  }

  static async getEnvironmentMeasurements(envId: string, timeRange: string) {
    // TODO: Implement GET /api/v1/environments/{id}/measurements
    // Get measurements filtered by environment context
  }
}

// TODO: React hooks for FastAPI integration
export function useSensors() {
  // TODO: Hook for managing sensor list
  // Fetches sensors on mount, provides CRUD operations
}

export function useSystemStatus() {
  // TODO: Hook for system status monitoring
  // Polls system status at regular intervals
}

export function useEnvironments() {
  // TODO: Hook for managing environment contexts
  // Fetches environments, provides CRUD operations
}

export function useEnvironmentMeasurements(envId: string) {
  // TODO: Hook for environment-specific measurements
  // Real-time measurements filtered by environment context
}

export function useSensorEnvironmentAssignment() {
  // TODO: Hook for managing sensor-environment assignments
  // Provides assignment/unassignment functionality with validation
}

export function useLiveSensorData() {
  // TODO: Hook for real-time sensor data
  // Manages WebSocket connection for live updates
}

export function useGPIOPins() {
  // TODO: Hook for GPIO pin management
  // Provides GPIO configuration and status
}
