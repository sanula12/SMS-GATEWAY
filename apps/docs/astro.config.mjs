import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'V SMS',
      description: 'Developer documentation for the V SMS API',
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'introduction' },
            { label: 'Authentication', slug: 'authentication' },
            { label: 'Quick Start', slug: 'quickstart' },
          ],
        },
        {
          label: 'SMS',
          items: [
            { label: 'Send a Message', slug: 'sms/send' },
            { label: 'Bulk SMS', slug: 'sms/bulk' },
            { label: 'Scheduled SMS', slug: 'sms/scheduled' },
            { label: 'Excel Import', slug: 'sms/excel-import' },
          ],
        },
        {
          label: 'Contacts',
          items: [
            { label: 'Managing Contacts', slug: 'contacts/overview' },
            { label: 'Groups', slug: 'contacts/groups' },
          ],
        },
        {
          label: 'Campaigns',
          items: [
            { label: 'Creating Campaigns', slug: 'campaigns/overview' },
          ],
        },
        {
          label: 'Webhooks',
          items: [
            { label: 'Delivery Receipts', slug: 'webhooks/dlr' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API Reference', slug: 'reference/api' },
            { label: 'Error Codes', slug: 'reference/errors' },
            { label: 'Rate Limits', slug: 'reference/rate-limits' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
      head: [
        {
          tag: 'script',
          content: `
            // White-label dynamic replacement script
            function applyWhiteLabel() {
              const params = new URLSearchParams(window.location.search);
              // Fallback to sessionStorage if params were passed on a previous page
              const endpoint = params.get('endpoint') || sessionStorage.getItem('wl_endpoint');
              const brand = params.get('brand') || sessionStorage.getItem('wl_brand');

              if (endpoint) sessionStorage.setItem('wl_endpoint', endpoint);
              if (brand) sessionStorage.setItem('wl_brand', brand);

              if (!endpoint && !brand) return;

              const hostname = endpoint ? endpoint.replace(/^https?:\\/\\//, '') : '';
              
              if (brand && document.title.includes('V SMS')) {
                document.title = document.title.replace(/V SMS/gi, brand);
              }

              // Safe text replacement using TreeWalker to avoid breaking event listeners
              const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
              let node;
              while ((node = walker.nextNode())) {
                if (node.nodeValue) {
                  if (endpoint) {
                    node.nodeValue = node.nodeValue.replaceAll('https://send.virgincareer.lk', endpoint);
                    node.nodeValue = node.nodeValue.replaceAll('send.virgincareer.lk', hostname);
                  }
                  if (brand) {
                    node.nodeValue = node.nodeValue.replace(/V SMS/gi, brand);
                  }
                }
              }

              // Update copy buttons for code snippets
              if (endpoint) {
                document.querySelectorAll('button[data-code]').forEach(btn => {
                  let code = btn.getAttribute('data-code');
                  if (code) {
                    code = code.replaceAll('https://send.virgincareer.lk', endpoint);
                    code = code.replaceAll('send.virgincareer.lk', hostname);
                    btn.setAttribute('data-code', code);
                  }
                });
              }

              // Dynamic Favicon Generation
              if (brand && brand.toLowerCase() !== 'v sms') {
                document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']").forEach(el => el.remove());
                const link = document.createElement('link');
                link.type = 'image/svg+xml';
                link.rel = 'icon';
                const initial = brand.charAt(0).toUpperCase();
                const svg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="#f26f2e"/><text x="50" y="70" font-size="55" font-family="system-ui, Arial, sans-serif" font-weight="bold" fill="white" text-anchor="middle">\${initial}</text></svg>\`;
                link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
                document.head.appendChild(link);
              }
            }

            // Run on initial load and after Starlight page transitions
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', applyWhiteLabel);
            } else {
              applyWhiteLabel();
            }
            document.addEventListener('astro:page-load', applyWhiteLabel);
          `,
        },
      ],
    }),
  ],
});
