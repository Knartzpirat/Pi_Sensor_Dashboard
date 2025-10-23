import { ReactNode } from 'react';
import { SwitchTheme } from '@/components/switch-theme';
import LocaleSwitcher from '@/components/switch-locale';

type Props = {
  children: ReactNode;
};

export default function SetupLayout({ children }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4 gap-2 ">
        <LocaleSwitcher />
        <SwitchTheme />
      </div>

      <main className="flex-1 p-6 bg-background">{children}</main>
    </div>
  );
}
