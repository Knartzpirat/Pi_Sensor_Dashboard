'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function SwitchTheme() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t('buttons.switchTheme')}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}
