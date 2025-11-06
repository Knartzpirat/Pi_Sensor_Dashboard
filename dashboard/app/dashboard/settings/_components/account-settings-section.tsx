'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableLabel,
} from '@/components/ui/editable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { InputPasswordComponent } from '@/components/inputGroup-password';

// Extend Window interface for Credential Management API
interface PasswordCredentialData {
  id: string;
  password: string;
  name?: string;
}

declare global {
  interface Window {
    PasswordCredential?: new (data: PasswordCredentialData) => Credential;
  }
}

interface UserProfile {
  id: string;
  username: string;
  role: string;
}

interface AccountSettingsSectionProps {
  initialProfile: UserProfile;
}

export function AccountSettingsSection({
  initialProfile,
}: AccountSettingsSectionProps) {
  const t = useTranslations();
  const [profile, setProfile] = React.useState<UserProfile>(initialProfile);
  const [isUpdatingUsername, setIsUpdatingUsername] = React.useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);

  const handleUsernameUpdate = async (newUsername: string) => {
    if (newUsername === profile.username) return;

    // Client-side validation according to setup rules
    if (newUsername.trim().length < 3) {
      toast.error(t('validation.username.min'));
      throw new Error('Username too short');
    }

    if (newUsername.trim().length > 20) {
      toast.error(t('validation.username.max'));
      throw new Error('Username too long');
    }

    setIsUpdatingUsername(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update username');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast.success(t('settings.account.usernameUpdated'));
    } catch (error) {
      console.error('Error updating username:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('settings.account.usernameError')
      );
      throw error; // Re-throw to prevent Editable from updating
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords according to setup rules
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.account.passwordMismatch'));
      return;
    }

    if (newPassword.length < 8) {
      toast.error(t('validation.password.min'));
      return;
    }

    if (newPassword.length > 100) {
      toast.error(t('validation.password.max'));
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 && data.error?.includes('incorrect')) {
          throw new Error(t('settings.account.currentPasswordIncorrect'));
        }
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success(t('settings.account.passwordUpdated'));

      // Inform password manager about the password change
      if (window.PasswordCredential && navigator.credentials) {
        try {
          const credential = new window.PasswordCredential({
            id: profile.username,
            password: newPassword,
            name: profile.username,
          });
          await navigator.credentials.store(credential);
        } catch (credError) {
          // Silently fail if credential management is not supported
          console.log('Credential management not available:', credError);
        }
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : t('settings.account.passwordError')
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.account.title')}</CardTitle>
        <CardDescription>{t('settings.account.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Username Section */}
        <div className="space-y-2">
          <Editable
            value={profile.username}
            onSubmit={handleUsernameUpdate}
            required
            disabled={isUpdatingUsername}
          >
            <EditableLabel>{t('settings.account.username')}</EditableLabel>
            <p className="text-sm text-muted-foreground">
              {t('settings.account.usernameDescription')}
            </p>
            <EditableArea>
              <EditablePreview />
              <EditableInput minLength={3} maxLength={20} />
            </EditableArea>
          </Editable>
        </div>

        <Separator />

        {/* Password Change Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">
              {t('settings.account.password')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('settings.account.passwordDescription')}
            </p>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {t('settings.account.currentPassword')}
              </Label>
              <InputPasswordComponent
                id="currentPassword"
                name="current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                {t('settings.account.newPassword')}
              </Label>
              <InputPasswordComponent
                id="newPassword"
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                maxLength={100}
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('settings.account.confirmNewPassword')}
              </Label>
              <InputPasswordComponent
                id="confirmPassword"
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                maxLength={100}
                disabled={isChangingPassword}
              />
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('settings.account.changePassword')}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
