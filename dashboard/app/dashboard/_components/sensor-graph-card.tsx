'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Activity, TrendingUp, Pause, Play } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface DataPoint {
  timestamp: number;
  [key: string]: number; // Dynamic keys for different sensor entities
}

interface SensorEntity {
  id: string;
  name: string;
  unit: string;
  color: string;
  isVisible: boolean;
}

interface SensorGraphCardProps {
  data: DataPoint[];
  entities: SensorEntity[];
  isRealTime?: boolean;
  isPaused?: boolean;
  onPauseToggle?: () => void;
  timeRange?: string;
  onTimeRangeChange?: (value: string) => void;
}

// Time range options in milliseconds (defined outside component to prevent recreation)
const TIME_RANGES: Record<string, { value: string; label: string; ms: number }> = {
  '15s': { value: '15s', label: '15 Seconds', ms: 15 * 1000 },
  '30s': { value: '30s', label: '30 Seconds', ms: 30 * 1000 },
  '1m': { value: '1m', label: '1 Minute', ms: 60 * 1000 },
  '5m': { value: '5m', label: '5 Minutes', ms: 5 * 60 * 1000 },
  '15m': { value: '15m', label: '15 Minutes', ms: 15 * 60 * 1000 },
  '30m': { value: '30m', label: '30 Minutes', ms: 30 * 60 * 1000 },
  '1h': { value: '1h', label: '1 Hour', ms: 60 * 60 * 1000 },
  '6h': { value: '6h', label: '6 Hours', ms: 6 * 60 * 60 * 1000 },
  '12h': { value: '12h', label: '12 Hours', ms: 12 * 60 * 60 * 1000 },
  '24h': { value: '24h', label: '24 Hours', ms: 24 * 60 * 60 * 1000 },
  '48h': { value: '48h', label: '48 Hours', ms: 48 * 60 * 60 * 1000 },
};

export function SensorGraphCard({
  data,
  entities,
  isRealTime = false,
  isPaused = false,
  onPauseToggle,
  timeRange = '5m',
  onTimeRangeChange,
}: SensorGraphCardProps) {
  const t = useTranslations('dashboard');

  const visibleEntities = entities.filter((e) => e.isVisible);

  // Filter data based on selected time range
  const filteredData = React.useMemo(() => {
    const selectedRange = TIME_RANGES[timeRange];
    if (!selectedRange) {
      return data;
    }

    const now = Date.now();
    const cutoff = now - selectedRange.ms;
    return data.filter((point) => point.timestamp >= cutoff);
  }, [data, timeRange]);

  // Create chart configuration from visible entities
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    visibleEntities.forEach((entity) => {
      config[entity.id] = {
        label: `${entity.name} (${entity.unit})`,
        color: entity.color,
      };
    });
    return config;
  }, [visibleEntities]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (visibleEntities.length === 0) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('currentReading')}
          </CardTitle>
          <CardDescription>
            {isRealTime
              ? 'Real-time sensor data visualization'
              : 'Historical sensor data visualization'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Select sensor entities to display in the graph
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('currentReading')}
            {isRealTime && (
              <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Live
              </span>
            )}
            {isPaused && (
              <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                <Pause className="h-3 w-3" />
                Paused
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {visibleEntities.length} active{' '}
            {visibleEntities.length === 1 ? 'entity' : 'entities'} • {filteredData.length} data points
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPauseToggle}
            className="h-9"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger
              className="w-[160px] rounded-lg"
              aria-label="Select time range"
            >
            <SelectValue placeholder="Time Range">
              {TIME_RANGES[timeRange]?.label || timeRange}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="15s" className="rounded-lg">
              Last 15 seconds
            </SelectItem>
            <SelectItem value="30s" className="rounded-lg">
              Last 30 seconds
            </SelectItem>
            <SelectItem value="1m" className="rounded-lg">
              Last 1 minute
            </SelectItem>
            <SelectItem value="5m" className="rounded-lg">
              Last 5 minutes
            </SelectItem>
            <SelectItem value="15m" className="rounded-lg">
              Last 15 minutes
            </SelectItem>
            <SelectItem value="30m" className="rounded-lg">
              Last 30 minutes
            </SelectItem>
            <SelectItem value="1h" className="rounded-lg">
              Last 1 hour
            </SelectItem>
            <SelectItem value="6h" className="rounded-lg">
              Last 6 hours
            </SelectItem>
            <SelectItem value="12h" className="rounded-lg">
              Last 12 hours
            </SelectItem>
            <SelectItem value="24h" className="rounded-lg">
              Last 24 hours
            </SelectItem>
            <SelectItem value="48h" className="rounded-lg">
              Last 48 hours
            </SelectItem>
          </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <AreaChart
            data={filteredData}
            margin={{
              top: 10,
              right: 12,
              left: 12,
              bottom: 0,
            }}
          >
            <defs>
              {visibleEntities.map((entity) => (
                <linearGradient
                  key={`gradient-${entity.id}`}
                  id={`fill-${entity.id}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={entity.color}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={entity.color}
                    stopOpacity={0.1}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatTimestamp}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatTimestamp(value as number)}
                  indicator="dot"
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {visibleEntities.map((entity) => (
              <Area
                key={entity.id}
                dataKey={entity.id}
                type="monotone"
                fill={`url(#fill-${entity.id})`}
                stroke={entity.color}
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 6,
                }}
                isAnimationActive={isRealTime}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
