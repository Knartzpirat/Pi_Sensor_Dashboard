'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Activity, TrendingUp } from 'lucide-react';
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
}

export function SensorGraphCard({
  data,
  entities,
  isRealTime = false,
}: SensorGraphCardProps) {
  const t = useTranslations('dashboard');

  const visibleEntities = entities.filter((e) => e.isVisible);

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
    <Card className="col-span-full">
      <CardHeader>
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
        </CardTitle>
        <CardDescription>
          {visibleEntities.length} active{' '}
          {visibleEntities.length === 1 ? 'entity' : 'entities'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <AreaChart
            data={data}
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
