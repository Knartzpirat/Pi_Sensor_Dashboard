'use client';

import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InputPasswordComponent } from '@/components/inputGroup-password';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';

export function SetupForm() {
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [setupMessage, setSetupMessage] = useState('');

  // Schema mit Übersetzungen
  const setupSchema = z.object({
    userName: z
      .string()
      .min(3, t('validation.username.min'))
      .max(20, t('validation.username.max')),
    password: z
      .string()
      .min(8, t('validation.password.min'))
      .max(100, t('validation.password.max')),
    dbHost: z.string().min(1, t('validation.dbHost.required')),
    dbPort: z
      .number()
      .min(1, t('validation.dbPort.min'))
      .max(65535, t('validation.dbPort.max')),
    dbUser: z.string().min(1, t('validation.dbUser.required')),
    dbPassword: z.string().min(1, t('validation.dbPassword.required')),
    dbName: z.string().min(1, t('validation.dbName.required')),
  });

  const form = useForm({
    defaultValues: {
      userName: '',
      password: '',
      dbHost: 'localhost',
      dbPort: 5432,
      dbUser: '',
      dbPassword: '',
      dbName: '',
    },
    validators: {
      onSubmit: setupSchema,
      onBlur: setupSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      let toastId: string | number;
      try {
        document.cookie = 'refreshToken=; path=/; max-age=0';
        toastId = toast.loading('Starting setup...', {
          description: (
            <div className="space-y-2">
              <p className="text-sm">{setupMessage}</p>
              <Progress value={setupProgress} className="w-full" />
            </div>
          ),
          duration: Infinity,
        });

        const response = await fetch('/api/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_data: {
              username: value.userName,
              password: value.password,
            },
            db_config: {
              host: value.dbHost,
              port: value.dbPort,
              username: value.dbUser,
              password: value.dbPassword,
              database: value.dbName,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(t('setup.Error'));
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;

          const text = decoder.decode(chunk);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                toast.dismiss(toastId);
                toast.error('Setup failed', {
                  description: data.error,
                });
                setIsLoading(false);
                return;
              }

              if (data.progress !== undefined) {
                setSetupProgress(data.progress);
                setSetupMessage(data.message);

                // Update Toast
                toast.loading('Setting up...', {
                  id: toastId,
                  description: (
                    <div className="space-y-2">
                      <p className="text-sm">{data.message}</p>
                      <Progress value={data.progress} className="w-full" />
                    </div>
                  ),
                });
              }

              if (data.step === 'complete') {
                if (data.refreshToken && data.refreshTokenExpiresAt) {
                  // Berechne maxAge in Sekunden
                  const maxAge = Math.floor(
                    (new Date(data.refreshTokenExpiresAt).getTime() -
                      Date.now()) /
                      1000
                  );

                  document.cookie = `refreshToken=${
                    data.refreshToken
                  }; path=/; max-age=${maxAge}; SameSite=Strict${
                    process.env.NODE_ENV === 'production' ? '; Secure' : ''
                  }`;
                }

                // Recovery Codes speichern
                if (data.recoveryCodes) {
                  sessionStorage.setItem(
                    'recoveryCodes',
                    JSON.stringify(data.recoveryCodes)
                  );
                }

                toast.dismiss(toastId);
                toast.success('Setup completed!', {
                  description: 'Redirecting to recovery-codes...',
                });

                // Redirect nach kurzer Verzögerung
                setTimeout(() => {
                  window.location.href = '/setup/recovery-codes';
                }, 2000);
              }
            }
          }
        }
      } catch (error: unknown) {
        toast.dismiss(toastId!);
        toast.error('Setup failed', {
          description:
            error instanceof Error ? error.message : 'An error occurred',
        });
        console.error('Setup error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <form
        id="setup-form"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="w-full max-w-md space-y-6"
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>{t('setup.logindata.title')}</FieldLegend>
            <FieldDescription>
              {t('setup.logindata.description')}
            </FieldDescription>
            <FieldGroup className="gap-4">
              {/* UserName */}
              <form.Field name="userName">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.username')}</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder={t('inputs.username')}
                        autoComplete="username"
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              {/* Password */}
              <form.Field name="password">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.password')}</FieldLabel>
                      <InputPasswordComponent
                        id={field.name}
                        name={field.name}
                        autoComplete="new-password"
                        placeholder={t('inputs.password')}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
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
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>{t('setup.connectionSettings.title')}</FieldLegend>
            <FieldDescription>
              {t('setup.connectionSettings.description')}
            </FieldDescription>
            <FieldGroup className="gap-4">
              {/* DB Host */}
              <form.Field name="dbHost">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.dbhost')}</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder={t('inputs.dbhost')}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              {/* DB Port */}
              <form.Field name="dbPort">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.dbport')}</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(parseInt(e.target.value) || 0)
                        }
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              {/* DB User */}
              <form.Field name="dbUser">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.dbuser')}</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder={t('inputs.dbuser')}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              {/* DB Password */}
              <form.Field name="dbPassword">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.dbpassword')}</FieldLabel>
                      <InputPasswordComponent
                        id="dbPassword"
                        name={field.name}
                        placeholder={t('inputs.dbpassword')}
                        autoComplete="off"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              {/* DB Name */}
              <form.Field name="dbName">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>{t('inputs.dbname')}</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        placeholder={t('inputs.dbname')}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
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
          </FieldSet>
        </FieldGroup>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('buttons.loading')}
            </>
          ) : (
            t('buttons.setup')
          )}
        </Button>
      </form>
    </div>
  );
}
