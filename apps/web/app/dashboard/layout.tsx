'use client';

import React from 'react';
import DashboardShell from '@/layouts/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}