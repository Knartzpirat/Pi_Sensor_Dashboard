'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SensorGraphCard } from './_components/sensor-graph-card';
import { SensorControlsCard } from './_components/sensor-controls-card';
import { MeasurementProgressCard } from './_components/measurement-progress-card';
import { StartMeasurementDrawer } from '@/components/start-measurement-drawer';
import { Button } from '@/components/ui/button';
import { PlayCircle } from 'lucide-react';

interface SensorEntity {
  id: string;
  name: string;
  unit: string;
  type: string;
  currentValue?: number;
  isVisible: boolean;
  color: string;
}

interface Sensor {
  id: string;
  name: string;
  driver: string;
  enabled: boolean;
  isConnected: boolean;
  entities: SensorEntity[];
}

interface DataPoint {
  timestamp: number;
  [key: string]: number;
}

interface MeasurementSensor {
  sensor: {
    id: string;
    name: string;
  };
  testObject?: {
    id: string;
    title: string;
  } | null;
}

interface Measurement {
  id: string;
  title: string;
  progress: number;
  startedAt: Date;
  estimatedCompletion?: Date;
  measurementSensors?: MeasurementSensor[];
}

interface APISensor {
  id: string;
  name: string;
  driver: string;
  enabled: boolean;
  connectionType: string;
  connectionParams?: Record<string, unknown>;
  pin?: number;
  pollInterval?: number;
  calibration?: Record<string, unknown>;
  entities: APISensorEntity[];
}

interface APISensorEntity {
  id: string;
  name: string;
  unit: string;
  type: string;
  color: string;
}

interface SensorReading {
  entity_id: string;
  value: number;
}

const VISIBILITY_STORAGE_KEY = 'sensor_entity_visibility';

// Load visibility settings from localStorage
const loadVisibilitySettings = (): Record<string, boolean> => {
  if (typeof window === 'undefined') return {};

  try {
    const saved = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error('Failed to load visibility settings:', error);
    return {};
  }
};

