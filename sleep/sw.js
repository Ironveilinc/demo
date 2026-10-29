/* Cache first for the shell so the app opens instantly and works with no
   signal. The data is never cached here: it comes from the endpoint and is
   kept in localStorage instead, so a stale night never survives a refresh. */
var SHELL = 'sleeplab-shell-v5895';
var FILES = ['./', './index.html', './manifest.webmanifest',
             './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== SHELL; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (u.pathname.indexOf('data.enc') !== -1) return;           // always live
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (res) {
        if (res && res.ok && u.origin === self.location.origin) {
          var copy = res.clone();
          caches.open(SHELL).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    }).catch(function () { return caches.match('./index.html'); })
  );
});
