'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, Activity } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SensorEntity {
  id: string;
  name: string;
  unit: string;
  currentValue?: number;
  isVisible: boolean;
  color: string; // For graph line color
}

interface Sensor {
  id: string;
  name: string;
  isConnected: boolean;
  entities: SensorEntity[];
}

interface SensorControlsCardProps {
  sensors: Sensor[];
  onEntityVisibilityChange: (
    sensorId: string,
    entityId: string,
    isVisible: boolean
  ) => void;
  onEntityColorChange?: (
    sensorId: string,
    entityId: string,
    color: string
  ) => void;
}

export function SensorControlsCard({
  sensors,
  onEntityVisibilityChange,
  onEntityColorChange,
}: SensorControlsCardProps) {
  const t = useTranslations('dashboard.sensors');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');

  if (sensors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {tDashboard('noSensorsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {tDashboard('noSensorsConnected')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {sensors.filter((s) => s.isConnected).length} /{' '}
          {sensors.length} {tCommon('selected')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{sensor.name}</h4>
              <Badge
                variant={sensor.isConnected ? 'default' : 'secondary'}
                className="text-xs"
              >
                {sensor.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>

            {sensor.entities.length === 0 ? (
              <p className="text-sm text-muted-foreground pl-4">
                {t('noEntities')}
              </p>
            ) : (
              <div className="space-y-2 pl-4">
                {sensor.entities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 p-0"
                            disabled={!sensor.isConnected}
                          >
                            <div
                              className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
                              style={{ backgroundColor: entity.color }}
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`color-${entity.id}`}>
                                Choose Color
                              </Label>
                              <div className="flex gap-2 mt-2">
                                <input
                                  id={`color-${entity.id}`}
                                  type="color"
                                  value={entity.color}
                                  onChange={(e) =>
                                    onEntityColorChange?.(
                                      sensor.id,
                                      entity.id,
                                      e.target.value
                                    )
                                  }
                                  className="h-10 w-full rounded border cursor-pointer"
                                  disabled={!sensor.isConnected}
                                />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {entity.color}
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <div>
                        <Label
                          htmlFor={`entity-${entity.id}`}
                          className="cursor-pointer"
                        >
                          {entity.name}
                        </Label>
                        {entity.currentValue !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {entity.currentValue} {entity.unit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {entity.isVisible ? (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Switch
                        id={`entity-${entity.id}`}
                        checked={entity.isVisible}
                        onCheckedChange={(checked) =>
                          onEntityVisibilityChange(
                            sensor.id,
                            entity.id,
                            checked
                          )
                        }
                        disabled={!sensor.isConnected}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
