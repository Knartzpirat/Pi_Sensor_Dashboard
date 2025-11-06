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
}

export function SensorControlsCard({
  sensors,
  onEntityVisibilityChange,
}: SensorControlsCardProps) {
  const t = useTranslations('dashboard.sensors');
  const tCommon = useTranslations('common');

  if (sensors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {useTranslations('dashboard')('noSensorsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {useTranslations('dashboard')('noSensorsConnected')}
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
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entity.color }}
                      />
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
