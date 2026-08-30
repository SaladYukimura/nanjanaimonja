/* ナンジャナイモンジャ — オフライン用 Service Worker
   カード画像まで含めて最初の1回で全部キャッシュするので、
   2回目以降は電波が無くても起動する。
   絵柄やコードを更新したら CACHE の番号を上げること。 */
const CACHE = "nanjanaimonja-v11";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./mochiypop-subset.woff2",
  "./cast/01.png",
  "./cast/02.png",
  "./cast/03.png",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  ...Array.from({ length: 12 }, (_, i) => `./cards/${String(i + 1).padStart(2, "0")}.jpg`)
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* キャッシュ優先。取れなかったら取りに行って、拾えたら次回用に貯める。
   配信物は全部 install 時に入るので、ここは保険。 */
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && res.ok && (res.type === "basic" || res.type === "cors")){
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
