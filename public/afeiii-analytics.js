/* Public page views only. Never instrument account, resume or conversion workspaces. */
(() => {
  if (!location.hostname.endsWith('.afeiii.com')) return;
  const host = location.hostname.split('.')[0];
  const path = location.pathname.replace(/\/$/, '') || '/';
  const permitted = host === 'resume'
    ? /^\/(?:[a-z]{2}(?:-[a-zA-Z]{2,4})?)?$/.test(path) || ['/privacy', '/ats-checker'].includes(path)
    : host === 'convert'
      ? ['/', '/about', '/formats', '/privacy', '/terms', '/contact'].includes(path)
      : host === 'check' && ['/', '/about', '/faq', '/privacy-policy', '/terms'].includes(path);
  if (!permitted || document.querySelector('script[data-cf-beacon]')) return;
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.setAttribute('data-cf-beacon', JSON.stringify({token: '1de4c686fa1e40889ff348db015c2e5f', spa: false}));
  document.head.append(script);
})();
