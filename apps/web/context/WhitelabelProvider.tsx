'use client';

import React, { ReactNode, useEffect } from 'react';
import { WhitelabelContext, WhitelabelBranding } from './WhitelabelContext';

export function WhitelabelProvider({
  branding,
  children,
}: {
  branding: WhitelabelBranding;
  children: ReactNode;
}) {
  useEffect(() => {
    if (branding.isWhitelabel) {
      let iconUrl = '';
      if (branding.logoUrl) {
        iconUrl = branding.logoUrl;
      } else if (branding.companyName) {
        const letter = (branding.companyName.trim()[0] || 'S').toUpperCase();
        const color = branding.primaryColor || '#7c3aed';
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='${encodeURIComponent(color)}'/><text x='50%' y='55%' font-family='system-ui, sans-serif' font-weight='800' font-size='18' fill='%23ffffff' text-anchor='middle' dominant-baseline='middle'>${letter}</text></svg>`;
        iconUrl = `data:image/svg+xml,${svg}`;
      }

      if (iconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.head.appendChild(link);
        }
        link.href = iconUrl;
      }
    }
  }, [branding]);

  return (
    <WhitelabelContext.Provider value={branding}>
      {children}
    </WhitelabelContext.Provider>
  );
}
