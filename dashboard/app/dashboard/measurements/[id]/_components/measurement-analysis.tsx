'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart as LineChartIcon, ScatterChart as ScatterIcon, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Measurement } from '@/types';

type ChartType = 'line' | 'bar' | 'scatter';

interface MeasurementAnalysisProps {
  measurement: Measurement;
}

interface ChartData {
  timestamp: number;
  formattedTime: string;
  [key: string]: number | string;
}

interface Statistics {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
  count: number;
}

export function MeasurementAnalysis({ measurement }: MeasurementAnalysisProps) {
  const t = useTranslations();
  const [chartType, setChartType] = React.useState<ChartType>('line');
  const [selectedEntities, setSelectedEntities] = React.useState<Set<string>>(new Set());
  const [statistics, setStatistics] = React.useState<Record<string, Statistics>>({});

  // Get all available entities from sensors
  const allEntities = React.useMemo(() => {
    const entities: Array<{ id: string; name: string; unit: string; sensorName: string; color: string }> = [];
    measurement.measurementSensors?.forEach((ms) => {
      ms.sensor.entities?.forEach((entity) => {
        entities.push({
          id: entity.id,
          name: entity.name,
          unit: entity.unit,
          sensorName: ms.sensor.name,
          color: entity.color || '#8884d8',
        });
      });
    });
    return entities;
  }, [measurement]);

  // Initialize with all entities selected
  React.useEffect(() => {
    if (allEntities.length > 0 && selectedEntities.size === 0) {
      setSelectedEntities(new Set(allEntities.map((e) => e.id)));
    }
  }, [allEntities, selectedEntities.size]);

  // Process readings into chart data
  const chartData = React.useMemo((): ChartData[] => {
    if (!measurement.readings || measurement.readings.length === 0) {
      return [];
    }

    // Group readings by timestamp
    const groupedByTimestamp = new Map<number, Record<string, number>>();

    measurement.readings.forEach((reading) => {
      const timestamp = new Date(reading.timestamp).getTime();
      if (!groupedByTimestamp.has(timestamp)) {
        groupedByTimestamp.set(timestamp, {});
      }

      const group = groupedByTimestamp.get(timestamp)!;
      group[reading.entityId] = reading.value;
    });

    // Convert to array and format
    const data = Array.from(groupedByTimestamp.entries())
      .map(([timestamp, values]) => ({
        timestamp,
        formattedTime: new Date(timestamp).toLocaleTimeString(),
        ...values,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    return data;
  }, [measurement.readings]);

  // Calculate statistics for selected entities
  React.useEffect(() => {
    const newStats: Record<string, Statistics> = {};

    selectedEntities.forEach((entityId) => {
      const values = chartData
        .map((d) => d[entityId])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

      if (values.length === 0) return;

      // Calculate statistics
      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      newStats[entityId] = {
        mean,
        median,
        std,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    });

    setStatistics(newStats);
  }, [chartData, selectedEntities]);

  const toggleEntity = (entityId: string) => {
    setSelectedEntities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entityId)) {
        newSet.delete(entityId);
      } else {
        newSet.add(entityId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedEntities(new Set(allEntities.map((e) => e.id)));
  };

  const deselectAll = () => {
    setSelectedEntities(new Set());
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium">{t('measurementsPage.analysis.noData')}</p>
            <div className="mt-4 text-sm space-y-2">
              <p>Readings: {measurement.readings?.length || 0}</p>
              <p>Sensors: {measurement.measurementSensors?.length || 0}</p>
              <p>Entities: {allEntities.length}</p>
              {measurement.readings?.length === 0 && (
                <p className="text-yellow-600 mt-4">
                  No sensor readings found. Start the measurement to collect data.
                </p>
              )}
              {allEntities.length === 0 && measurement.readings && measurement.readings.length > 0 && (
                <p className="text-yellow-600 mt-4">
                  Sensors have no entities configured. Check sensor configuration.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'bar' ? BarChart : ScatterChart;

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ChartComponent data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
            }}
          />
          <Legend />
          {allEntities
            .filter((entity) => selectedEntities.has(entity.id))
            .map((entity) => {
              const name = `${entity.sensorName} - ${entity.name}`;

              if (chartType === 'line') {
                return (
                  <Line
                    key={entity.id}
                    type="monotone"
                    dataKey={entity.id}
                    name={name}
                    stroke={entity.color}
                    fill={entity.color}
                    strokeWidth={2}
                  />
                );
              } else if (chartType === 'bar') {
                return (
                  <Bar
                    key={entity.id}
                    dataKey={entity.id}
                    name={name}
                    stroke={entity.color}
                    fill={entity.color}
                    strokeWidth={2}
                  />
                );
              } else {
                return (
                  <Scatter
                    key={entity.id}
                    dataKey={entity.id}
                    name={name}
                    fill={entity.color}
                  />
                );
              }
            })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t('measurementsPage.analysis.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('measurementsPage.analysis.description')}
        </p>
      </div>

      {/* Chart Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>{t('measurementsPage.analysis.chartConfig')}</CardTitle>
          <CardDescription>{t('measurementsPage.analysis.chartConfigDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart Type Selection */}
          <div className="space-y-2">
            <Label>{t('measurementsPage.analysis.chartType')}</Label>
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => setChartType('line')}
              >
                <LineChartIcon className="h-6 w-6" />
                <span className="text-xs">{t('measurementsPage.analysis.lineChart')}</span>
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => setChartType('bar')}
              >
                <BarChart3 className="h-6 w-6" />
                <span className="text-xs">{t('measurementsPage.analysis.barChart')}</span>
              </Button>
              <Button
                variant={chartType === 'scatter' ? 'default' : 'outline'}
                className="h-auto flex-col gap-2 py-4"
                onClick={() => setChartType('scatter')}
              >
                <ScatterIcon className="h-6 w-6" />
                <span className="text-xs">{t('measurementsPage.analysis.scatterChart')}</span>
              </Button>
            </div>
          </div>

          {/* Entity Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('measurementsPage.analysis.selectData')}</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {t('common.selectAll')}
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>
                  {t('common.clear')}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto border rounded-lg p-4">
              {allEntities.map((entity) => (
                <div key={entity.id} className="flex items-start space-x-2">
                  <Checkbox
                    id={entity.id}
                    checked={selectedEntities.has(entity.id)}
                    onCheckedChange={() => toggleEntity(entity.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={entity.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entity.color }}
                        />
                        {entity.name}
                      </div>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {entity.sensorName} • {entity.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card>
        <CardHeader>
          <CardTitle>{t('measurementsPage.analysis.visualization')}</CardTitle>
          <CardDescription>
            {selectedEntities.size} {t('measurementsPage.analysis.dataSeriesSelected')}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>

      {/* Statistics */}
      {selectedEntities.size > 0 && Object.keys(statistics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              {t('measurementsPage.analysis.statistics')}
            </CardTitle>
            <CardDescription>{t('measurementsPage.analysis.statisticsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {allEntities
                .filter((entity) => selectedEntities.has(entity.id) && statistics[entity.id])
                .map((entity) => {
                  const stats = statistics[entity.id];
                  return (
                    <div key={entity.id} className="space-y-2 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entity.color }}
                          />
                          {entity.sensorName} - {entity.name}
                        </h4>
                        <Badge variant="outline">{entity.unit}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('measurementsPage.analysis.mean')}</p>
                          <p className="font-medium">{stats.mean.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('measurementsPage.analysis.median')}</p>
                          <p className="font-medium">{stats.median.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('measurementsPage.analysis.std')}</p>
                          <p className="font-medium">{stats.std.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('measurementsPage.analysis.min')}</p>
                          <p className="font-medium">{stats.min.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('measurementsPage.analysis.max')}</p>
                          <p className="font-medium">{stats.max.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('measurementsPage.analysis.count')}</p>
                          <p className="font-medium">{stats.count}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
