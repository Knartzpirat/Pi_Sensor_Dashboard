'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SensorGraphCard } from './_components/sensor-graph-card';
import { SensorControlsCard } from './_components/sensor-controls-card';
import { MeasurementProgressCard } from './_components/measurement-progress-card';

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

interface Measurement {
  id: string;
  title: string;
  progress: number;
  startedAt: Date;
  estimatedCompletion?: Date;
}

// Generate colors for entities
const ENTITY_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  const [sensors, setSensors] = React.useState<Sensor[]>([]);
  const [isLoadingSensors, setIsLoadingSensors] = React.useState(true);
  const [activeMeasurement, setActiveMeasurement] = React.useState<Measurement | null>(null);
  const [graphData, setGraphData] = React.useState<DataPoint[]>([]);

  // Load sensors from API
  React.useEffect(() => {
    const loadSensors = async () => {
      try {
        const response = await fetch('/api/sensors');
        const data = await response.json();

        if (data.sensors) {
          // Transform sensors to match component interface
          let colorIndex = 0;
          const transformedSensors: Sensor[] = data.sensors
            .filter((s: any) => s.enabled) // Only show enabled sensors
            .map((sensor: any) => ({
              id: sensor.id,
              name: sensor.name,
              driver: sensor.driver,
              enabled: sensor.enabled,
              isConnected: sensor.enabled, // Treat enabled sensors as connected
              entities: sensor.entities.map((entity: any) => ({
                id: entity.id,
                name: entity.name,
                unit: entity.unit,
                type: entity.type,
                isVisible: true, // All entities visible by default
                color: ENTITY_COLORS[colorIndex++ % ENTITY_COLORS.length],
                currentValue: undefined,
              })),
            }));

          setSensors(transformedSensors);

          // Initialize graph data with empty points
          const now = Date.now();
          const initialData = Array.from({ length: 20 }, (_, i) => {
            const point: DataPoint = {
              timestamp: now - (19 - i) * 5000, // 5 second intervals
            };
            return point;
          });
          setGraphData(initialData);
        }
      } catch (error) {
        console.error('Error loading sensors:', error);
        toast.error('Failed to load sensors');
      } finally {
        setIsLoadingSensors(false);
      }
    };

    loadSensors();
  }, []);

  // Poll sensor readings
  React.useEffect(() => {
    if (sensors.length === 0) return;

    const pollSensorData = async () => {
      try {
        // Read all enabled sensors
        const readingsPromises = sensors.map(async (sensor) => {
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

        // Update graph data and current values
        setGraphData((prev) => {
          const newData = [...prev.slice(1)];
          const newPoint: DataPoint = {
            timestamp: Date.now(),
          };

          // Add readings to new point
          results.forEach((result) => {
            if (result) {
              result.readings.forEach((reading: any) => {
                newPoint[reading.entity_id] = reading.value;
              });
            }
          });

          newData.push(newPoint);
          return newData;
        });

        // Update current values in sensors
        setSensors((prev) =>
          prev.map((sensor) => {
            const sensorResult = results.find((r) => r?.sensorId === sensor.id);
            if (!sensorResult) return sensor;

            return {
              ...sensor,
              entities: sensor.entities.map((entity) => {
                const reading = sensorResult.readings.find((r: any) => r.entity_id === entity.id);
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
    pollSensorData();

    // Then poll every 5 seconds
    const interval = setInterval(pollSensorData, 5000);
    return () => clearInterval(interval);
  }, [sensors.length]);

  const handleEntityVisibilityChange = (
    sensorId: string,
    entityId: string,
    isVisible: boolean
  ) => {
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
  };

  const handleCancelMeasurement = async (measurementId: string) => {
    // TODO: Implement actual API call to cancel measurement
    console.log('Cancelling measurement:', measurementId);
    toast.success('Measurement cancelled');
    setActiveMeasurement(null);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Graph Section */}
        <div className="space-y-6">
          <SensorGraphCard
            data={graphData}
            entities={allEntities}
            isRealTime={true}
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
          />
        </div>
      </div>

      {/* TODO Button - For testing measurement progress */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => {
            if (activeMeasurement) {
              setActiveMeasurement(null);
            } else {
              setActiveMeasurement({
                id: 'measurement-1',
                title: 'Test Measurement for Object #123',
                progress: 45,
                startedAt: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
                estimatedCompletion: new Date(Date.now() + 1000 * 60 * 12), // 12 minutes from now
              });
            }
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90 text-sm font-medium"
        >
          {activeMeasurement ? 'Hide' : 'Show'} Test Measurement
        </button>
      </div>
    </div>
  );
}
