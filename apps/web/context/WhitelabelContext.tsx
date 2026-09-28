'use client';

import { createContext, useContext } from 'react';

export interface WhitelabelBranding {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  supportEmail: string | null;
  isWhitelabel: boolean; // false = main platform
  resellerId?: string | null;
}

export const defaultBranding: WhitelabelBranding = {
  companyName: 'V SMS',
  logoUrl: '/logo.png',
  primaryColor: '#f26f2e',
  supportEmail: null,
  isWhitelabel: false,
  resellerId: null,
};

export const WhitelabelContext = createContext<WhitelabelBranding>(defaultBranding);

export function useBranding() {
  return useContext(WhitelabelContext);
}
