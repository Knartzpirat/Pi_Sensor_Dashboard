'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

import type { HardwareConfig, BoardType } from '@/types/hardware';

interface HardwareSettingsSectionProps {
  initialConfig: HardwareConfig | null;
}

export function HardwareSettingsSection({ initialConfig }: HardwareSettingsSectionProps) {
  const t = useTranslations('settings.hardware');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [boardType, setBoardType] = React.useState<BoardType>(
    initialConfig?.boardType as BoardType || 'GPIO'
  );

  const [dashboardUpdateInterval, setDashboardUpdateInterval] = React.useState<number>(
    initialConfig?.dashboardUpdateInterval || 5000
  );

  const [graphDataRetentionTime, setGraphDataRetentionTime] = React.useState<number>(
    initialConfig?.graphDataRetentionTime || 3600000
  );

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const config: Partial<HardwareConfig> = {
        boardType,
        dashboardUpdateInterval,
        graphDataRetentionTime,
      };

      const response = await fetch('/api/settings/hardware', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save hardware config');
      }

      toast.success(t('configSaved'));

      // Refresh the router cache to reload board-specific sensors
      router.refresh();
    } catch (error) {
      console.error('Error saving hardware config:', error);
      toast.error(t('configError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Board Type Selection */}
        <div className="space-y-4">
          <Label>{t('boardType')}</Label>
          <RadioGroup value={boardType} onValueChange={(value) => setBoardType(value as BoardType)}>
            <div className="flex flex-col space-y-3">
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
                <RadioGroupItem value="GPIO" id="board-gpio" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="board-gpio" className="font-semibold cursor-pointer">
                    {t('boardTypes.gpio')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('boardTypes.gpioDescription')}
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
                <RadioGroupItem value="CUSTOM" id="board-custom" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="board-custom" className="font-semibold cursor-pointer">
                    {t('boardTypes.custom')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('boardTypes.customDescription')}
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Dashboard Update Interval */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dashboard-interval">{t('dashboardUpdateInterval')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('dashboardUpdateIntervalDescription')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Input
              id="dashboard-interval"
              type="number"
              min="100"
              max="60000"
              step="100"
              value={dashboardUpdateInterval}
              onChange={(e) => setDashboardUpdateInterval(parseInt(e.target.value, 10))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">ms</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('dashboardUpdateIntervalNote')}
          </p>
        </div>

        {/* Graph Data Retention Time */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retention-time">{t('graphDataRetentionTime')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('graphDataRetentionTimeDescription')}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Input
              id="retention-time"
              type="number"
              min="60000"
              max="86400000"
              step="60000"
              value={graphDataRetentionTime}
              onChange={(e) => setGraphDataRetentionTime(parseInt(e.target.value, 10))}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">ms</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>≈ {Math.round(graphDataRetentionTime / 60000)} {t('minutes')}</span>
            <span>({Math.round(graphDataRetentionTime / 3600000)} {t('hours')})</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('graphDataRetentionTimeNote')}
          </p>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? tCommon('loading') : tCommon('save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
