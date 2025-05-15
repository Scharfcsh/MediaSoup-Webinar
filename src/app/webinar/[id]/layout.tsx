// src/app/webinar/[id]/layout.tsx
import AppLayout from '@/components/layout/AppLayout';
import type { ReactNode } from 'react';

export default function WebinarLayout({ children }: { children: ReactNode }) {
  // AppLayout already handles auth checks and provides Navbar
  // This specific layout can be simpler, or AppLayout can be used directly in the page.
  // For consistency with dashboard, let's use it.
  return <AppLayout>{children}</AppLayout>;
}
