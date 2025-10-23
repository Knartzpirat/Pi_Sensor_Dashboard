// dashboard/app/forget-password/page.tsx
'use client';

import { useState } from 'react';
import RecoveryCodeForm from '@/components/form/recoverycode-form';
import ResetPasswordForm from '@/components/form/resetpassword-form';
import { SwitchTheme } from '@/components/switch-theme';
import LocaleSwitcher from '@/components/switch-locale';

export default function ForgetPasswordPage() {
  const [codeVerified, setCodeVerified] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [userId, setUserId] = useState('');

  const handleCodeVerified = (code: string, verifiedUserId: string) => {
    // ✅ Code und UserId im SessionStorage speichern
    sessionStorage.setItem('recoveryCode', code);
    sessionStorage.setItem('userId', verifiedUserId);

    setRecoveryCode(code);
    setUserId(verifiedUserId);
    setCodeVerified(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4 gap-2">
        <LocaleSwitcher />
        <SwitchTheme />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 p-4">
        {!codeVerified ? (
          <RecoveryCodeForm onVerify={handleCodeVerified} />
        ) : (
          <ResetPasswordForm recoveryCode={recoveryCode} userId={userId} />
        )}
      </div>
    </div>
  );
}
