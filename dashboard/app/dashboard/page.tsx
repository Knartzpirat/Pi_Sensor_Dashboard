import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations();
  return <h1>{t('homepage.title')}</h1>;
}
