'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, Trash2, RotateCw } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';

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

interface CompletedMeasurement {
  id: string;
  sessionId: string;
  title: string;
  description?: string | null;
  startedAt: Date;
  endedAt: Date;
  duration: number; // in seconds
  readingsCount: number;
  errorCount: number;
  measurementSensors?: MeasurementSensor[];
  interval: number;
}

interface CompletedMeasurementCardProps {
  measurement: CompletedMeasurement;
  onClear: () => void | Promise<void>;
  onRepeat: (measurement: CompletedMeasurement) => void | Promise<void>;
}

export function CompletedMeasurementCard({
  measurement,
  onClear,
  onRepeat,
}: CompletedMeasurementCardProps) {
  const t = useTranslations('dashboard.completedMeasurement');
  const tMeasurements = useTranslations('measurements');
  const tCommon = useTranslations('common');

  const totalDurationMinutes = Math.floor(measurement.duration / 60);
  const totalDurationSeconds = measurement.duration % 60;

  return (
    <Card className="border-green-500 dark:border-green-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-700" />
              {t('title')}
            </CardTitle>
            <CardDescription>{measurement.title}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRepeat(measurement)}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              {t('repeat')}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('clear')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirmClear')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('confirmClearDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onClear}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {t('clear')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Information */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('startedAt')}</p>
            <p className="font-medium">
              {formatDate(measurement.startedAt, 'dateTime')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('completedAt')}</p>
            <p className="font-medium">
              {formatDate(measurement.endedAt, 'dateTime')}
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
          <div>
            <p className="text-muted-foreground">{t('duration')}</p>
            <p className="font-medium">
              {totalDurationMinutes}m {totalDurationSeconds}s
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('readingsCount')}</p>
            <p className="font-medium">{measurement.readingsCount}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('errorCount')}</p>
            <p className="font-medium">{measurement.errorCount}</p>
          </div>
        </div>

        {/* Sensor-TestObject Assignments */}
        {measurement.measurementSensors && measurement.measurementSensors.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground">
              {tMeasurements('sensors')}
            </p>
            <div className="space-y-1.5">
              {measurement.measurementSensors.map((ms) => (
                <div
                  key={ms.sensor.id}
                  className="flex items-center justify-between text-sm px-2 py-1.5 rounded-md bg-muted/50"
                >
                  <span className="font-medium">{ms.sensor.name}</span>
                  {ms.testObject ? (
                    <span className="text-xs text-muted-foreground">
                      {ms.testObject.title}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      {tMeasurements('noTestObject')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
