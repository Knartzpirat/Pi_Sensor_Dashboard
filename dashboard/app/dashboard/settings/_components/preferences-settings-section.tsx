'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { setUserDateFormatPreference } from '@/config/date-format';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface UserPreferences {
  id: string;
  dateFormat: string;
  timezone: string;
}

interface PreferencesSettingsSectionProps {
  initialPreferences: UserPreferences;
}

const DATE_FORMATS = [
  { value: 'DD.MM.YYYY', key: 'ddmmyyyy' },
  { value: 'MM/DD/YYYY', key: 'mmddyyyy' },
  { value: 'YYYY-MM-DD', key: 'yyyymmdd' },
  { value: 'DD/MM/YYYY', key: 'ddmmyyyy_slash' },
];

// Common timezones - can be extended
const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Europe/Berlin (GMT+1/+2)' },
  { value: 'Europe/London', label: 'Europe/London (GMT+0/+1)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1/+2)' },
  { value: 'Europe/Rome', label: 'Europe/Rome (GMT+1/+2)' },
  { value: 'Europe/Madrid', label: 'Europe/Madrid (GMT+1/+2)' },
  { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (GMT+1/+2)' },
  { value: 'Europe/Vienna', label: 'Europe/Vienna (GMT+1/+2)' },
  { value: 'Europe/Zurich', label: 'Europe/Zurich (GMT+1/+2)' },
  { value: 'America/New_York', label: 'America/New York (GMT-5/-4)' },
  { value: 'America/Chicago', label: 'America/Chicago (GMT-6/-5)' },
  { value: 'America/Denver', label: 'America/Denver (GMT-7/-6)' },
  { value: 'America/Los_Angeles', label: 'America/Los Angeles (GMT-8/-7)' },
  { value: 'America/Toronto', label: 'America/Toronto (GMT-5/-4)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (GMT+8)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GMT+4)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (GMT+10/+11)' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (GMT+12/+13)' },
  { value: 'UTC', label: 'UTC (GMT+0)' },
];

export function PreferencesSettingsSection({
  initialPreferences,
}: PreferencesSettingsSectionProps) {
  const t = useTranslations();
  const [preferences, setPreferences] =
    React.useState<UserPreferences>(initialPreferences);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handlePreferenceUpdate = async (
    field: 'dateFormat' | 'timezone',
    value: string
  ) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update preferences');
      }

      const updatedPreferences = await response.json();
      setPreferences(updatedPreferences);

      // Update the global date format preference if dateFormat was changed
      if (field === 'dateFormat') {
        setUserDateFormatPreference(value);
        // Trigger event to notify other components
        window.dispatchEvent(new Event('userPreferencesLoaded'));
      }

      toast.success(t('settings.preferences.preferencesUpdated'));
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('settings.preferences.preferencesError')
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.preferences.title')}</CardTitle>
        <CardDescription>
          {t('settings.preferences.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Format Selection */}
        <div className="space-y-2">
          <Label htmlFor="dateFormat">
            {t('settings.preferences.dateFormat')}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t('settings.preferences.dateFormatDescription')}
          </p>
          <Select
            value={preferences.dateFormat}
            onValueChange={(value) => handlePreferenceUpdate('dateFormat', value)}
            disabled={isUpdating}
          >
            <SelectTrigger id="dateFormat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {t(`settings.dateFormats.${format.key}` as any)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timezone Selection */}
        <div className="space-y-2">
          <Label htmlFor="timezone">{t('settings.preferences.timezone')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('settings.preferences.timezoneDescription')}
          </p>
          <Select
            value={preferences.timezone}
            onValueChange={(value) => handlePreferenceUpdate('timezone', value)}
            disabled={isUpdating}
          >
            <SelectTrigger id="timezone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
