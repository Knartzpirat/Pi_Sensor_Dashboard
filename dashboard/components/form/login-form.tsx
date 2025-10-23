'use client';

import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldLabel,
  FieldError,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputPasswordComponent } from '@/components/inputGroup-password';

export default function LoginForm() {
  const t = useTranslations();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = z.object({
    username: z
      .string()
      .min(3, t('validation.username.min'))
      .max(20, t('validation.username.max')),
    password: z
      .string()
      .min(8, t('validation.password.min'))
      .max(100, t('validation.password.max')),
  });

  const form = useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
      onBlur: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: value.username,
            password: value.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(t('login.error'), {
            description: data.error || t('login.invalidCredentials'),
          });
          return;
        }

        // Erfolgreicher Login
        toast.success(t('login.success'), {
          description: t('login.redirecting'),
        });

        // Redirect zum Dashboard
        setTimeout(() => {
          router.push('/');
        }, 1000);
      } catch (error) {
        console.error('Login error:', error);
        toast.error(t('login.error'), {
          description: t('login.unexpectedError'),
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardContent className="">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            autoComplete="on"
            method="post"
          >
            <FieldSet>
              <FieldLegend className="text-2xl font-semibold">
                {t('login.title')}
              </FieldLegend>
              <FieldDescription className="text-sm text-muted-foreground mt-2">
                {t('login.description')}
              </FieldDescription>

              <FieldGroup>
                {/* Username */}
                <form.Field name="username">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="username">
                          {t('inputs.username')}
                        </FieldLabel>
                        <Input
                          id="username"
                          name="username"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder={t('inputs.username')}
                          autoComplete="username"
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

                {/* Password */}
                <form.Field name="password">
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor="password">
                          {t('inputs.password')}
                          <a
                            href="/forget-password"
                            className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                          >
                            {t('login.forgotPassword')}
                          </a>
                        </FieldLabel>
                        <InputPasswordComponent
                          id="password"
                          name="password"
                          autoComplete="current-password"
                          placeholder={t('inputs.password')}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
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

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('buttons.loading')}
                  </>
                ) : (
                  t('buttons.login')
                )}
              </Button>
            </FieldSet>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
