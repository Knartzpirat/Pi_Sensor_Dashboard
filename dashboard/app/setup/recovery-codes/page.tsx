'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function RecoveryCodesPage() {
  const router = useRouter();
  const t = useTranslations();
  const [codes, setCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  const validateRefreshToken = useCallback(async () => {
    setIsValidating(true);
    try {
      const response = await fetch('/api/setup/recovery-codes');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Token validation failed:', errorData);

        if (response.status === 401) {
          toast.error(t('setup.recoverycode.sessionexpired'));
          sessionStorage.removeItem('recoveryCodes');
          // Verzögerung vor Weiterleitung, damit Benutzer die Meldung sehen kann
          setTimeout(() => {
          router.push('/login');
          }, 2000);
        }
      } else {
        const data = await response.json();
        console.log('Token validated successfully:', {
          username: data.username,
          totalCodes: data.totalCodes,
          available: data.codesAvailable,
        });
      }
    } catch (error) {
      console.error('Error validating token:', error);
      // Fehler nicht als kritisch behandeln, da die Codes bereits angezeigt werden
    } finally {
      setIsValidating(false);
    }
  }, [router, t]);

  useEffect(() => {
    const storedCodes = sessionStorage.getItem('recoveryCodes');

    if (storedCodes) {
      try {
        const parsedCodes = JSON.parse(storedCodes);
        if (Array.isArray(parsedCodes) && parsedCodes.length > 0) {
        setCodes(parsedCodes);
        setIsLoading(false);
          // Token-Validierung optional durchführen
        validateRefreshToken();
        } else {
          console.error('Invalid recovery codes format:', parsedCodes);
          toast.error(t('setup.recoverycode.invalidformat'));
          setTimeout(() => {
            router.push('/setup');
          }, 2000);
        }
      } catch (error) {
        console.error('Error parsing recovery codes:', error);
        toast.error(t('setup.recoverycode.invalidformat'));
        setTimeout(() => {
        router.push('/setup');
        }, 2000);
      }
    } else {
      console.warn('No recovery codes found in sessionStorage');
      toast.error(t('setup.recoverycode.nocodefound'));
      setTimeout(() => {
      router.push('/setup');
      }, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Nur einmal beim Mount ausführen

  const handleCopyAll = () => {
    const allCodes = codes.join('\n');
    navigator.clipboard.writeText(allCodes);
    toast.success(t('setup.recoverycode.allcopied'));
  };

  const handleDownload = () => {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery-codes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('setup.recoverycode.downloaded'));
  };

  const handleContinue = () => {
    sessionStorage.removeItem('recoveryCodes');
    // Nach dem Setup zum Login weiterleiten
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">
            🔐 {t('setup.recoverycode.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {t('setup.recoverycode.description')}
          </p>

          {isValidating && (
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('setup.recoverycode.validating')}</span>
            </div>
          )}

          {codes.length > 0 ? (
            <>
              <ul className="grid grid-cols-2 gap-2 text-center font-mono text-sm">
                {codes.map((code, i) => (
                  <li
                    key={i}
                    className="border rounded-lg p-2 bg-muted text-foreground select-all cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(code);
                      toast.success(
                        t('setup.recoverycode.codecopied', { number: i + 1 })
                      );
                    }}
                  >
                    {code}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={handleCopyAll}
                >
                  📋 {t('buttons.copyall')}
                </Button>
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={handleDownload}
                >
                  📄 {t('buttons.download')}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center p-6 bg-red-50 dark:bg-red-950 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                {t('setup.recoverycode.nocodefound')}
              </p>
            </div>
          )}

          <Button
            className="w-full mt-6"
            onClick={handleContinue}
            disabled={codes.length === 0}
          >
            {t('buttons.continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
