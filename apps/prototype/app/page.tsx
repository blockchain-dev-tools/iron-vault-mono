'use client';
import { AppProvider } from '@/lib/app-context';
import DevFrame from '@/components/DevFrame';

export default function Home() {
  return (
    <AppProvider>
      <DevFrame />
    </AppProvider>
  );
}
