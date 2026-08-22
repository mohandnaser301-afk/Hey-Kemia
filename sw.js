// Service Worker لتشغيل إشعارات الهواتف وأجهزة سطح المكتب في الخلفية
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NATIVE_NOTIFICATION') {
    const title = event.data.title || 'منصة هي كيميا !';
    const options = {
      body: event.data.body || '',
      icon: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=192&q=80',
      badge: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=96&q=80',
      vibrate: [200, 100, 200],
      data: { url: event.data.url || 'dashboard.html' }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : 'dashboard.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});