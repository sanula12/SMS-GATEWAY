// import Cookies from 'js-cookie';

// const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
// const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// interface ProxyOptions extends RequestInit {
//   params?: Record<string, string>;
// }

// export async function proxy(endpoint: string, options: ProxyOptions = {}) {
//   const { params, ...fetchOptions } = options;

//   let url = `${BASE_URL}/api/${API_VERSION}${endpoint}`;

//   if (params) {
//     const searchParams = new URLSearchParams(params);
//     url += `?${searchParams.toString()}`;
//   }

//   const token = Cookies.get('access_token');

//   const headers = new Headers(fetchOptions.headers);
//   headers.set('Content-Type', 'application/json');
//   if (token) {
//     headers.set('Authorization', `Bearer ${token}`);
//   }

//   const response = await fetch(url, {
//     ...fetchOptions,
//     headers,
//   });

//   const data = await response.json().catch(() => null);

//   if (!response.ok) {
//     throw new Error(data?.message || 'Something went wrong');
//   }

//   return data;
// }

/**
 * Proxy helper — calls Next.js route handlers which forward to the backend.
 * Never calls the backend URL directly from the browser.
 */
export async function proxy(
  path: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.message ??
      data?.error ??
      `Request failed with status ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }

  return data;
}