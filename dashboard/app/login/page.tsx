import { SwitchTheme } from '@/components/switch-theme';
import LocaleSwitcher from '@/components/switch-locale';
import LoginForm from '@/components/form/login-form';


export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4 gap-2 ">
        <LocaleSwitcher />
        <SwitchTheme />
      </div>
      <div className="flex flex-col items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  );
}
