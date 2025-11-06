import { unstable_noStore as noStore } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

import { AccountSettingsSection } from './_components/account-settings-section';
import { PreferencesSettingsSection } from './_components/preferences-settings-section';

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

export default async function SettingsPage() {
  const t = await getTranslations();

  const [profile, preferences] = await Promise.all([
    getUserProfile(),
    getUserPreferences(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground">{t('settings.description')}</p>
      </div>

      <div className="grid gap-6">
        <AccountSettingsSection initialProfile={profile} />
        <PreferencesSettingsSection initialPreferences={preferences} />
      </div>
    </div>
  );
}
