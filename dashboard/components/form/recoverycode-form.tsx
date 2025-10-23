// dashboard/components/form/recoverycode-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from '@tanstack/react-form';
import { useTranslations } from 'next-intl';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Field, FieldError, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface RecoveryCodeFormProps {
  onVerify: (code: string, userId: string) => void;
}

export default function RecoveryCodeForm({ onVerify }: RecoveryCodeFormProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Zod Schema für Recovery Code
  const recoveryCodeSchema = z.object({
    recoveryCode: z
      .string()
      .regex(
        /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/,
        t('validation.recoveryCode.format')
      )
      .min(11, t('validation.recoveryCode.required')),
  });

  const form = useForm({
    defaultValues: {
      recoveryCode: '',
    },
    validators: {
      onSubmit: recoveryCodeSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/verify-recovery-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recoveryCode: value.recoveryCode,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(t('forgotPassword.error'), {
            description: data.error || t('forgotPassword.invalidCode'),
          });
          return;
        }

        // Code erfolgreich verifiziert
        toast.success(t('forgotPassword.codeVerified'));
        onVerify(value.recoveryCode, data.userId);
      } catch (error) {
        console.error('Recovery code verification error:', error);
        toast.error(t('forgotPassword.error'), {
          description: t('forgotPassword.unexpectedError'),
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Format Code während Eingabe: XXXX-XXXX-XXXX
  const handleCodeChange = (value: string) => {
    // Entferne alle nicht-alphanumerischen Zeichen außer Bindestriche
    let cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Entferne alle Bindestriche für Neuformatierung
    cleaned = cleaned.replace(/-/g, '');

    // Füge Bindestriche nach jedem 3. Zeichen ein
    const parts = cleaned.match(/.{1,3}/g) || [];
    return parts.join('-').substring(0, 11); // Max 11 Zeichen (XXX-XXX-XXX)
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t('forgotPassword.title')}</CardTitle>
        <CardDescription>
          {t('forgotPassword.description_recoverycode')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldSet>
            <form.Field name="recoveryCode">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="recoveryCode">
                      {t('inputs.recoverycode')}
                    </FieldLabel>
                    <Input
                      id="recoveryCode"
                      type="text"
                      placeholder="XXX-XXX-XXX"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        const formatted = handleCodeChange(e.target.value);
                        field.handleChange(formatted);
                      }}
                      maxLength={11}
                      required
                      disabled={isLoading}
                      className="font-mono text-center text-lg tracking-wider"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldSet>

          <CardFooter className="flex flex-col gap-2 mt-4 px-0">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('buttons.verify')}
                </span>
              ) : (
                t('buttons.verify')
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
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
