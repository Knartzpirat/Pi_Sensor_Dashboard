// dashboard/app/page.tsx
import { redirect } from 'next/navigation';

export default async function HomePage() {
  // Middleware hat bereits Auth geprüft
  // Hier nur noch zum Dashboard weiterleiten
  redirect('/dashboard');
}
