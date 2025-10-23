// dashboard/components/form/resetpassword-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { InputPasswordComponent } from '@/components/inputGroup-password';

interface ResetPasswordFormProps {
  recoveryCode: string;
  userId: string;
}

export default function ResetPasswordForm({
  recoveryCode,
  userId,
}: ResetPasswordFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Zod Schema für Passwort Reset
  const resetPasswordSchema = z
    .object({
      newPassword: z
        .string()
        .min(8, t('validation.password.min'))
        .max(100, t('validation.password.max')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('validation.password.mismatch'),
      path: ['confirmPassword'],
    });

  const form = useForm({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      onSubmit: resetPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recoveryCode,
            userId,
            newPassword: value.newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(t('resetPassword.error'), {
            description: data.error || t('resetPassword.failed'),
          });
          return;
        }

        // Passwort erfolgreich zurückgesetzt
        toast.success(t('resetPassword.success'), {
          description: t('resetPassword.redirecting'),
        });

        // SessionStorage löschen
        sessionStorage.removeItem('recoveryCode');

        // Redirect zum Login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (error) {
        console.error('Password reset error:', error);
        toast.error(t('resetPassword.error'), {
          description: t('resetPassword.unexpectedError'),
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldSet className="flex flex-col">
              <FieldLegend className="text-2xl font-semibold">
                {t('resetPassword.title')}
              </FieldLegend>
              <FieldDescription className="text-sm text-muted-foreground">
                {t('resetPassword.description')}
              </FieldDescription>
            <FieldGroup >
              {/* Neues Passwort */}
              <form.Field name="newPassword">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="newPassword">
                        {t('inputs.newpassword')}
                      </FieldLabel>
                      <InputPasswordComponent
                        id="newPassword"
                        name="newPassword"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('inputs.newpassword')}
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              {/* Passwort bestätigen */}
              <form.Field name="confirmPassword">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor="confirmPassword">
                        {t('inputs.confirmpassword')}
                      </FieldLabel>
                      <InputPasswordComponent
                        id="confirmPassword"
                        name="confirmPassword"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder={t('inputs.confirmpassword')}
                        autoComplete="new-password"
                        disabled={isLoading}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            </FieldGroup>

            <div className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('buttons.loading')}
                  </span>
                ) : (
                  t('buttons.resetpassword')
                )}
              </Button>

              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={() => router.push('/login')}
                disabled={isLoading}
              >
                {t('buttons.backtologin')}
              </Button>
            </div>
          </FieldSet>
        </form>
      </CardContent>
    </Card>
  );
}
