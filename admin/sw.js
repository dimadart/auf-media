// AUF admin: push notifications only. No caching, so the team always gets the current admin.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var m = {};
  try { m = e.data ? e.data.json() : {}; } catch (x) { m = { body: e.data ? e.data.text() : '' }; }
  var url = m.url || '/admin/';
  e.waitUntil(self.registration.showNotification(m.title || 'AUF MEDIA', {
    body: m.body || '', tag: m.tag || undefined, renotify: !!m.tag,
    icon: '/admin/icon-192.png', badge: '/admin/badge-96.png', data: { url: url }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf('/admin/') >= 0) { c.postMessage({ type: 'auf-open', url: url }); return c.focus(); }
    }
    return self.clients.openWindow(url);
  }));
});
