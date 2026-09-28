import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_ROUTES = ['/dashboard', '/admin', '/reseller'];
const AUTH_ROUTES = ['/login', '/register'];
const PUBLIC_PATHS = ['/_next', '/favicon', '/api/', '/static'];

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // 1. Skip asset / API routes
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // 2. Auth Logic
  const isProtected = PROTECTED_ROUTES.some(r => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some(r => pathname === r);

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Whitelabel Logic
  // Strip port for local dev (localhost:3000 → localhost)
  const domain = host.split(':')[0];

  let response = NextResponse.next();

  // Don't look up branding for the main platform domains
  const mainDomains = ['localhost', 'V SMS.lk', 'www.V SMS.lk', 'send.virgincareer.lk'];
  if (mainDomains.includes(domain)) {
    response.headers.set('x-branding', JSON.stringify({ isWhitelabel: false }));
    return response;
  }

  // For any other domain: look up whitelabel settings from the API
  try {
    const apiUrl = process.env.API_INTERNAL_URL ?? process.env.API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/whitelabel/by-domain?domain=${domain}`, {
      next: { revalidate: 60 }, // Cache for 60s
    });

    if (res.ok) {
      const branding = await res.json();
      
      // Prevent the main platform landing page from showing on reseller domains
      if (pathname === '/') {
        const url = request.nextUrl.clone();
        // Fallback: If they set a homepage_url in the future, redirect there. Otherwise, /login.
        url.pathname = '/login'; 
        return NextResponse.redirect(url);
      }

      response.headers.set('x-branding', JSON.stringify({
        isWhitelabel: true,
        companyName: branding.companyName || 'V SMS',
        logoUrl: branding.logoUrl || '/logo.png',
        primaryColor: branding.primaryColor || '#f26f2e',
        supportEmail: branding.supportEmail ?? null,
        resellerId: branding.accountId ?? null,
      }));
      return response;
    }
  } catch {
    // If lookup fails, continue silently
  }

  return response;
}

export const config = {
  // Run on all routes except _next internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};