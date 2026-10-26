// Fonte — fonctionnement hors ligne.
// Pour publier une mise à jour : modifier index.html, puis changer VERSION ci-dessous.
const VERSION = 'fonte-1.0';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'fonte-fonts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Polices Google : mises en cache au premier chargement, puis servies hors ligne.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open('fonte-fonts').then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; })))
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // App : réponse immédiate depuis le cache (rapide même sans réseau en salle),
  // puis mise à jour du cache en arrière-plan pour le prochain lancement.
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(
    caches.open(VERSION).then(c =>
      c.match(key).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok) c.put(key, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    )
  );
});