// Save visibility settings to localStorage
const saveVisibilitySettings = (settings: Record<string, boolean>) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save visibility settings:', error);
  }
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tMeasurements = useTranslations('measurements');

  const [sensors, setSensors] = React.useState<Sensor[]>([]);
  const [isLoadingSensors, setIsLoadingSensors] = React.useState(true);
  const [sensorsRegistered, setSensorsRegistered] = React.useState(false);
  const [activeMeasurement, setActiveMeasurement] = React.useState<Measurement | null>(null);
  const [graphData, setGraphData] = React.useState<DataPoint[]>([]);
  const [updateInterval, setUpdateInterval] = React.useState<number>(5000);
  const [timeRange, setTimeRange] = React.useState<string>('5m'); // Default to 5 minutes
  const [isLivePaused, setIsLivePaused] = React.useState(false); // Pause/Play toggle

  // Use ref for retentionTime so it doesn't trigger effect re-runs
  const retentionTimeRef = React.useRef<number>(3600000); // Default 1 hour

  // Load hardware config and sensors from API (only on mount)
  React.useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load hardware config for update interval and retention time
        let configUpdateInterval = 5000;
        let configRetention = 3600000;

        const configResponse = await fetch('/api/settings/hardware');
        if (configResponse.ok) {
          const config = await configResponse.json();
          configUpdateInterval = config.dashboardUpdateInterval || 5000;
          configRetention = config.graphDataRetentionTime || 3600000;
          setUpdateInterval(configUpdateInterval);
          retentionTimeRef.current = configRetention;
        }

        // Load active measurements
        const measurementsResponse = await fetch('/api/measurements');
        if (measurementsResponse.ok) {
          const measurementsData = await measurementsResponse.json();
          const runningMeasurement = measurementsData.measurements?.find(
            (m: any) => m.status === 'RUNNING' || m.status === 'STARTING'
          );

          if (runningMeasurement) {
            const startedAt = new Date(runningMeasurement.startTime);
            const duration = runningMeasurement.duration;
            const elapsed = (Date.now() - startedAt.getTime()) / 1000; // elapsed in seconds
            const progress = duration ? Math.min((elapsed / duration) * 100, 100) : 0;
            const estimatedCompletion = duration
              ? new Date(startedAt.getTime() + duration * 1000)
              : undefined;

            setActiveMeasurement({
              id: runningMeasurement.id,
              title: runningMeasurement.title,
              progress,
              startedAt,
              estimatedCompletion,
              measurementSensors: runningMeasurement.measurementSensors || [],
            });
          }
        }

        // Load historical graph data from database
        try {
          const now = Date.now();
          const from = now - configRetention; // Load data for retention period

          const readingsResponse = await fetch(
            `/api/sensor-readings?from=${from}&to=${now}`
          );

          if (readingsResponse.ok) {
            const readingsData = await readingsResponse.json();
            if (readingsData.success && readingsData.data.length > 0) {
              console.log(`Loaded ${readingsData.data.length} historical data points from database`);
              setGraphData(readingsData.data);
            } else {
              // No data in database yet, initialize with empty array
              console.log('No historical data found, starting fresh');
              setGraphData([]);
            }
          } else {
            console.warn('Failed to load historical data, starting fresh');
            setGraphData([]);
          }
        } catch (error) {
          console.error('Error loading historical data:', error);
          setGraphData([]);
        }

        // Load sensors
        const response = await fetch('/api/sensors');
        const data = await response.json();

        console.log('Loaded sensors from API:', data.sensors?.length || 0, 'sensors');

        if (data.sensors) {
          // Re-register all enabled sensors with backend (in case backend was restarted)
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
          const enabledSensors = (data.sensors as APISensor[]).filter((s) => s.enabled);
          console.log('Enabled sensors to register:', enabledSensors.length);

          const registrationPromises = enabledSensors.map(async (sensor) => {
              try {
                // Try to register sensor (will fail if already exists, which is fine)
                const connectionParams = sensor.connectionParams || {};
                const sensorConfig = {
                  name: sensor.id,
                  driver: sensor.driver,
                  connection_type: sensor.connectionType,
                  connection_params: sensor.pin ? { ...connectionParams, pin: sensor.pin } : connectionParams,
                  poll_interval: sensor.pollInterval || 1.0,
                  enabled: true,
                  calibration: sensor.calibration || {},
                };
                console.log(`Registering sensor ${sensor.name}:`, JSON.stringify(sensorConfig, null, 2));

                const registerResponse = await fetch(`${backendUrl}/sensors/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(sensorConfig),
                });

                if (registerResponse.ok) {
                  console.log(`✓ Registered sensor ${sensor.name} (${sensor.id}) with backend`);
                } else if (registerResponse.status === 409) {
                  // Sensor already exists, this is fine
                  console.log(`✓ Sensor ${sensor.name} (${sensor.id}) already exists in backend`);
                } else {
                  const errorText = await registerResponse.text();
                  console.error(`✗ Failed to register sensor ${sensor.name} (${sensor.id}):`, errorText);
                  console.error(`  Sensor config:`, JSON.stringify(sensorConfig, null, 2));
                  console.error(`  Response status:`, registerResponse.status);
                }
              } catch (error) {
                console.error(`✗ Failed to register sensor ${sensor.name} (${sensor.id}):`, error);
              }
            });

          await Promise.all(registrationPromises);

          // Load visibility settings from localStorage
          const savedVisibility = loadVisibilitySettings();

          // Transform sensors to match component interface
          const transformedSensors: Sensor[] = (data.sensors as APISensor[])
            .filter((s) => s.enabled) // Only show enabled sensors
            .map((sensor) => ({
              id: sensor.id,
              name: sensor.name,
              driver: sensor.driver,
              enabled: sensor.enabled,
              isConnected: sensor.enabled, // Treat enabled sensors as connected
              entities: sensor.entities.map((entity) => ({
                id: entity.id,
                name: entity.name,
                unit: entity.unit,
                type: entity.type,
                // Load visibility from localStorage, default to true if not set
                isVisible: savedVisibility[entity.id] !== undefined
                  ? savedVisibility[entity.id]
                  : true,
                color: entity.color, // Use color from database
                currentValue: undefined,
              })),
            }));

          setSensors(transformedSensors);
          setSensorsRegistered(true);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load sensors');
      } finally {
        setIsLoadingSensors(false);
      }
    };

    loadInitialData();
  }, []); // Only run once on mount

  // Poll for new sensors periodically (every 10 seconds)
  React.useEffect(() => {
    const checkForNewSensors = async () => {
      try {
        const response = await fetch('/api/sensors');
        const data = await response.json();

        if (data.sensors) {
          const savedVisibility = loadVisibilitySettings();
          const transformedSensors: Sensor[] = (data.sensors as APISensor[])
            .filter((s) => s.enabled)
            .map((sensor) => ({
              id: sensor.id,
              name: sensor.name,
              driver: sensor.driver,
              enabled: sensor.enabled,
              isConnected: sensor.enabled,
              entities: sensor.entities.map((entity) => ({
                id: entity.id,
                name: entity.name,
                unit: entity.unit,
                type: entity.type,
                isVisible: savedVisibility[entity.id] !== undefined
                  ? savedVisibility[entity.id]
                  : true,
                color: entity.color,
                currentValue: undefined,
              })),
            }));

          // Check if sensor list changed (by comparing IDs)
          const currentIds = sensors.map((s) => s.id).sort().join(',');
          const newIds = transformedSensors.map((s) => s.id).sort().join(',');

          if (currentIds !== newIds) {
            console.log('Sensor list changed, updating...');
            setSensors(transformedSensors);

            // Re-register any new sensors with backend
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const newSensors = transformedSensors.filter(
              (ts) => !sensors.find((s) => s.id === ts.id)
            );

            for (const sensor of newSensors) {
              const apiSensor = (data.sensors as APISensor[]).find((s) => s.id === sensor.id);
              if (apiSensor) {
                const connectionParams = apiSensor.connectionParams || {};
                const sensorConfig = {
                  name: apiSensor.id,
                  driver: apiSensor.driver,
                  connection_type: apiSensor.connectionType,
                  connection_params: apiSensor.pin ? { ...connectionParams, pin: apiSensor.pin } : connectionParams,
                  poll_interval: apiSensor.pollInterval || 1.0,
                  enabled: true,
                  calibration: apiSensor.calibration || {},
                };

                try {
                  const registerResponse = await fetch(`${backendUrl}/sensors/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sensorConfig),
                  });

                  if (registerResponse.ok) {
                    console.log(`✓ Registered new sensor ${sensor.name}`);
                  } else if (registerResponse.status === 409) {
                    console.log(`✓ Sensor ${sensor.name} already exists in backend`);
                  }
                } catch (error) {
                  console.error(`Failed to register new sensor ${sensor.name}:`, error);
                }
              }
            }

            // Mark as registered after adding new sensors
            if (newSensors.length > 0) {
              setSensorsRegistered(true);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for new sensors:', error);
      }
    };

    // Check immediately on mount, then every 10 seconds
    checkForNewSensors();
    const interval = setInterval(checkForNewSensors, 10000);

    return () => clearInterval(interval);
  }, [sensors]);

  // Keep sensors in a ref to avoid recreating interval on every sensor update
  const sensorsRef = React.useRef(sensors);
  React.useEffect(() => {
    sensorsRef.current = sensors;
  }, [sensors]);

  // Poll sensor readings for current values only
  // Background service handles data collection to database
  React.useEffect(() => {
    if (sensors.length === 0 || !sensorsRegistered) return;

    const pollCurrentValues = async () => {
      try {
        // Use ref to get latest sensors without recreating interval
        const currentSensors = sensorsRef.current;

        // Read all enabled sensors for current values only
        const readingsPromises = currentSensors.map(async (sensor) => {
          try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            const response = await fetch(`${backendUrl}/sensors/${sensor.id}/read`);
            if (response.ok) {
              const data = await response.json();
              return {
                sensorId: sensor.id,
                readings: data.readings,
              };
            }
          } catch (error) {
            console.error(`Error reading sensor ${sensor.id}:`, error);
          }
          return null;
        });

        const results = await Promise.all(readingsPromises);

        // Update current values in sensors (for display in controls card)
        setSensors((prev) =>
          prev.map((sensor) => {
            const sensorResult = results.find((r) => r?.sensorId === sensor.id);
            if (!sensorResult) return sensor;

            return {
              ...sensor,
              entities: sensor.entities.map((entity) => {
                // Match by entity name instead of ID
                const reading = sensorResult.readings.find((r: SensorReading) => {
                  const parts = r.entity_id.split('_');
                  const backendEntityName = parts.slice(1).join('_');
                  return backendEntityName === entity.name;
                });
                return {
                  ...entity,
                  currentValue: reading?.value,
                };
              }),
            };
          })
        );
      } catch (error) {
        console.error('Error polling sensor data:', error);
      }
    };

    // Poll immediately
    pollCurrentValues();

    // Then poll at configured interval
    const interval = setInterval(pollCurrentValues, updateInterval);
    return () => clearInterval(interval);
  }, [sensors.length, updateInterval, sensorsRegistered]);

  // Periodically load new graph data from database (only when not paused)
  React.useEffect(() => {
    if (sensors.length === 0 || isLivePaused) return;

    const loadGraphDataFromDB = async () => {
      try {
        const now = Date.now();
        const from = now - retentionTimeRef.current;

        const response = await fetch(`/api/sensor-readings?from=${from}&to=${now}`);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.length > 0) {
            setGraphData(data.data);
          }
        }
      } catch (error) {
        console.error('Error loading graph data from database:', error);
      }
    };

    // Load new data every update interval
    const interval = setInterval(loadGraphDataFromDB, updateInterval);
    return () => clearInterval(interval);
  }, [sensors.length, updateInterval, isLivePaused]);

  // Poll for active measurement updates
  React.useEffect(() => {
    if (!activeMeasurement) return;

    const updateMeasurementProgress = async () => {
      try {
        const response = await fetch('/api/measurements');
        if (response.ok) {
          const data = await response.json();
          const runningMeasurement = data.measurements?.find(
            (m: any) => m.id === activeMeasurement.id
          );

          if (runningMeasurement &&
              (runningMeasurement.status === 'RUNNING' || runningMeasurement.status === 'STARTING')) {
            const startedAt = new Date(runningMeasurement.startTime);
            const duration = runningMeasurement.duration;
            const elapsed = (Date.now() - startedAt.getTime()) / 1000;
            const progress = duration ? Math.min((elapsed / duration) * 100, 100) : 0;
            const estimatedCompletion = duration
              ? new Date(startedAt.getTime() + duration * 1000)
              : undefined;

            setActiveMeasurement({
              id: runningMeasurement.id,
              title: runningMeasurement.title,
              progress,
              startedAt,
              estimatedCompletion,
              measurementSensors: runningMeasurement.measurementSensors || [],
            });
          } else {
            // Measurement completed or cancelled
            setActiveMeasurement(null);
          }
        }
      } catch (error) {
        console.error('Error updating measurement progress:', error);
      }
    };

    // Update every 2 seconds
    const interval = setInterval(updateMeasurementProgress, 2000);
    return () => clearInterval(interval);
  }, [activeMeasurement]);

  const handleEntityVisibilityChange = (
    sensorId: string,
    entityId: string,
    isVisible: boolean
  ) => {
    // Update sensors state
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id === sensorId
          ? {
              ...sensor,
              entities: sensor.entities.map((entity) =>
                entity.id === entityId ? { ...entity, isVisible } : entity
              ),
            }
          : sensor
      )
    );

    // Save visibility to localStorage
    const currentSettings = loadVisibilitySettings();
    const newSettings = {
      ...currentSettings,
      [entityId]: isVisible,
    };
    saveVisibilitySettings(newSettings);
  };

  const colorUpdateTimeouts = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    const timeouts = colorUpdateTimeouts.current;
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  const handleEntityColorChange = async (
    sensorId: string,
    entityId: string,
    color: string
  ) => {
    // Update local state immediately for responsive UI
    setSensors((prev) =>
      prev.map((sensor) =>
        sensor.id === sensorId
          ? {
              ...sensor,
              entities: sensor.entities.map((entity) =>
                entity.id === entityId ? { ...entity, color } : entity
              ),
            }
          : sensor
      )
    );

    // Clear existing timeout for this entity
    if (colorUpdateTimeouts.current[entityId]) {
      clearTimeout(colorUpdateTimeouts.current[entityId]);
    }

    // Debounce database update (only save after user stops adjusting)
    colorUpdateTimeouts.current[entityId] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/sensor-entities/${entityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ color }),
        });

        if (!response.ok) {
          throw new Error('Failed to update entity color');
        }
      } catch (error) {
        console.error('Error updating entity color:', error);
        toast.error('Failed to update color');
      }
    }, 500); // Wait 500ms after last color change before saving
  };

  const handleCancelMeasurement = async (measurementId: string) => {
    try {
      const response = await fetch(`/api/measurements/${measurementId}/stop`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel measurement');
      }

      toast.success('Measurement cancelled');
      setActiveMeasurement(null);
    } catch (error) {
      console.error('Error cancelling measurement:', error);
      toast.error('Failed to cancel measurement');
    }
  };

  const handleMeasurementStarted = async () => {
    // Reload measurements after starting a new one
    try {
      const measurementsResponse = await fetch('/api/measurements');
      if (measurementsResponse.ok) {
        const measurementsData = await measurementsResponse.json();
        const runningMeasurement = measurementsData.measurements?.find(
          (m: any) => m.status === 'RUNNING' || m.status === 'STARTING'
        );

        if (runningMeasurement) {
          const startedAt = new Date(runningMeasurement.startTime);
          const duration = runningMeasurement.duration;
          const elapsed = (Date.now() - startedAt.getTime()) / 1000;
          const progress = duration ? Math.min((elapsed / duration) * 100, 100) : 0;
          const estimatedCompletion = duration
            ? new Date(startedAt.getTime() + duration * 1000)
            : undefined;

          setActiveMeasurement({
            id: runningMeasurement.id,
            title: runningMeasurement.title,
            progress,
            startedAt,
            estimatedCompletion,
            measurementSensors: runningMeasurement.measurementSensors || [],
          });
        }
      }
    } catch (error) {
      console.error('Error loading measurement after start:', error);
    }
  };

  // Flatten all visible entities for graph
  const allEntities = sensors.flatMap((sensor) => sensor.entities);

  // Show loading or no sensors state
  if (isLoadingSensors) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (sensors.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-lg font-semibold">{t('noSensorsConnected')}</p>
          <p className="text-sm text-muted-foreground">{t('noSensorsDescription')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        {!activeMeasurement && sensors.length > 0 && (
          <StartMeasurementDrawer
            trigger={
              <Button size="lg" className="gap-2">
                <PlayCircle className="h-5 w-5" />
                {tMeasurements('startMeasurement')}
              </Button>
            }
            onMeasurementStarted={handleMeasurementStarted}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Graph Section */}
        <div className="space-y-6">
          <SensorGraphCard
            data={graphData}
            entities={allEntities}
            isRealTime={!isLivePaused}
            isPaused={isLivePaused}
            onPauseToggle={() => setIsLivePaused(!isLivePaused)}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
          />

          {/* Active Measurement Progress */}
          {activeMeasurement && (
            <MeasurementProgressCard
              measurement={activeMeasurement}
              onCancel={handleCancelMeasurement}
            />
          )}
        </div>

        {/* Sensor Controls Sidebar */}
        <div>
          <SensorControlsCard
            sensors={sensors}
            onEntityVisibilityChange={handleEntityVisibilityChange}
            onEntityColorChange={handleEntityColorChange}
          />
        </div>
      </div>

    </div>
  );
}
