// components/locale-switcher.tsx
import { useLocale, useTranslations } from 'next-intl';
import LocaleSwitcherSelect from '@/components/switch-locale-select';

export default function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <LocaleSwitcherSelect
      defaultValue={locale}
      items={[
        {
          value: 'en',
          label: t('language.english'),
          flag: '🇬🇧',
        },
        {
          value: 'de',
          label: t('language.german'),
          flag: '🇩🇪',
        },
      ]}
    />
  );
}
