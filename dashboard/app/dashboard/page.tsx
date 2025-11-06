'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SensorGraphCard } from './_components/sensor-graph-card';
import { SensorControlsCard } from './_components/sensor-controls-card';
import { MeasurementProgressCard } from './_components/measurement-progress-card';

// TODO: Replace with actual data from API/WebSocket
// Mock data structure for demonstration
interface SensorEntity {
  id: string;
  name: string;
  unit: string;
  currentValue?: number;
  isVisible: boolean;
  color: string;
}

interface Sensor {
  id: string;
  name: string;
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

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  // TODO: Replace with real state management (API, WebSocket, etc.)
  const [sensors, setSensors] = React.useState<Sensor[]>([
    {
      id: 'sensor-1',
      name: 'Temperature Sensor DHT22',
      isConnected: true,
      entities: [
        {
          id: 'temp-1',
          name: 'Temperature',
          unit: '°C',
          currentValue: 22.5,
          isVisible: true,
          color: '#ef4444',
        },
        {
          id: 'humid-1',
          name: 'Humidity',
          unit: '%',
          currentValue: 45,
          isVisible: true,
          color: '#3b82f6',
        },
      ],
    },
    {
      id: 'sensor-2',
      name: 'Pressure Sensor BMP280',
      isConnected: true,
      entities: [
        {
          id: 'pressure-1',
          name: 'Pressure',
          unit: 'hPa',
          currentValue: 1013,
          isVisible: false,
          color: '#10b981',
        },
      ],
    },
  ]);

  // TODO: Replace with real measurement data from API
  const [activeMeasurement, setActiveMeasurement] =
    React.useState<Measurement | null>(null);

  // Generate mock graph data
  // TODO: Replace with real-time data from WebSocket or API
  const [graphData, setGraphData] = React.useState<DataPoint[]>(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => ({
      timestamp: now - (19 - i) * 5000, // 5 second intervals
      'temp-1': 20 + Math.random() * 5,
      'humid-1': 40 + Math.random() * 10,
      'pressure-1': 1010 + Math.random() * 6,
    }));
  });

  // Simulate real-time data updates
  // TODO: Replace with actual WebSocket connection
  React.useEffect(() => {
    const interval = setInterval(() => {
      setGraphData((prev) => {
        const newData = [...prev.slice(1)];
        const lastPoint = prev[prev.length - 1];
        newData.push({
          timestamp: Date.now(),
          'temp-1': lastPoint['temp-1'] + (Math.random() - 0.5) * 0.5,
          'humid-1': lastPoint['humid-1'] + (Math.random() - 0.5) * 2,
          'pressure-1': lastPoint['pressure-1'] + (Math.random() - 0.5) * 0.5,
        });
        return newData;
      });

      // Update current values
      setSensors((prev) =>
        prev.map((sensor) => ({
          ...sensor,
          entities: sensor.entities.map((entity) => ({
            ...entity,
            currentValue:
              graphData[graphData.length - 1]?.[entity.id] || entity.currentValue,
          })),
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [graphData]);

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
