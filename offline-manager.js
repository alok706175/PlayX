/* =========================================================
   CHHATH GHAT & HINDI SONGS - OFFLINE AUDIO & PWA MANAGER
   Unified IndexedDB Audio Store, Stream Download & Smart Playback
   ========================================================= */

(function () {
  "use strict";

  const DB_NAME = "ChhathOfflineDB";
  const DB_VERSION = 1;
  const STORE_NAME = "downloaded_songs";

  let dbPromise = null;
  const activeBlobUrls = new Map(); // key -> objectUrl
  const activeDownloads = new Map(); // key -> AbortController
  let deferredInstallPrompt = null;
  let lastNetworkState = navigator.onLine;
  let networkBannerTimeout = null;

  // ---------------------------------------------------------
  // 1. INDEXEDDB LIFECYCLE
  // ---------------------------------------------------------
  function openDB() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn("[OfflineManager] IndexedDB is not supported in this browser.");
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
          store.createIndex("source", "source", { unique: false });
          store.createIndex("downloadedAt", "downloadedAt", { unique: false });
          store.createIndex("id", "id", { unique: false });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error("[OfflineManager] IndexedDB open error:", event.target.error);
        reject(event.target.error);
      };
    });

    return dbPromise;
  }

  // ---------------------------------------------------------
  // 2. HELPER UTILITIES
  // ---------------------------------------------------------
  function getSongKey(song) {
    if (!song) return "";
    return song.src || song.file || `song_${song.source || "track"}_${song.id || "0"}`;
  }

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  }

  // ---------------------------------------------------------
  // 3. OFFLINE STORAGE CRUD OPERATIONS
  // ---------------------------------------------------------
  async function isSongDownloaded(songOrKey) {
    const key = typeof songOrKey === "string" ? songOrKey : getSongKey(songOrKey);
    if (!key) return false;

    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          resolve(Boolean(req.result && req.result.audioBlob));
        };
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function getDownloadedSong(songOrKey) {
    const key = typeof songOrKey === "string" ? songOrKey : getSongKey(songOrKey);
    if (!key) return null;

    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function getAllDownloadedSongs(sourceFilter = null) {
    const db = await openDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => {
          let list = req.result || [];
          if (sourceFilter) {
            list = list.filter((item) => item.source === sourceFilter);
          }
          list.sort((a, b) => (b.downloadedAt || 0) - (a.downloadedAt || 0));
          resolve(list);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  async function deleteDownloadedSong(songOrKey) {
    const key = typeof songOrKey === "string" ? songOrKey : getSongKey(songOrKey);
    if (!key) return false;

    // Revoke any active blob URL for this song
    if (activeBlobUrls.has(key)) {
      try {
        URL.revokeObjectURL(activeBlobUrls.get(key));
      } catch (e) { }
      activeBlobUrls.delete(key);
    }

    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => {
          notifySubscribers("delete", { key });
          resolve(true);
        };
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function clearAllDownloadedSongs() {
    // Revoke all active blob URLs
    activeBlobUrls.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (e) { }
    });
    activeBlobUrls.clear();

    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => {
          notifySubscribers("clear", {});
          resolve(true);
        };
        req.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }

  async function getStorageInfo() {
    let totalBytes = 0;
    let count = 0;
    const songs = await getAllDownloadedSongs();
    songs.forEach((s) => {
      if (s.size) totalBytes += s.size;
      else if (s.audioBlob && s.audioBlob.size) totalBytes += s.audioBlob.size;
      count++;
    });

    let quotaBytes = 0;
    let quotaUsageBytes = 0;
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quotaBytes = estimate.quota || 0;
        quotaUsageBytes = estimate.usage || 0;
      } catch (e) { }
    }

    return {
      count,
      totalBytes,
      formattedUsed: formatBytes(totalBytes),
      quotaBytes,
      quotaUsageBytes,
      formattedQuota: formatBytes(quotaBytes)
    };
  }

  // ---------------------------------------------------------
  // 4. STREAM DOWNLOAD ENGINE WITH LIVE PROGRESS
  // ---------------------------------------------------------
  async function downloadSong(song, onProgress = null) {
    const key = getSongKey(song);
    const audioUrl = song.src || song.file;

    if (!audioUrl) {
      throw new Error("Audio URL is missing for this track.");
    }

    // Check if already downloaded
    const already = await isSongDownloaded(key);
    if (already) {
      if (onProgress) onProgress({ percent: 100, loaded: 0, total: 0, status: "complete" });
      return await getDownloadedSong(key);
    }

    // Check if download is already in progress
    if (activeDownloads.has(key)) {
      throw new Error("This track is already downloading.");
    }

    const controller = new AbortController();
    activeDownloads.set(key, controller);
    notifySubscribers("download-start", { key, song });

    try {
      const response = await fetch(audioUrl, {
        signal: controller.signal,
        cache: "no-store",
        mode: "cors"
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}: ${response.statusText}`);
      }

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
      let loadedBytes = 0;

      const reader = response.body.getReader();
      const chunks = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loadedBytes += value.length;

        if (totalBytes > 0) {
          const percent = Math.min(100, Math.round((loadedBytes / totalBytes) * 100));
          if (onProgress) {
            onProgress({
              percent,
              loaded: loadedBytes,
              total: totalBytes,
              formattedLoaded: formatBytes(loadedBytes),
              formattedTotal: formatBytes(totalBytes),
              status: "downloading"
            });
          }
          notifySubscribers("download-progress", { key, percent, loadedBytes, totalBytes });
        } else {
          // Indeterminate chunked progress
          if (onProgress) {
            onProgress({
              percent: -1,
              loaded: loadedBytes,
              total: 0,
              formattedLoaded: formatBytes(loadedBytes),
              status: "downloading"
            });
          }
          notifySubscribers("download-progress", { key, percent: -1, loadedBytes, totalBytes: 0 });
        }
      }

      // Check for zero-byte or corrupt download
      if (loadedBytes === 0) {
        throw new Error("Empty audio file received from server.");
      }

      // Concatenate chunks into a single Blob
      const mimeType = response.headers.get("content-type") || "audio/mpeg";
      const audioBlob = new Blob(chunks, { type: mimeType });

      // Build complete offline record with metadata
      const record = {
        key: key,
        id: song.id || 0,
        title: song.title || song.name || "Untitled Track",
        titleEn: song.titleEn || song.nameEn || song.title || song.name || "Untitled Track",
        artist: song.artist || song.singer || "Chhath Mahaparv",
        artistEn: song.artistEn || song.singerEn || song.artist || song.singer || "Chhath Mahaparv",
        album: song.album || "Chhath Ghat",
        src: audioUrl,
        file: audioUrl,
        cover: song.cover || song.artwork || "favicon.io/android-chrome-512x512.png",
        duration: song.duration || "",
        category: song.category || "",
        source: song.source || (audioUrl.includes("hindi") ? "hindi" : "chhath"),
        size: audioBlob.size,
        mimeType: mimeType,
        downloadedAt: Date.now(),
        audioBlob: audioBlob
      };

      // Store in IndexedDB
      const db = await openDB();
      if (!db) {
        throw new Error("Unable to open local storage database.");
      }

      await new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const putReq = store.put(record);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      });

      activeDownloads.delete(key);

      if (onProgress) {
        onProgress({
          percent: 100,
          loaded: loadedBytes,
          total: loadedBytes,
          formattedLoaded: formatBytes(loadedBytes),
          formattedTotal: formatBytes(loadedBytes),
          status: "complete"
        });
      }

      notifySubscribers("download-complete", { key, record });
      return record;
    } catch (err) {
      activeDownloads.delete(key);
      if (err.name === "AbortError") {
        notifySubscribers("download-cancelled", { key });
        throw new Error("Download was cancelled.");
      }
      notifySubscribers("download-error", { key, error: err.message });
      throw err;
    }
  }

  function cancelDownload(songOrKey) {
    const key = typeof songOrKey === "string" ? songOrKey : getSongKey(songOrKey);
    if (activeDownloads.has(key)) {
      const controller = activeDownloads.get(key);
      controller.abort();
      activeDownloads.delete(key);
      return true;
    }
    return false;
  }

  function isDownloading(songOrKey) {
    const key = typeof songOrKey === "string" ? songOrKey : getSongKey(songOrKey);
    return activeDownloads.has(key);
  }

  // ---------------------------------------------------------
  // 5. SMART PLAYBACK SOURCE RESOLVER
  // ---------------------------------------------------------
  /**
   * Resolves playback source with the priority:
   * 1. If downloaded in IndexedDB -> Return local Blob ObjectURL (Offline Mode)
   * 2. If NOT downloaded:
   *    - If online -> Return remote stream URL
   *    - If offline -> Return offline error state with message
   */
  async function resolvePlaybackSource(song) {
    const key = getSongKey(song);
    const downloaded = await getDownloadedSong(key);

    if (downloaded && downloaded.audioBlob) {
      // Reuse or create Blob ObjectURL
      let blobUrl = activeBlobUrls.get(key);
      if (!blobUrl) {
        blobUrl = URL.createObjectURL(downloaded.audioBlob);
        activeBlobUrls.set(key, blobUrl);
      }

      return {
        isOffline: true,
        sourceType: "indexeddb-blob",
        src: blobUrl,
        songRecord: downloaded,
        canPlay: true,
        message: "Playing offline copy"
      };
    }

    // If not in IndexedDB, use direct stream URL
    const remoteUrl = song.src || song.file;

    if (remoteUrl) {
      return {
        isOffline: false,
        sourceType: "network-stream",
        src: remoteUrl,
        songRecord: null,
        canPlay: true,
        message: "Streaming directly"
      };
    }

    // Offline and not downloaded
    return {
      isOffline: false,
      sourceType: "unavailable",
      src: "",
      songRecord: null,
      canPlay: false,
      message: "Song is not downloaded for offline listening. Connect to the internet to stream or download."
    };
  }

  // ---------------------------------------------------------
  // 6. EVENT SUBSCRIBERS BUS
  // ---------------------------------------------------------
  const subscribers = new Set();

  function subscribe(callback) {
    subscribers.add(callback);
    return () => subscribers.delete(callback);
  }

  function notifySubscribers(type, data) {
    subscribers.forEach((cb) => {
      try {
        cb(type, data);
      } catch (e) {
        console.error("[OfflineManager] Subscriber error:", e);
      }
    });

    // Also dispatch as DOM CustomEvent for wide interoperability
    window.dispatchEvent(
      new CustomEvent("chhath-offline-event", {
        detail: { type, ...data }
      })
    );
  }

  // ---------------------------------------------------------
  // 7. NETWORK STATUS DETECTION & FLOATING BANNER
  // ---------------------------------------------------------
  function setupNetworkDetection() {
    function handleNetworkChange(isOnline) {
      if (lastNetworkState === isOnline) return;
      lastNetworkState = isOnline;

      notifySubscribers("network-status", { online: isOnline });
      showNetworkBanner(isOnline);
    }

    window.addEventListener("online", () => handleNetworkChange(true));
    window.addEventListener("offline", () => handleNetworkChange(false));
  }

  function showNetworkBanner(isOnline) {
    let banner = document.getElementById("pwaNetworkBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "pwaNetworkBanner";
      banner.className = "pwa-network-banner";
      banner.setAttribute("role", "status");
      banner.setAttribute("aria-live", "polite");
      document.body.appendChild(banner);
    }

    const isEn = document.documentElement.lang !== "hi";

    if (isOnline) {
      banner.className = "pwa-network-banner online show";
      banner.innerHTML = `
        <span class="pwa-banner-icon">🌐</span>
        <span class="pwa-banner-text">${
          isEn ? "You're back online." : "आप वापस ऑनलाइन हैं।"
        }</span>
      `;
    } else {
      banner.className = "pwa-network-banner offline show";
      banner.innerHTML = `
        <span class="pwa-banner-icon">📴</span>
        <span class="pwa-banner-text">${
          isEn
            ? "You're offline. You can still listen to your downloaded songs."
            : "आप ऑफ़लाइन हैं। आप अभी भी अपने डाउनलोड किए गए गीत सुन सकते हैं।"
        }</span>
      `;
    }

    if (networkBannerTimeout) clearTimeout(networkBannerTimeout);
    networkBannerTimeout = setTimeout(() => {
      banner.classList.remove("show");
    }, 4500);
  }

  // ---------------------------------------------------------
  // 8. PWA INSTALL PROMPT HANDLER
  // ---------------------------------------------------------
  function setupPwaInstall() {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      notifySubscribers("installable", { canInstall: true });
    });

    window.addEventListener("appinstalled", () => {
      deferredInstallPrompt = null;
      notifySubscribers("installed", {});
    });
  }

  async function promptPwaInstall() {
    if (!deferredInstallPrompt) {
      return false;
    }
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    return outcome === "accepted";
  }

  function canInstallPwa() {
    return Boolean(deferredInstallPrompt);
  }

  // ---------------------------------------------------------
  // 9. SERVICE WORKER REGISTRATION HELPER
  // ---------------------------------------------------------
  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        // Compute correct path to root sw.js regardless of folder depth
        const pathname = window.location.pathname || "";
        const isSubdir = /[\/\\](bhojpuri-songs|chhath-puja|durga-puja-songs|haryanvi-songs|hindi-songs|holi-songs|punjabi-songs|saawan-songs)[\/\\]/i.test(pathname) ||
          (pathname.split("/").filter(Boolean).length > 1 && !pathname.endsWith("/home.html") && !pathname.endsWith("/index.html"));
        const swPath = isSubdir ? "../sw.js" : "./sw.js";

        navigator.serviceWorker
          .register(swPath)
          .then((registration) => {
            console.log("[PWA] Service Worker registered with scope:", registration.scope);

            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      console.log("[PWA] New content available; please refresh.");
                      notifySubscribers("sw-update", {});
                    } else {
                      console.log("[PWA] Content is cached for offline use.");
                      notifySubscribers("sw-cached", {});
                    }
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.warn("[PWA] Service Worker registration failed:", error);
          });
      });
    }
  }

  // Initialize background systems immediately
  setupNetworkDetection();
  setupPwaInstall();
  registerServiceWorker();

  // ---------------------------------------------------------
  // 10. PUBLIC API EXPORT
  // ---------------------------------------------------------
  window.OfflineManager = {
    openDB,
    getSongKey,
    isSongDownloaded,
    getDownloadedSong,
    getAllDownloadedSongs,
    deleteDownloadedSong,
    clearAllDownloadedSongs,
    getStorageInfo,
    downloadSong,
    cancelDownload,
    isDownloading,
    resolvePlaybackSource,
    formatBytes,
    subscribe,
    showNetworkBanner,
    promptPwaInstall,
    canInstallPwa,
    get isOnline() {
      return navigator.onLine;
    }
  };
})();
