'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const config: Partial<HardwareConfig> = {
        boardType,
      };

      const response = await fetch('/api/hardware/config', {
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
