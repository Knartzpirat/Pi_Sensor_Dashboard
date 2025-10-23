'use client';

import { InputHTMLAttributes, useState } from 'react';
import { InputGroup, InputGroupAddon, InputGroupInput } from './ui/input-group';
import { Button } from './ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

type CustomInputProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  placeholder?: string;
};

export const InputPasswordComponent: React.FC<
  Omit<CustomInputProps, 'type' | 'showPasswordToggle'>
> = ({ id, placeholder, className, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations();

  return (
    <InputGroup className={className}>
      <InputGroupInput
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        required
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={
            showPassword ? t('buttons.hidePassword') : t('buttons.showPassword')
          }
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
};
