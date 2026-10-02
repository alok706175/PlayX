/* =========================================================
   CHHATH PUJA & HINDI SONGS - ULTRA-FAST PWA SERVICE WORKER
   App Shell Cache-First & Offline Resilience (v3)
   ========================================================= */

const CACHE_NAME = "chhath-pwa-v28";
const DYNAMIC_CACHE_NAME = "chhath-dynamic-v28";

const STATIC_ASSETS = [
  "./",
  "./home.html",
  "./chhath-puja.html",
  "./hindi-songs.html",
  "./saawan-songs.html",
  "./durga-puja-songs.html",
  "./holi-songs.html",
  "./bhojpuri-songs.html",
  "./haryanvi-songs.html",
  "./home.css",
  "./home.js",
  "./style.css",
  "./hindi-song.css",
  "./festival-player.css",
  "./script.js",
  "./hindi-song.js",
  "./festival-player.js",
  "./offline-manager.js",
  "./site.webmanifest",
  "./hindi-songs.webmanifest",
  "./songs.json",
  "./data/cloudinary/cloudinary_songs.json",
  "./data/youtube/youtube_songs.json",
  "./data/hindi_songs/hindi_songs.json",
  "./data/saawan_songs/saawan_songs.json",
  "./data/durga_puja_songs/durga_puja_songs.json",
  "./data/holi_songs/holi_songs.json",
  "./data/bhojpuri_songs/bhojpuri_songs.json",
  "./data/haryanvi_songs/haryanvi_songs.json",
  "./favicon.io/favicon-32x32.png",
  "./favicon.io/favicon-16x16.png",
  "./favicon.io/apple-touch-icon.png",
  "./favicon.io/android-chrome-192x192.png",
  "./favicon.io/android-chrome-512x512.png",
  "./favicon.io/favicon.svg",
  "./favicon.io/favicon.ico",
  "./favicon.io/hindi-icon-16x16.png",
  "./favicon.io/hindi-icon-32x32.png",
  "./favicon.io/hindi-icon-192x192.png",
  "./favicon.io/hindi-icon-512x512.png",
  "./favicon.io/hindi-apple-touch-icon.png",
  "./images/image_background.png",
  "./images/chhath_puja_400x838.png",
  "./images/trishul_damru.svg",
  "./images/playx_icon.png",
  "./images/playx_icon.svg",
  "./images/playx_full_logo.png",
  "./images/hindi_song_icon.png",
  "./images/durga_puja_logo.png"
];

// Install Event - Pre-cache core app shell assets
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Resilient pre-caching: each asset is added individually so one missing file never breaks caching
      await Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[SW] Pre-cache failed for ${asset}:`, err.message || err);
          })
        )
      );
    })
  );
});

// Activate Event - Clean up stale caches & claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Strategic Routing
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Audio Streaming Requests (Online MP3s from Cloudinary / CDN / Local)
  // Per Requirement 10: DO NOT automatically cache all streamed audio to avoid filling user storage!
  // Offline audio is explicitly downloaded to IndexedDB by the user.
  if (
    url.pathname.endsWith(".mp3") ||
    req.destination === "audio" ||
    (url.hostname.includes("res.cloudinary.com") && url.pathname.includes("/video/upload/"))
  ) {
    event.respondWith(
      fetch(req).catch(() => {
        // If offline and somehow request wasn't resolved by IndexedDB blob URL
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          return new Response(null, {
            status: 503,
            statusText: "Audio unavailable offline. Please download track while online."
          });
        });
      })
    );
    return;
  }

  // 2. Navigation Requests (HTML pages) - Network-first with Cache fallback
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) return cachedRes;

          // Fallback based on URL path
          if (url.pathname.includes("hindi-songs")) {
            const hindiCached = await caches.match("./hindi-songs.html");
            if (hindiCached) return hindiCached;
          }
          return caches.match("./home.html");
        })
    );
    return;
  }

  // 3. Google Fonts & External Web Fonts - Stale-While-Revalidate in dynamic cache
  if (
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        return cache.match(req).then((cachedRes) => {
          const fetchPromise = fetch(req)
            .then((networkRes) => {
              if (networkRes && networkRes.status === 200) {
                cache.put(req, networkRes.clone());
              }
              return networkRes;
            })
            .catch(() => cachedRes);

          return cachedRes || fetchPromise;
        });
      })
    );
    return;
  }

  // 4. Static App Shell Assets & JSON Data - Cache-First with Background Revalidation
  if (
    STATIC_ASSETS.some((asset) => req.url.includes(asset.replace("./", ""))) ||
    req.destination === "style" ||
    req.destination === "script" ||
    req.destination === "image" ||
    url.pathname.endsWith(".json")
  ) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Default Fallback - Network with Cache Fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
