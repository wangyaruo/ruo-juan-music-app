/* RuoJuan Music Service Worker
 * 策略：仅处理同源 GET 请求，网络优先、失败回退缓存（保证新版本及时生效）；
 * 第三方资源（B 站嵌入、在线音源）一律直连，不介入。
 */
const CACHE = 'ruojuan-v1'
const CORE = ['/', '/index.html', '/manifest.webmanifest']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== location.origin) return

  event.respondWith(
    fetch(event.request)
      .then((resp) => {
        const copy = resp.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, copy))
        return resp
      })
      .catch(() =>
        caches
          .match(event.request)
          .then((cached) => cached || caches.match('/index.html')),
      ),
  )
})
