/* =========================================================
   CHHATH PUJA & HINDI SONGS - ULTRA-FAST PWA SERVICE WORKER
   App Shell Cache-First & Offline Resilience (v3)
   ========================================================= */

const CACHE_NAME = "chhath-pwa-v34";
const DYNAMIC_CACHE_NAME = "chhath-dynamic-v34";

const STATIC_ASSETS = [
  "./",
  "./home.html",
  "./index.html",
  "./home.css",
  "./home.js",
  "./dark-light-mode.css",
  "./dark-light-mode.js",
  "./offline-manager.js",
  "./site.webmanifest",
  "./favicon.ico",
  "./favicon.io/favicon-32x32.png",
  "./favicon.io/favicon-16x16.png",
  "./favicon.io/apple-touch-icon.png",
  "./favicon.io/android-chrome-192x192.png",
  "./favicon.io/android-chrome-512x512.png",
  "./favicon.io/favicon.svg",
  "./favicon.io/favicon.ico",
  "./favicon.io/site.webmanifest",
  "./images/playx_icon.png",
  "./images/playx_icon.svg",
  "./images/playx_full_logo.png",
  "./chhath-puja/chhath-puja.html",
  "./chhath-puja/style.css",
  "./chhath-puja/script.js",
  "./chhath-puja/songs.json",
  "./chhath-puja/cloudinary_songs.json",
  "./chhath-puja/youtube_songs.json",
  "./chhath-puja/images/chhath_puja_400x838.png",
  "./chhath-puja/images/image_background.png",
  "./hindi-songs/hindi-songs.html",
  "./hindi-songs/hindi-song.css",
  "./hindi-songs/hindi-song.js",
  "./hindi-songs/hindi-songs.webmanifest",
  "./hindi-songs/hindi_songs.json",
  "./hindi-songs/images/hindi_song_icon.png",
  "./hindi-songs/favicon.io/hindi-icon-16x16.png",
  "./hindi-songs/favicon.io/hindi-icon-32x32.png",
  "./hindi-songs/favicon.io/hindi-icon-192x192.png",
  "./hindi-songs/favicon.io/hindi-icon-512x512.png",
  "./hindi-songs/favicon.io/hindi-apple-touch-icon.png",
  "./saawan-songs/saawan-songs.html",
  "./saawan-songs/festival-player.css",
  "./saawan-songs/festival-player.js",
  "./saawan-songs/saawan_songs.json",
  "./saawan-songs/images/trishul_damru.svg",
  "./durga-puja-songs/durga-puja-songs.html",
  "./durga-puja-songs/festival-player.css",
  "./durga-puja-songs/festival-player.js",
  "./durga-puja-songs/durga_puja_songs.json",
  "./durga-puja-songs/images/durga_puja_logo.png",
  "./holi-songs/holi-songs.html",
  "./holi-songs/festival-player.css",
  "./holi-songs/festival-player.js",
  "./holi-songs/holi_songs.json",
  "./bhojpuri-songs/bhojpuri-songs.html",
  "./bhojpuri-songs/festival-player.css",
  "./bhojpuri-songs/festival-player.js",
  "./bhojpuri-songs/bhojpuri_songs.json",
  "./haryanvi-songs/haryanvi-songs.html",
  "./haryanvi-songs/festival-player.css",
  "./haryanvi-songs/festival-player.js",
  "./haryanvi-songs/haryanvi_songs.json"
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

          // Route fallback based on URL path
          if (url.pathname.includes("hindi-songs")) {
            return (await caches.match("./hindi-songs/hindi-songs.html")) || caches.match("./home.html");
          } else if (url.pathname.includes("chhath-puja")) {
            return (await caches.match("./chhath-puja/chhath-puja.html")) || caches.match("./home.html");
          } else if (url.pathname.includes("saawan-songs")) {
            return (await caches.match("./saawan-songs/saawan-songs.html")) || caches.match("./home.html");
          } else if (url.pathname.includes("durga-puja-songs")) {
            return (await caches.match("./durga-puja-songs/durga-puja-songs.html")) || caches.match("./home.html");
          } else if (url.pathname.includes("holi-songs")) {
            return (await caches.match("./holi-songs/holi-songs.html")) || caches.match("./home.html");
          } else if (url.pathname.includes("bhojpuri-songs")) {
            return (await caches.match("./bhojpuri-songs/bhojpuri-songs.html")) || caches.match("./home.html");
          } else if (url.pathname.includes("haryanvi-songs")) {
            return (await caches.match("./haryanvi-songs/haryanvi-songs.html")) || caches.match("./home.html");
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
