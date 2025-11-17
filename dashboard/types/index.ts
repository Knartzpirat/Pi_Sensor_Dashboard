
export interface SearchParams {
  [key: string]: string | string[] | undefined;
}

// Sensor Reading Types
export interface IncomingSensorReading {
  entity_id: string;
  value: number;
  quality?: number;
  timestamp: string | number;
}

export interface SensorReadingData {
  measurementId: string;
  entityId: string;
  value: number;
  quality: number;
  timestamp: Date;
}

// Backend API Types
export interface BackendSensorEntity {
  name: string;
  unit: string;
  type: string;
}

export interface BackendSensorMetadata {
  driverName: string;
  entities: BackendSensorEntity[];
}

export interface BackendSupportedSensorsResponse {
  sensors: BackendSensorMetadata[];
}

// Prisma Where Clause Types
export interface SensorReadingWhereInput {
  timestamp?: {
    gte?: Date;
    lte?: Date;
    lt?: Date;
  };
  measurementId?: string | null;
  entityId?: {
    in: string[];
  };
}

// Graph Data Types
export interface GraphDataPoint {
  timestamp: number;
  [entityId: string]: number; // Dynamic keys for each entity
}

// Prisma Where Clause Types for Measurement
export interface MeasurementWhereInput {
  title?: {
    contains: string;
    mode: 'insensitive';
  };
  status?: string | { in: string[] };
  startTime?: unknown; // Can be various date filter formats
}

// Measurement Types (with relations)
export interface SensorEntity {
  id: string;
  sensorId: string;
  name: string;
  unit: string;
  type: string;
  color: string;
  minValue?: number | null;
  maxValue?: number | null;
  precision: number;
  isVisible: boolean;
  createdAt: Date;
}

export interface Sensor {
  id: string;
  name: string;
  driver: string;
  connectionType: string;
  boardType: string;
  pin?: number | null;
  connectionParams?: unknown;
  pollInterval: number;
  enabled: boolean;
  calibration?: unknown;
  createdAt: Date;
  updatedAt: Date;
  entities?: SensorEntity[];
}

export interface TestObject {
  id: string;
  title: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MeasurementSensor {
  id: string;
  measurementId: string;
  sensorId: string;
  testObjectId?: string | null;
  createdAt: Date;
  sensor: Sensor;
  testObject?: TestObject | null;
}

export interface SensorReading {
  id: string;
  measurementId?: string | null;
  entityId: string;
  value: number;
  quality: number;
  timestamp: Date;
  entity?: SensorEntity;
}

export interface Measurement {
  id: string;
  sessionId: string;
  title: string;
  description?: string | null;
  status: 'IDLE' | 'STARTING' | 'RUNNING' | 'PAUSED' | 'STOPPING' | 'COMPLETED' | 'ERROR';
  interval: number;
  duration?: number | null;
  startTime: Date;
  endTime?: Date | null;
  readingsCount: number;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
  measurementSensors?: MeasurementSensor[];
  readings?: SensorReading[];
}

