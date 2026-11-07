// Service Worker for Clube VTXMais - Local & Push Notifications
const CACHE_NAME = 'vtxmais-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle local notification requests dispatched from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const notificationOptions = {
      icon: '/logo_vtx_mais.png',
      badge: '/logo_vtx_mais.png',
      vibrate: [150, 80, 150],
      data: options?.data || {},
      ...options,
    };

    event.waitUntil(
      self.registration.showNotification(title, notificationOptions)
    );
  }
});

// Handle Push notifications from external push server
self.addEventListener('push', (event) => {
  let data = {
    title: '🎉 Nova Oferta Próxima de Você!',
    body: 'Uma nova oferta exclusiva acaba de ser disponibilizada para a sua região no Clube VTXMais.',
    url: '/',
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (err) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/logo_vtx_mais.png',
    badge: '/logo_vtx_mais.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      offerId: data.offerId || '',
    },
    actions: [
      { action: 'open_offer', title: 'Ver Oferta' },
      { action: 'dismiss', title: 'Fechar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification click action
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const offerId = event.notification.data?.offerId;
  const targetUrl = offerId ? `/?offer=${encodeURIComponent(offerId)}` : (event.notification.data?.url || '/');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (offerId && client.navigate) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window open, open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
