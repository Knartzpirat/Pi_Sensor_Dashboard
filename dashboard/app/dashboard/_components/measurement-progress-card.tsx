'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, XCircle } from 'lucide-react';

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
import { Progress } from '@/components/ui/progress';
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

interface Measurement {
  id: string;
  title: string;
  progress: number; // 0-100
  startedAt: Date;
  estimatedCompletion?: Date;
  measurementSensors?: MeasurementSensor[];
}

interface MeasurementProgressCardProps {
  measurement: Measurement;
  onCancel: (measurementId: string) => void | Promise<void>;
}

export function MeasurementProgressCard({
  measurement,
  onCancel,
}: MeasurementProgressCardProps) {
  const t = useTranslations('dashboard.measurement');
  const tMeasurements = useTranslations('measurements');
  const tCommon = useTranslations('common');
  const [isCancelling, setIsCancelling] = React.useState(false);

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(measurement.id);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              {t('title')}
            </CardTitle>
            <CardDescription>{measurement.title}</CardDescription>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isCancelling}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t('cancel')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('confirmCancel')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('confirmCancelDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {tCommon('cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {t('cancel')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('progress')}</span>
            <span className="font-medium">{measurement.progress.toFixed(2)}%</span>
          </div>
          <Progress value={measurement.progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{t('startedAt')}</p>
            <p className="font-medium">
              {formatDate(measurement.startedAt, 'dateTime')}
            </p>
          </div>
          {measurement.estimatedCompletion && (
            <div>
              <p className="text-muted-foreground">{t('estimatedCompletion')}</p>
              <p className="font-medium">
                {formatDate(measurement.estimatedCompletion, 'dateTime')}
              </p>
            </div>
          )}
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
