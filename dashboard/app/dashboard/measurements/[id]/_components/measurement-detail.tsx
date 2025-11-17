'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Calendar, Clock, FlaskConical, Activity, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/format';
import { MeasurementAnalysis } from './measurement-analysis';
import type { Measurement } from '@/types';

interface MeasurementDetailProps {
  measurement: Measurement;
}

export function MeasurementDetail({ measurement }: MeasurementDetailProps) {
  const router = useRouter();
  const t = useTranslations();

  const duration = measurement.endTime
    ? Math.floor((new Date(measurement.endTime).getTime() - new Date(measurement.startTime).getTime()) / 1000)
    : measurement.duration;

  const minutes = duration ? Math.floor(duration / 60) : 0;
  const seconds = duration ? duration % 60 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/measurements')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{measurement.title}</h1>
          {measurement.description && (
            <p className="text-muted-foreground">{measurement.description}</p>
          )}
        </div>
        <Badge
          variant={
            measurement.status === 'COMPLETED'
              ? 'default'
              : measurement.status === 'RUNNING'
              ? 'secondary'
              : 'destructive'
          }
        >
          {t(`measurementsPage.status.${measurement.status.toLowerCase()}`)}
        </Badge>
      </div>

      {/* Measurement Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('measurementsPage.detail.startTime')}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDate(measurement.startTime, 'time')}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(measurement.startTime, 'date')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('measurementsPage.detail.duration')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {minutes}m {seconds}s
            </div>
            <p className="text-xs text-muted-foreground">
              {t('measurementsPage.detail.interval')}: {measurement.interval}s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('measurementsPage.detail.readings')}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(measurement.readings?.length || measurement.readingsCount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('measurementsPage.detail.dataPoints')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('measurementsPage.detail.errors')}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{measurement.errorCount}</div>
            <p className="text-xs text-muted-foreground">
              {t('measurementsPage.detail.errorCount')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sensors and Test Objects */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            {t('measurementsPage.detail.sensorsAndTestObjects')}
          </CardTitle>
          <CardDescription>
            {t('measurementsPage.detail.sensorsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {measurement.measurementSensors?.map((ms) => (
              <div
                key={ms.id}
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold">{ms.sensor.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {ms.sensor.entities?.length || 0} {t('measurementsPage.detail.entities')}
                  </p>
                  {ms.sensor.entities && ms.sensor.entities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ms.sensor.entities.map((entity) => (
                        <Badge key={entity.id} variant="outline" className="text-xs">
                          {entity.name} ({entity.unit})
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {ms.testObject ? (
                    <Badge variant="secondary">{ms.testObject.title}</Badge>
                  ) : (
                    <Badge variant="outline">{t('measurementsPage.detail.noTestObject')}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Analysis Section */}
      <MeasurementAnalysis measurement={measurement} />
    </div>
  );
}
