import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AccountSettingsSection } from './_components/account-settings-section';
import { PreferencesSettingsSection } from './_components/preferences-settings-section';
import { HardwareSettingsSection } from './_components/hardware-settings-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
async function getUserProfile() {
  noStore();

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    redirect('/login');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/user/profile`, {
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      redirect('/login');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    redirect('/login');
  }
}

async function getUserPreferences() {
  noStore();

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refreshToken')?.value;

  if (!refreshToken) {
    redirect('/login');
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/user/preferences`, {
      headers: {
        Cookie: `refreshToken=${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      // Return default preferences if none exist
      return {
        id: '',
        dateFormat: 'DD.MM.YYYY',
        timezone: 'Europe/Berlin',
        updatedAt: new Date().toISOString(),
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    // Return default preferences on error
    return {
      id: '',
      dateFormat: 'DD.MM.YYYY',
      timezone: 'Europe/Berlin',
      updatedAt: new Date().toISOString(),
    };
  }
}

async function getHardwareConfig() {
  noStore();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/settings/hardware`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching hardware config:', error);
    return null;
  }
}

export default async function SettingsPage() {
  const t = await getTranslations();

  const [profile, preferences, hardwareConfig] = await Promise.all([
    getUserProfile(),
    getUserPreferences(),
    getHardwareConfig(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="grid gap-4">
          <TabsList>
            <TabsTrigger value="general">
              {t('settings.tabs.general')}
            </TabsTrigger>
            <TabsTrigger value="hardware">
              {t('settings.tabs.hardware')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <div className="grid gap-4">
              <AccountSettingsSection initialProfile={profile} />
              <PreferencesSettingsSection initialPreferences={preferences} />
            </div>
          </TabsContent>
          <TabsContent value="hardware">
            <HardwareSettingsSection initialConfig={hardwareConfig} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
