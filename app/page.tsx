/**
 * Root page — redirect to dashboard (or login if not authenticated).
 * Разработчик: АО «REFLY»
 */
import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/dashboard');
}
