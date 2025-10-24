'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function LogoutButton() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // API call zum Logout, optional wenn du serverseitig die Session löschen willst
      const response = await fetch('/api/auth/logout', { method: 'POST' });

      // Clientseitig Cookie löschen (falls nicht serverseitig gelöscht)
      document.cookie =
        'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      if (response.ok) {
        toast.success('Logout completed!', {
          description: 'You have been logged out successfully.',
        });
        router.push('/login');
        router.refresh();
      } else {
        toast.error('Logout failed!', {
           description: 'Please try again later.',
         });
      }
    } catch (error) {
      console.error('Logout Error:', error);
      toast.error(t('login.error'), {
        description: t('login.unexpectedError'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleLogout}
      disabled={isLoading}
      aria-label={t('buttons.logout')}
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}
