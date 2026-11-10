/* =========================================================
   PlayX Unified Festival Music Engine
   Powers: Bhojpuri, Durga Puja, Haryanvi, Holi, Saawan Songs
   ========================================================= */

(function () {
  "use strict";

  // Page Configuration loaded from dataset attributes on <body>
  const body = document.body;
  const dataFile = body.getAttribute("data-songs-file");
  const festivalTitle = body.getAttribute("data-festival-title") || "Festival Songs";

  let songs = [];
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let repeatMode = 0; // 0: None, 1: Repeat All, 2: Repeat One
  let likedSongs = new Set();
  let currentLang = "en"; // English mode only
  document.documentElement.lang = currentLang;

  // View Mode: 'vinyl' | 'video'
  let currentViewMode = "vinyl";

  try {
    const saved = localStorage.getItem("fav_" + festivalTitle);
    if (saved) likedSongs = new Set(JSON.parse(saved));
  } catch (e) {}

  // YouTube Player instance & API state
  let ytPlayer = null;
  let isYtReady = false;
  let progressInterval = null;
  let isDraggingSeek = false;

  // UI Elements
  let playBtn, prevBtn, nextBtn, shuffleBtn, repeatBtn;
  let trackTitle, trackSinger, trackTag, trackCoverImg;
  let seekSlider, currentTimeEl, durationEl;
  let volumeSlider, muteBtn, speedBtn;
  let playlistContainer, searchInput, songCountEl;
  let vinylDisc, videoStage, viewToggleBtn;

  document.addEventListener("DOMContentLoaded", () => {
    initElements();
    initClock();
    initTheme();
    loadSongs();
    injectOriginIslandDOM();
  });

  function initElements() {
    playBtn = document.getElementById("playerPlayBtn") || document.getElementById("playerPlayPauseBtn");
    prevBtn = document.getElementById("playerPrevBtn");
    nextBtn = document.getElementById("playerNextBtn");
    shuffleBtn = document.getElementById("playerShuffleBtn");
    repeatBtn = document.getElementById("playerRepeatBtn");

    trackTitle = document.getElementById("playerTrackTitle");
    trackSinger = document.getElementById("playerTrackSinger");
    trackTag = document.getElementById("playerTrackTag");
    trackCoverImg = document.getElementById("vinylCoverImg");

    seekSlider = document.getElementById("playerSeekSlider");
    currentTimeEl = document.getElementById("playerCurrentTime");
    durationEl = document.getElementById("playerDuration") || document.getElementById("playerTotalDuration");

    volumeSlider = document.getElementById("playerVolumeSlider");
    muteBtn = document.getElementById("playerMuteBtn");
    speedBtn = document.getElementById("playerSpeedBtn");

    playlistContainer = document.getElementById("playlistContainer");
    searchInput = document.getElementById("playlistSearchInput");
    songCountEl = document.getElementById("playlistSongCount") || document.getElementById("playlistTotalCount");

    vinylDisc = document.getElementById("vinylDisc");
    videoStage = document.getElementById("videoStage");
    viewToggleBtn = document.getElementById("viewToggleBtn");

    if (playBtn) playBtn.addEventListener("click", togglePlay);
    if (prevBtn) prevBtn.addEventListener("click", playPrev);
    if (nextBtn) nextBtn.addEventListener("click", playNext);
    if (shuffleBtn) shuffleBtn.addEventListener("click", toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener("click", toggleRepeat);

    if (viewToggleBtn) {
      viewToggleBtn.addEventListener("click", toggleViewMode);
    }

    if (seekSlider) {
      const startDrag = () => { isDraggingSeek = true; };
      const stopDrag = () => {
        if (isDraggingSeek) {
          onSeekChange();
        }
      };

      seekSlider.addEventListener("mousedown", startDrag);
      seekSlider.addEventListener("touchstart", startDrag, { passive: true });
      seekSlider.addEventListener("input", onSeekInput);
      seekSlider.addEventListener("change", onSeekChange);
      seekSlider.addEventListener("mouseup", stopDrag);
      seekSlider.addEventListener("touchend", stopDrag, { passive: true });
      seekSlider.addEventListener("touchcancel", stopDrag, { passive: true });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener("input", () => {
        const val = parseInt(volumeSlider.value, 10);
        if (ytPlayer && ytPlayer.setVolume) {
          ytPlayer.unMute();
          ytPlayer.setVolume(val);
        }
        updateVolumeIcon(val === 0);
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", toggleMute);
    }

    if (speedBtn) {
      const speeds = [1, 1.25, 1.5, 0.8];
      let sIdx = 0;
      speedBtn.addEventListener("click", () => {
        sIdx = (sIdx + 1) % speeds.length;
        const rate = speeds[sIdx];
        if (ytPlayer && ytPlayer.setPlaybackRate) {
          ytPlayer.setPlaybackRate(rate);
        }
        speedBtn.textContent = rate + "x";
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderPlaylist(searchInput.value.trim().toLowerCase());
      });
    }

    // Keyboard Spacebar to Play/Pause
    window.addEventListener("keydown", (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        togglePlay();
      }
    });
  }

  function toggleViewMode() {
    currentViewMode = currentViewMode === "vinyl" ? "video" : "vinyl";
    applyViewMode();
  }

  function applyViewMode() {
    if (!videoStage || !vinylDisc) return;
    if (currentViewMode === "video") {
      videoStage.classList.add("visible-video");
      vinylDisc.style.display = "none";
      if (viewToggleBtn) {
        viewToggleBtn.style.display = "inline-flex";
        viewToggleBtn.innerHTML = "<span>💿</span> <span>Vinyl View</span>";
        viewToggleBtn.setAttribute("title", "Switch to Vinyl Disc View");
      }
    } else {
      videoStage.classList.remove("visible-video");
      vinylDisc.style.display = "flex";
      if (viewToggleBtn) {
        viewToggleBtn.style.display = "inline-flex";
        viewToggleBtn.innerHTML = "<span>🎬</span> <span>Video View</span>";
        viewToggleBtn.setAttribute("title", "Switch to YouTube Video View");
      }
    }
  }

  /* =========================================================
     YouTube IFrame API Integration
     ========================================================= */
  let isYtScriptLoading = false;
  function ensureYouTubeAPI() {
    if (songs.length === 0) return;
    if (window.YT && window.YT.Player) {
      if (!ytPlayer) initYouTubePlayer();
      return;
    }
    if (isYtScriptLoading) return;
    isYtScriptLoading = true;

    window.onYouTubeIframeAPIReady = function () {
      initYouTubePlayer();
    };

    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(tag, firstScript);
      } else {
        document.head.appendChild(tag);
      }
    }
  }

  function initYouTubePlayer() {
    if (ytPlayer || !window.YT || !window.YT.Player || songs.length === 0) return;
    const initialSong = songs[currentIndex];
    const initialId = (initialSong && (initialSong.youtubeId || initialSong.videoId)) || "";
    if (!initialId) return;

    const targetEl = document.getElementById("ytFestivalPlayer");
    if (!targetEl) return;

    try {
      ytPlayer = new YT.Player("ytFestivalPlayer", {
        height: "100%",
        width: "100%",
        videoId: initialId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          fs: 1,
          origin: window.location.origin || (window.location.protocol + "//" + window.location.host)
        },
        events: {
          onReady: (event) => {
            isYtReady = true;
            if (volumeSlider) {
              event.target.setVolume(parseInt(volumeSlider.value, 10));
            }
            initMediaSessionHandlers();
            initSleepTimerUI();
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === YT.PlayerState.PLAYING) {
              isPlaying = true;
              clearBufferStall();
              fadeVolumeUp(300);
              updatePlayBtn();
              setVinylSpinning(true);
              startProgressTimer();
              startKeepAlive();
              updateMediaSession();
              updateTabTitle();
              updateOriginIslandUI();
            } else if (event.data === YT.PlayerState.BUFFERING) {
              handleBufferStall();
              try {
                if (MEDIA_SESSION_SUPPORTED) navigator.mediaSession.playbackState = "paused";
              } catch (e) {}
              updateOriginIslandUI();
            } else if (event.data === YT.PlayerState.PAUSED) {
              isPlaying = false;
              clearBufferStall();
              updatePlayBtn();
              setVinylSpinning(false);
              stopProgressTimer();
              stopKeepAlive();
              updateMediaSession();
              updateTabTitle();
              updateOriginIslandUI();
            } else if (event.data === YT.PlayerState.ENDED) {
              // Keep silent audio keeper active across song transition so Android doesn't revoke audio focus in pocket
              onSongEnded();
            }
          },
          onError: (err) => {
            console.warn("YouTube Player notice:", err);
            const errCode = (err && (err.data || err)) || 0;
            if (errCode === 150 || errCode === 101 || errCode === 100) {
              console.warn(`[PlayX] Video restricted/unavailable (code ${errCode}). Auto-skipping to next song...`);
              playNext();
            } else {
              handleBufferStall();
            }
          }
        }
      });
    } catch (e) {
      console.warn("YouTube player init notice:", e);
    }
  }

  /* =========================================================
     DYNAMIC TAB TITLE & STATUS ENGINE
     ========================================================= */
  const originalDocTitle = document.title;

  function updateTabTitle(status = "") {
    const currentSong = songs[currentIndex];
    if (!currentSong) {
      document.title = originalDocTitle;
      return;
    }
    const songName = currentSong.nameEn || currentSong.name || "Song";
    const singer = (currentSong.singerEn || currentSong.singer) ? ` • ${currentSong.singerEn || currentSong.singer}` : "";

    if (status === "buffering") {
      document.title = `⏳ Buffering: ${songName}${singer} | PlayX`;
    } else if (isPlaying) {
      document.title = `▶ ${songName}${singer} | PlayX`;
    } else {
      document.title = `❚❚ Paused: ${songName} | PlayX`;
    }
  }

  /* =========================================================
     SMOOTH AUDIO FADE IN / FADE OUT
     ========================================================= */
  let isFading = false;

  function fadeVolumeDown(durationMs = 350, onComplete) {
    if (!ytPlayer || !ytPlayer.setVolume || !ytPlayer.getVolume) {
      if (onComplete) onComplete();
      return;
    }
    isFading = true;
    const currentVol = ytPlayer.getVolume() || (volumeSlider ? parseInt(volumeSlider.value, 10) : 85);
    const steps = 7;
    const interval = Math.max(20, Math.floor(durationMs / steps));
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const nextVol = Math.max(0, Math.round(currentVol * (1 - (step / steps))));
      try { ytPlayer.setVolume(nextVol); } catch (e) {}
      if (step >= steps) {
        clearInterval(timer);
        isFading = false;
        if (onComplete) onComplete();
      }
    }, interval);
  }

  function fadeVolumeUp(durationMs = 350) {
    if (!ytPlayer || !ytPlayer.setVolume) return;
    const targetVol = volumeSlider ? parseInt(volumeSlider.value, 10) : 85;
    const steps = 7;
    const interval = Math.max(20, Math.floor(durationMs / steps));
    let step = 0;
    try { ytPlayer.setVolume(0); } catch (e) {}

    const timer = setInterval(() => {
      step++;
      const nextVol = Math.min(targetVol, Math.round((step / steps) * targetVol));
      try { ytPlayer.setVolume(nextVol); } catch (e) {}
      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);
  }

  function pauseWithFadeOut() {
    fadeVolumeDown(300, () => {
      if (ytPlayer && ytPlayer.pauseVideo) {
        try { ytPlayer.pauseVideo(); } catch (e) {}
      }
      isPlaying = false;
      updatePlayBtn();
      setVinylSpinning(false);
      stopProgressTimer();
      stopKeepAlive();
      updateMediaSession();
      updateTabTitle();
      const savedVol = volumeSlider ? parseInt(volumeSlider.value, 10) : 85;
      setTimeout(() => {
        if (ytPlayer && ytPlayer.setVolume) {
          try { ytPlayer.setVolume(savedVol); } catch (e) {}
        }
      }, 80);
    });
  }

  /* =========================================================
     NETWORK RESILIENCE & STALL RECOVERY
     ========================================================= */
  let networkRetryCount = 0;
  let stallTimeout = null;

  function handleBufferStall() {
    clearTimeout(stallTimeout);
    updateTabTitle("buffering");

    stallTimeout = setTimeout(() => {
      if (!ytPlayer) return;
      if (networkRetryCount < 3) {
        networkRetryCount++;
        console.warn(`[PlayX] Network stall detected in background. Auto-reconnecting attempt ${networkRetryCount}/3...`);
        const cur = (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime()) || 0;
        const song = songs[currentIndex];
        const vid = song ? (song.youtubeId || song.videoId) : "";
        try {
          if (vid && typeof ytPlayer.loadVideoById === "function") {
            ytPlayer.loadVideoById({ videoId: vid, startSeconds: Math.max(0, Math.floor(cur)) });
            ytPlayer.playVideo();
          } else if (ytPlayer.seekTo) {
            ytPlayer.seekTo(cur, true);
            ytPlayer.playVideo();
          }
        } catch (e) {}
      } else {
        console.warn("[PlayX] Track stalled after 3 attempts. Auto-recovering to next track...");
        clearBufferStall();
        playNext();
      }
    }, 4500);
  }

  function clearBufferStall() {
    clearTimeout(stallTimeout);
    networkRetryCount = 0;
  }

  window.addEventListener("online", () => {
    console.log("[PlayX] Network back online. Auto-resuming stream...");
    if (isPlaying && ytPlayer && ytPlayer.playVideo) {
      const cur = (ytPlayer.getCurrentTime && ytPlayer.getCurrentTime()) || 0;
      try {
        ytPlayer.seekTo(cur, true);
        ytPlayer.playVideo();
      } catch (e) {}
    }
  });

  window.addEventListener("offline", () => {
    updateTabTitle("buffering");
  });

  /* =========================================================
     SMART SLEEP TIMER ENGINE
     ========================================================= */
  let sleepTimerBtn = null;
  let sleepTimerMenu = null;
  let sleepTimerId = null;
  let sleepTimerMode = 0; // 0: off by default, 15, 30, 45, 60, -1: end of song
  let sleepTimerRemainingSeconds = 0;
  let sleepTimerLastActiveTs = null;

  function initSleepTimerUI() {
    const parent = document.querySelector(".deck-extra-controls");
    if (!parent || document.getElementById("playerSleepBtn")) return;

    const wrap = document.createElement("div");
    wrap.className = "sleep-timer-wrap";
    wrap.style.cssText = "position:relative;display:inline-block;";

    sleepTimerBtn = document.createElement("button");
    sleepTimerBtn.id = "playerSleepBtn";
    sleepTimerBtn.className = "btn-speed";
    sleepTimerBtn.type = "button";
    sleepTimerBtn.title = "Sleep Timer: Off";
    sleepTimerBtn.innerHTML = `🌙 <span id="sleepTimerBadge" style="display:none;font-size:0.75rem;margin-left:3px;font-weight:700;color:#38bdf8;"></span>`;

    sleepTimerMenu = document.createElement("div");
    sleepTimerMenu.id = "playerSleepMenu";
    sleepTimerMenu.style.cssText = "display:none;position:absolute;bottom:calc(100% + 8px);right:0;background:rgba(15,23,42,0.96);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.18);border-radius:12px;padding:6px;min-width:160px;z-index:999;box-shadow:0 12px 30px rgba(0,0,0,0.6);";

    const options = [
      { label: "Off", val: 0 },
      { label: "15 min", val: 15 },
      { label: "30 min", val: 30 },
      { label: "45 min", val: 45 },
      { label: "60 min (1 hour)", val: 60 },
      { label: "End of Song", val: -1 }
    ];

    options.forEach(opt => {
      const item = document.createElement("button");
      item.type = "button";
      item.style.cssText = "display:block;width:100%;text-align:left;background:none;border:none;color:#e2e8f0;padding:8px 12px;font-size:0.8rem;border-radius:8px;cursor:pointer;transition:all 0.15s;font-family:inherit;";
      if (opt.val === 30) {
        item.style.background = "rgba(56,189,248,0.15)";
        item.style.color = "#38bdf8";
        item.style.fontWeight = "700";
      }
      item.textContent = opt.label;
      item.addEventListener("mouseenter", () => { item.style.background = "rgba(56,189,248,0.15)"; item.style.color = "#38bdf8"; });
      item.addEventListener("mouseleave", () => {
        if (sleepTimerMode === opt.val) {
          item.style.background = "rgba(56,189,248,0.15)";
          item.style.color = "#38bdf8";
        } else {
          item.style.background = "none";
          item.style.color = "#e2e8f0";
        }
      });
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        setSleepTimer(opt.val);
        sleepTimerMenu.style.display = "none";
      });
      sleepTimerMenu.appendChild(item);
    });

    wrap.appendChild(sleepTimerBtn);
    wrap.appendChild(sleepTimerMenu);
    parent.appendChild(wrap);

    sleepTimerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      sleepTimerMenu.style.display = sleepTimerMenu.style.display === "none" ? "block" : "none";
    });

    document.addEventListener("click", (e) => {
      if (sleepTimerMenu && !wrap.contains(e.target)) {
        sleepTimerMenu.style.display = "none";
      }
    });

    // Default sleep timer off
    setSleepTimer(0);
  }

  function checkFestivalSleepTimerTick() {
    if (sleepTimerMode <= 0) return;
    const isScreenOff = document.visibilityState === "hidden";
    const now = Date.now();
    const isAudioPlaying = typeof isPlaying !== "undefined" ? isPlaying : true;

    if (isScreenOff && isAudioPlaying) {
      if (sleepTimerLastActiveTs) {
        const elapsed = Math.floor((now - sleepTimerLastActiveTs) / 1000);
        if (elapsed > 0) {
          sleepTimerRemainingSeconds = Math.max(0, sleepTimerRemainingSeconds - elapsed);
          sleepTimerLastActiveTs = now;
        }
      } else {
        sleepTimerLastActiveTs = now;
      }

      if (sleepTimerRemainingSeconds <= 7 && sleepTimerRemainingSeconds > 0) {
        fadeVolumeDown(sleepTimerRemainingSeconds * 1000);
      }

      if (sleepTimerRemainingSeconds <= 0) {
        if (sleepTimerId) {
          clearInterval(sleepTimerId);
          sleepTimerId = null;
        }
        sleepTimerMode = 0;
        sleepTimerRemainingSeconds = 0;
        sleepTimerLastActiveTs = null;
        const badge = document.getElementById("sleepTimerBadge");
        if (badge) badge.style.display = "none";
        if (sleepTimerBtn) {
          sleepTimerBtn.style.borderColor = "";
          sleepTimerBtn.title = "Sleep Timer: Off";
        }
        pauseWithFadeOut();
        return;
      }
    } else {
      if (sleepTimerLastActiveTs) {
        const elapsed = Math.floor((now - sleepTimerLastActiveTs) / 1000);
        sleepTimerRemainingSeconds = Math.max(0, sleepTimerRemainingSeconds - elapsed);
        sleepTimerLastActiveTs = null;
      }
    }

    const badge = document.getElementById("sleepTimerBadge");
    if (badge && sleepTimerRemainingSeconds > 0) {
      const mins = Math.max(1, Math.ceil(sleepTimerRemainingSeconds / 60));
      badge.textContent = `${mins}m`;
      badge.style.display = "inline";
    }
  }

  function setSleepTimer(val) {
    if (sleepTimerId) {
      clearInterval(sleepTimerId);
      sleepTimerId = null;
    }
    sleepTimerMode = val;
    sleepTimerLastActiveTs = null;
    const badge = document.getElementById("sleepTimerBadge");

    if (val === 0) {
      sleepTimerRemainingSeconds = 0;
      if (badge) badge.style.display = "none";
      if (sleepTimerBtn) {
        sleepTimerBtn.style.borderColor = "";
        sleepTimerBtn.title = "Sleep Timer: Off";
      }
      return;
    }

    if (val === -1) {
      sleepTimerRemainingSeconds = 0;
      if (badge) {
        badge.textContent = "1 Song";
        badge.style.display = "inline";
      }
      if (sleepTimerBtn) {
        sleepTimerBtn.style.borderColor = "#38bdf8";
        sleepTimerBtn.title = "Sleep Timer: Stop after current song";
      }
      return;
    }

    sleepTimerRemainingSeconds = val * 60;
    if (badge) {
      badge.textContent = `${val}m`;
      badge.style.display = "inline";
    }
    if (sleepTimerBtn) {
      sleepTimerBtn.style.borderColor = "#38bdf8";
      sleepTimerBtn.title = `Sleep Timer: ${val}m (Starts when screen turns off)`;
    }

    if (document.visibilityState === "hidden" && typeof isPlaying !== "undefined" && isPlaying) {
      sleepTimerLastActiveTs = Date.now();
    }

    sleepTimerId = setInterval(checkFestivalSleepTimerTick, 1000);
  }

  /* =========================================================
     BACKGROUND AUDIO KEEPALIVE & MEDIA SESSION CONTROLS
     ========================================================= */
  const MEDIA_SESSION_SUPPORTED = typeof navigator !== "undefined" && "mediaSession" in navigator;
  let silentAudioKeeper = null;
  let silentAudioBlobUrl = null;

  function getSilentAudioUrl() {
    if (silentAudioBlobUrl) return silentAudioBlobUrl;
    try {
      const sampleRate = 8000;
      const numChannels = 1;
      const duration = 10;
      const numSamples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + numSamples);
      const view = new DataView(buffer);

      function writeString(offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }

      writeString(0, "RIFF");
      view.setUint32(4, 36 + numSamples, true);
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels, true);
      view.setUint16(32, numChannels, true);
      view.setUint16(34, 8, true); // 8-bit
      writeString(36, "data");
      view.setUint32(40, numSamples, true);

      const bytes = new Uint8Array(buffer, 44, numSamples);
      bytes.fill(128); // Pure silence in 8-bit PCM

      const blob = new Blob([buffer], { type: "audio/wav" });
      silentAudioBlobUrl = URL.createObjectURL(blob);
      return silentAudioBlobUrl;
    } catch (e) {
      return "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    }
  }

  function ensureNotificationPermission() {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try {
        Notification.requestPermission().catch(() => {});
      } catch (e) {}
    }
  }

  function initSilentAudioKeeper() {
    if (silentAudioKeeper && document.getElementById("playxMediaAnchor")) return;
    try {
      let el = document.getElementById("playxMediaAnchor");
      if (!el) {
        el = document.createElement("audio");
        el.id = "playxMediaAnchor";
        el.setAttribute("playsinline", "");
        el.setAttribute("webkit-playsinline", "");
        el.setAttribute("aria-hidden", "true");
        el.setAttribute("title", "PlayX Media Service");
        el.style.cssText = "position:fixed;bottom:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none;";
        document.body.appendChild(el);
      }
      el.src = getSilentAudioUrl();
      el.loop = true;
      el.volume = 0.01; // Non-zero volume allows Android & WebAPK to register active foreground media session
      el.preload = "auto";
      el.onplay = () => { updateMediaSession(); };
      el.onplaying = () => { updateMediaSession(); };
      silentAudioKeeper = el;
    } catch (e) {}
  }

  function startKeepAlive() {
    ensureNotificationPermission();
    initSilentAudioKeeper();
    if (silentAudioKeeper && silentAudioKeeper.paused) {
      silentAudioKeeper.play().catch(() => {});
    }
  }

  function stopKeepAlive() {
    if (silentAudioKeeper && !silentAudioKeeper.paused) {
      silentAudioKeeper.pause();
    }
  }

  function getFestivalArtwork(song) {
    const list = [];
    const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    const makeUrl = (rel) => new URL(rel, origin + basePath).href;

    const songVid = song ? (song.youtubeId || song.videoId) : "";
    const songImg = song ? (song.thumbnail || song.cover || song.image) : "";

    if (songImg && songImg.startsWith("http")) {
      list.push(
        { src: songImg, sizes: "512x512", type: "image/jpeg" },
        { src: songImg, sizes: "384x384", type: "image/jpeg" },
        { src: songImg, sizes: "256x256", type: "image/jpeg" },
        { src: songImg, sizes: "192x192", type: "image/jpeg" },
        { src: songImg, sizes: "128x128", type: "image/jpeg" },
        { src: songImg, sizes: "96x96", type: "image/jpeg" }
      );
    } else if (songVid) {
      list.push(
        { src: `https://i.ytimg.com/vi/${songVid}/maxresdefault.jpg`, sizes: "1280x720", type: "image/jpeg" },
        { src: `https://i.ytimg.com/vi/${songVid}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" },
        { src: `https://i.ytimg.com/vi/${songVid}/mqdefault.jpg`, sizes: "320x180", type: "image/jpeg" },
        { src: `https://i.ytimg.com/vi/${songVid}/hqdefault.jpg`, sizes: "512x512", type: "image/jpeg" },
        { src: `https://i.ytimg.com/vi/${songVid}/hqdefault.jpg`, sizes: "192x192", type: "image/jpeg" },
        { src: `https://i.ytimg.com/vi/${songVid}/hqdefault.jpg`, sizes: "96x96", type: "image/jpeg" }
      );
    }

    try {
      list.push(
        { src: makeUrl("../images/playx_icon.png"), sizes: "512x512", type: "image/png" },
        { src: makeUrl("../favicon.io/android-chrome-512x512.png"), sizes: "512x512", type: "image/png" },
        { src: makeUrl("../favicon.io/android-chrome-192x192.png"), sizes: "192x192", type: "image/png" },
        { src: makeUrl("../favicon.io/favicon-32x32.png"), sizes: "32x32", type: "image/png" }
      );
    } catch (e) {}

    return list;
  }

  function updateMediaSession() {
    if (!MEDIA_SESSION_SUPPORTED || songs.length === 0 || !songs[currentIndex]) return;
    try {
      const song = songs[currentIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name || "Festival Song",
        artist: song.singer || festivalTitle,
        album: festivalTitle,
        artwork: getFestivalArtwork(song)
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      const dur = getEffectiveDuration();
      const cur = (ytPlayer && typeof ytPlayer.getCurrentTime === "function") ? (ytPlayer.getCurrentTime() || 0) : 0;
      updateMediaSessionPosition(cur, dur);
    } catch (e) {}
  }

  function updateMediaSessionPosition(pos = 0, dur = 0) {
    if (!MEDIA_SESSION_SUPPORTED || !("setPositionState" in navigator.mediaSession)) return;
    if (!isFinite(dur) || dur <= 0 || !isFinite(pos) || pos < 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: 1.0,
        position: Math.min(pos, dur)
      });
    } catch (e) {}
  }

  function initMediaSessionHandlers() {
    if (!MEDIA_SESSION_SUPPORTED) return;

    const actionHandlers = [
      ["play", () => {
        if (!isPlaying) togglePlay();
      }],
      ["pause", () => {
        if (isPlaying) togglePlay();
      }],
      ["previoustrack", () => {
        playPrev();
      }],
      ["nexttrack", () => {
        playNext();
      }],
      ["seekto", (details) => {
        if (details.seekTime !== undefined && isFinite(details.seekTime)) {
          if (ytPlayer && ytPlayer.seekTo) {
            ytPlayer.seekTo(details.seekTime, true);
          }
          const dur = getEffectiveDuration();
          if (currentTimeEl) currentTimeEl.textContent = formatTime(details.seekTime);
          updateMediaSessionPosition(details.seekTime, dur);
        }
      }],
      ["seekbackward", (details) => {
        const skip = details.seekOffset || 10;
        if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.seekTo) {
          const cur = ytPlayer.getCurrentTime() || 0;
          const target = Math.max(0, cur - skip);
          ytPlayer.seekTo(target, true);
          if (currentTimeEl) currentTimeEl.textContent = formatTime(target);
          updateMediaSessionPosition(target, getEffectiveDuration());
        }
      }],
      ["seekforward", (details) => {
        const skip = details.seekOffset || 10;
        if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.seekTo) {
          const cur = ytPlayer.getCurrentTime() || 0;
          const dur = getEffectiveDuration();
          const target = Math.min(dur, cur + skip);
          ytPlayer.seekTo(target, true);
          if (currentTimeEl) currentTimeEl.textContent = formatTime(target);
          updateMediaSessionPosition(target, dur);
        }
      }],
      ["stop", () => {
        if (ytPlayer && ytPlayer.pauseVideo) {
          ytPlayer.pauseVideo();
        }
        isPlaying = false;
        updatePlayBtn();
        setVinylSpinning(false);
        stopProgressTimer();
        stopKeepAlive();
        try { navigator.mediaSession.playbackState = "none"; } catch (e) {}
      }]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {}
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (isPlaying) {
        startKeepAlive();
        updateMediaSession();
      }
    } else {
      if (isPlaying) {
        updateMediaSession();
        if (ytPlayer && typeof ytPlayer.getPlayerState === "function") {
          const state = ytPlayer.getPlayerState();
          if (state !== 1 && state !== 3) {
            try { ytPlayer.playVideo(); } catch (e) {}
          }
        }
      }
    }
  });

  async function loadSongs() {
    if (!dataFile) return;
    try {
      const res = await fetch(dataFile, { cache: "no-store" });
      songs = await res.json();

      if (songs.length > 0) {
        ensureYouTubeAPI();
        if (songCountEl) {
          songCountEl.textContent = `${songs.length} Song${songs.length > 1 ? "s" : ""}`;
        }
        loadTrack(0, false);
        renderPlaylist();
      } else {
        // Empty state - coming soon
        displayComingSoonState();
      }
    } catch (e) {
      console.error("Failed to load songs from:", dataFile, e);
      displayComingSoonState();
    }
  }

  function displayComingSoonState() {
    if (songCountEl) {
      songCountEl.textContent = "Coming Soon";
    }
    if (trackTitle) {
      trackTitle.textContent = "Songs Coming Soon";
    }
    if (trackSinger) {
      trackSinger.textContent = "PlayX Music Library";
    }
    if (trackTag) {
      trackTag.textContent = "⏳ Coming Soon";
    }
    if (durationEl) {
      durationEl.textContent = "--:--";
    }
    if (currentTimeEl) {
      currentTimeEl.textContent = "00:00";
    }
    if (viewToggleBtn) {
      viewToggleBtn.style.display = "none";
    }
    if (videoStage) {
      videoStage.style.display = "none";
    }
    if (vinylDisc) {
      vinylDisc.style.display = "flex";
      setVinylSpinning(false);
    }

    if (playlistContainer) {
      playlistContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: rgba(255,255,255,0.02); border-radius: 16px; border: 1px dashed rgba(255,255,255,0.12);">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">⏳</div>
          <h4 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">
            Songs for this category are coming soon!
          </h4>
          <p style="font-size: 0.9rem; color: #94a3b8; max-width: 380px; margin: 0 auto 1.5rem; line-height: 1.5;">
            No dummy songs are included here. Original songs will be added here as soon as they become available.
          </p>
          <a href="../home.html" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; color: #fff; text-decoration: none; font-size: 0.88rem; font-weight: 600; transition: all 0.2s;">
            <span>←</span> <span>Go Back Home</span>
          </a>
        </div>
      `;
    }
  }

  function loadTrack(index, autoPlay = true) {
    if (!songs[index]) return;
    currentIndex = index;
    const song = songs[index];

    if (trackTitle) trackTitle.textContent = song.nameEn || song.name;
    if (trackSinger) trackSinger.textContent = song.singerEn || song.singer;
    if (trackTag) trackTag.textContent = song.tag || song.category || festivalTitle;

    // Update cover artwork
    const songVid = song.youtubeId || song.videoId;
    const coverUrl = songVid ? `https://i.ytimg.com/vi/${songVid}/hqdefault.jpg` : (song.thumbnail || "");
    if (trackCoverImg) {
      trackCoverImg.src = coverUrl;
      trackCoverImg.alt = song.name;
    } else if (coverUrl) {
      const label = document.querySelector(".vinyl-center-label");
      if (label) {
        label.innerHTML = `<img id="vinylCoverImg" src="${coverUrl}" alt="${song.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
        trackCoverImg = document.getElementById("vinylCoverImg");
      }
    }

    if (durationEl) {
      durationEl.textContent = song.duration || "--:--";
    }
    if (currentTimeEl) {
      currentTimeEl.textContent = "00:00";
    }
    if (seekSlider) {
      seekSlider.value = 0;
    }

    // Highlight active row in playlist
    document.querySelectorAll(".song-item-row").forEach((row, idx) => {
      row.classList.toggle("active", idx === index);
    });

    if (ytPlayer && ytPlayer.loadVideoById) {
      if (autoPlay) {
        ytPlayer.loadVideoById(songVid);
        isPlaying = true;
        updatePlayBtn();
        setVinylSpinning(true);
        startProgressTimer();
        startKeepAlive();
        updateMediaSession();
        updateTabTitle();
        updateOriginIslandUI();
      } else {
        ytPlayer.cueVideoById(songVid);
        isPlaying = false;
        updatePlayBtn();
        setVinylSpinning(false);
        updateMediaSession();
        updateTabTitle();
        updateOriginIslandUI();
      }
    } else {
      if (autoPlay) {
        isPlaying = true;
        updatePlayBtn();
        setVinylSpinning(true);
        startKeepAlive();
        updateMediaSession();
        updateTabTitle();
        updateOriginIslandUI();
      }
    }
  }

  function togglePlay() {
    if (songs.length === 0) {
      alert("No songs available in this category yet. Coming soon!");
      return;
    }
    if (!songs[currentIndex]) return;
    if (!ytPlayer || !ytPlayer.playVideo) {
      ensureYouTubeAPI();
      return;
    }

    if (isPlaying) {
      pauseWithFadeOut();
    } else {
      ytPlayer.playVideo();
      isPlaying = true;
      fadeVolumeUp(300);
      setVinylSpinning(true);
      startProgressTimer();
      startKeepAlive();
      updateMediaSession();
      updateTabTitle();
      updatePlayBtn();
    }
  }

  function playNext() {
    if (songs.length === 0) return;
    let next = isShuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex + 1) % songs.length;
    loadTrack(next, true);
  }

  function playPrev() {
    if (songs.length === 0) return;
    let prev = (currentIndex - 1 + songs.length) % songs.length;
    loadTrack(prev, true);
  }

  function toggleShuffle() {
    isShuffle = !isShuffle;
    if (shuffleBtn) shuffleBtn.classList.toggle("active", isShuffle);
  }

  function toggleRepeat() {
    repeatMode = (repeatMode + 1) % 3;
    if (repeatBtn) {
      if (repeatMode === 0) {
        repeatBtn.classList.remove("active");
        repeatBtn.textContent = "🔁";
        repeatBtn.title = "Repeat Off";
      } else if (repeatMode === 1) {
        repeatBtn.classList.add("active");
        repeatBtn.textContent = "🔁 All";
        repeatBtn.title = "Repeat All Songs";
      } else {
        repeatBtn.classList.add("active");
        repeatBtn.textContent = "🔂 1";
        repeatBtn.title = "Repeat Current Song";
      }
    }
  }

  function toggleMute() {
    if (!ytPlayer || !ytPlayer.isMuted) return;
    if (ytPlayer.isMuted()) {
      ytPlayer.unMute();
      updateVolumeIcon(false);
    } else {
      ytPlayer.mute();
      updateVolumeIcon(true);
    }
  }

  function updateVolumeIcon(isMuted) {
    if (!muteBtn) return;
    muteBtn.textContent = isMuted ? "🔇" : "🔊";
  }

  function onSongEnded() {
    if (sleepTimerMode === -1) {
      sleepTimerMode = 0;
      const badge = document.getElementById("sleepTimerBadge");
      if (badge) badge.style.display = "none";
      if (sleepTimerBtn) sleepTimerBtn.style.borderColor = "";
      isPlaying = false;
      updatePlayBtn();
      setVinylSpinning(false);
      stopProgressTimer();
      stopKeepAlive();
      updateMediaSession();
      updateTabTitle();
      return;
    }

    if (repeatMode === 2) {
      loadTrack(currentIndex, true);
    } else if (repeatMode === 1 || currentIndex < songs.length - 1) {
      playNext();
    } else {
      isPlaying = false;
      updatePlayBtn();
      setVinylSpinning(false);
      stopProgressTimer();
      stopKeepAlive();
      updateMediaSession();
      updateTabTitle();
    }
  }

  function parseDurationToSec(dStr) {
    if (!dStr || typeof dStr !== "string") return 0;
    const parts = dStr.split(":").map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  function getEffectiveDuration() {
    let dur = 0;
    if (ytPlayer && typeof ytPlayer.getDuration === "function") {
      try { dur = ytPlayer.getDuration() || 0; } catch (e) {}
    }
    if (!dur || dur <= 0 || isNaN(dur)) {
      dur = parseDurationToSec(songs[currentIndex]?.duration);
    }
    return dur > 0 ? dur : 225; // default 03:45 fallback if not yet available
  }

  function onSeekInput() {
    if (!seekSlider) return;
    const dur = getEffectiveDuration();
    if (dur > 0 && currentTimeEl) {
      const cur = (seekSlider.value / 100) * dur;
      currentTimeEl.textContent = formatTime(cur);
    }
  }

  function onSeekChange() {
    isDraggingSeek = false;
    if (!seekSlider || !ytPlayer || !ytPlayer.seekTo) return;
    const dur = getEffectiveDuration();
    if (dur > 0) {
      const targetTime = (seekSlider.value / 100) * dur;
      try {
        ytPlayer.seekTo(targetTime, true);
      } catch (e) {}
      if (currentTimeEl) currentTimeEl.textContent = formatTime(targetTime);
    }
  }

  function startProgressTimer() {
    stopProgressTimer();
    progressInterval = setInterval(() => {
      if (!ytPlayer || !ytPlayer.getCurrentTime || isDraggingSeek) return;
      try {
        const cur = ytPlayer.getCurrentTime() || 0;
        const dur = getEffectiveDuration();

        if (currentTimeEl) currentTimeEl.textContent = formatTime(cur);
        if (dur > 0) {
          if (durationEl && (durationEl.textContent === "--:--" || durationEl.textContent === "00:00")) {
            durationEl.textContent = formatTime(dur);
          }
          if (seekSlider) seekSlider.value = Math.min(100, Math.max(0, (cur / dur) * 100));
          if (Math.floor(cur) % 3 === 0) {
            updateMediaSessionPosition(cur, dur);
          }
        }
      } catch (e) {}
    }, 500);
  }

  function stopProgressTimer() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }

  function updatePlayBtn() {
    if (!playBtn) return;
    playBtn.innerHTML = isPlaying
      ? `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
      : `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  }

  function setVinylSpinning(spinning) {
    if (vinylDisc) {
      vinylDisc.style.animationPlayState = spinning ? "running" : "paused";
    }
  }

  function renderPlaylist(query = "") {
    if (!playlistContainer) return;
    if (songs.length === 0) {
      displayComingSoonState();
      return;
    }
    playlistContainer.innerHTML = "";

    songs.forEach((song, idx) => {
      const matchText = (song.name + " " + (song.nameEn || "") + " " + song.singer + " " + (song.tag || "")).toLowerCase();
      if (query && !matchText.includes(query)) return;

      const row = document.createElement("div");
      row.className = `song-item-row ${idx === currentIndex ? "active" : ""}`;

      const isFav = likedSongs.has(song.id);
      const rowVid = song.youtubeId || song.videoId;
      const thumbUrl = rowVid ? `https://i.ytimg.com/vi/${rowVid}/default.jpg` : (song.thumbnail || "");

      row.innerHTML = `
        <span class="song-num">${idx + 1 < 10 ? "0" : ""}${idx + 1}</span>
        ${thumbUrl ? `<div class="song-thumb-col"><img src="${thumbUrl}" alt="${song.name}" class="song-row-thumb" loading="lazy"></div>` : ""}
        <div class="song-info-col">
          <div class="song-name-text">${song.nameEn || song.name}</div>
          <div class="song-singer-text">${song.singerEn || song.singer} • <span class="tag-pill">${song.tag || song.category}</span></div>
        </div>
        <div class="song-actions-col">
          ${rowVid ? `<button class="btn-row-video" type="button" title="Watch Video">Play Video</button>` : ""}
          <button class="fav-icon-btn ${isFav ? "liked" : ""}" data-id="${song.id}" type="button" title="Favorites">${isFav ? "❤️" : "🤍"}</button>
          <span class="song-dur-text">${song.duration || "4:00"}</span>
          <button class="row-play-btn" type="button" title="Play">▶</button>
        </div>
      `;

      // Play Video button click
      const videoBtn = row.querySelector(".btn-row-video");
      if (videoBtn) {
        videoBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openYouTubeVideoModal(song);
        });
      }

      row.querySelector(".row-play-btn").addEventListener("click", (e) => {
        e.stopPropagation();
        loadTrack(idx, true);
      });

      row.addEventListener("click", () => {
        loadTrack(idx, true);
      });

      const favBtn = row.querySelector(".fav-icon-btn");
      favBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (likedSongs.has(song.id)) {
          likedSongs.delete(song.id);
          favBtn.textContent = "🤍";
          favBtn.classList.remove("liked");
        } else {
          likedSongs.add(song.id);
          favBtn.textContent = "❤️";
          favBtn.classList.add("liked");
        }
        localStorage.setItem("fav_" + festivalTitle, JSON.stringify([...likedSongs]));
      });

      playlistContainer.appendChild(row);
    });
  }

  /* =========================================================
     YOUTUBE VIDEO EMBED MODAL
     ========================================================= */
  function openYouTubeVideoModal(song) {
    if (!song) return;
    const videoId = song.videoId || song.youtubeId || (song.embedUrl ? song.embedUrl.split("/").pop().split("?")[0] : "");
    if (!videoId) {
      alert("Video not available for this song");
      return;
    }

    // Pause audio playback if currently playing
    if (isPlaying && ytPlayer && ytPlayer.pauseVideo) {
      ytPlayer.pauseVideo();
      isPlaying = false;
      updatePlayBtn();
      setVinylSpinning(false);
    }

    let modal = document.getElementById("playxVideoModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "playx-video-modal-overlay";
      modal.id = "playxVideoModal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-label", "YouTube Video Player");
      modal.innerHTML = `
        <div class="playx-video-modal-card">
          <div class="playx-video-modal-header">
            <div class="playx-video-modal-title-box">
              <span class="video-modal-badge">🎬 Video View</span>
              <span class="video-modal-song-title" id="videoModalSongTitle"></span>
            </div>
            <button class="btn-video-modal-close" id="closeVideoModalBtn" type="button" aria-label="Close video player">✕</button>
          </div>
          <div class="playx-video-modal-body" id="videoModalBody"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeYouTubeVideoModal();
        }
      });

      const closeBtn = modal.querySelector("#closeVideoModalBtn");
      if (closeBtn) {
        closeBtn.addEventListener("click", closeYouTubeVideoModal);
      }

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("active")) {
          closeYouTubeVideoModal();
        }
      });
    }

    const titleEl = modal.querySelector("#videoModalSongTitle");
    if (titleEl) {
      titleEl.textContent = `${song.nameEn || song.name} • ${song.singerEn || song.singer}`;
    }

    const bodyEl = modal.querySelector("#videoModalBody");
    if (bodyEl) {
      bodyEl.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1" 
          title="${song.name || "YouTube Video"}" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowfullscreen>
        </iframe>
      `;
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeYouTubeVideoModal() {
    const modal = document.getElementById("playxVideoModal");
    if (!modal) return;
    modal.classList.remove("active");
    const bodyEl = modal.querySelector("#videoModalBody");
    if (bodyEl) {
      bodyEl.innerHTML = "";
    }
    document.body.style.overflow = "";
  }

  window.openYouTubeVideoModal = openYouTubeVideoModal;
  window.closeYouTubeVideoModal = closeYouTubeVideoModal;

  /* =========================================================
     VIVO ORIGIN ISLAND / DYNAMIC COMPACT PILL
     ========================================================= */
  function injectOriginIslandDOM() {
    if (document.getElementById("dynamicIsland")) return;
    const aside = document.createElement("aside");
    aside.className = "dynamic-island-container";
    aside.id = "dynamicIsland";
    aside.setAttribute("aria-label", "Origin Island Media Player");
    aside.innerHTML = `
      <div class="dynamic-island-compact" id="islandCompact" title="Tap to expand Origin Island">
        <div class="island-compact-art-box">
          <img class="island-compact-art" id="islandArtImg" src="../images/playx_icon.png" alt="Album Art">
        </div>
        <div class="island-compact-waveform" id="islandWaveform" aria-hidden="true">
          <span class="island-wave-bar b1"></span>
          <span class="island-wave-bar b2"></span>
          <span class="island-wave-bar b3"></span>
          <span class="island-wave-bar b4"></span>
          <span class="island-wave-bar b5"></span>
        </div>
      </div>
      <div class="dynamic-island-expanded" id="islandExpanded" style="display: none;">
        <div class="island-expanded-top">
          <img class="island-expanded-art" id="islandExpandedImg" src="../images/playx_icon.png" alt="Album Art">
          <div class="island-expanded-info">
            <div class="island-expanded-title" id="islandExpandedTitle">Song Title</div>
            <div class="island-expanded-singer" id="islandExpandedSinger">Singer Name</div>
          </div>
        </div>
        <div class="island-expanded-controls">
          <button type="button" id="islandPrevBtn" aria-label="Previous Song">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
          </button>
          <button type="button" id="islandPlayBtn" aria-label="Play or Pause">
            <svg id="islandPlaySvg" viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>
          <button type="button" id="islandNextBtn" aria-label="Next Song">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="m6 18 8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(aside);

    const compact = document.getElementById("islandCompact");
    const expanded = document.getElementById("islandExpanded");
    if (compact && expanded) {
      compact.addEventListener("click", () => {
        compact.style.display = "none";
        expanded.style.display = "flex";
      });
      expanded.addEventListener("click", (e) => {
        if (!e.target.closest("button")) {
          expanded.style.display = "none";
          compact.style.display = "flex";
        }
      });
      document.addEventListener("click", (e) => {
        if (!aside.contains(e.target)) {
          expanded.style.display = "none";
          compact.style.display = "flex";
        }
      });
    }

    const prevBtnEl = document.getElementById("islandPrevBtn");
    const nextBtnEl = document.getElementById("islandNextBtn");
    const playBtnEl = document.getElementById("islandPlayBtn");
    if (prevBtnEl) prevBtnEl.addEventListener("click", (e) => { e.stopPropagation(); playPrev(); });
    if (nextBtnEl) nextBtnEl.addEventListener("click", (e) => { e.stopPropagation(); playNext(); });
    if (playBtnEl) playBtnEl.addEventListener("click", (e) => { e.stopPropagation(); togglePlay(); });
  }

  function updateOriginIslandUI() {
    const container = document.getElementById("dynamicIsland");
    if (!container) return;
    const song = songs[currentIndex];
    if (!song) {
      container.classList.remove("active");
      return;
    }
    container.classList.add("active");

    const songVid = song.youtubeId || song.videoId;
    const coverUrl = songVid ? `https://i.ytimg.com/vi/${songVid}/hqdefault.jpg` : (song.thumbnail || "../images/playx_icon.png");

    const compactArt = document.getElementById("islandArtImg");
    const expArt = document.getElementById("islandExpandedImg");
    if (compactArt) compactArt.src = "../images/playx_icon.png";
    if (expArt) expArt.src = coverUrl;

    const titleEl = document.getElementById("islandExpandedTitle");
    const singerEl = document.getElementById("islandExpandedSinger");
    if (titleEl) titleEl.textContent = song.nameEn || song.name || festivalTitle;
    if (singerEl) singerEl.textContent = song.singerEn || song.singer || "PlayX Festival Hits";

    const waveform = document.getElementById("islandWaveform");
    if (waveform) {
      if (isPlaying) {
        waveform.classList.add("playing");
      } else {
        waveform.classList.remove("playing");
      }
    }

    const playSvg = document.getElementById("islandPlaySvg");
    if (playSvg) {
      playSvg.innerHTML = isPlaying 
        ? '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'
        : '<path d="M8 5v14l11-7z"/>';
    }
  }

  function initClock() {
    const timeEl = document.getElementById("currentTime");
    const dateEl = document.getElementById("currentDate");
    if (!timeEl && !dateEl) return;

    function tick() {
      const now = new Date();
      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          day: "numeric",
          month: "short"
        });
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  function initTheme() {
    const themeBtn = document.getElementById("themeToggleBtn");
    const themeDropdown = document.getElementById("themeDropdown");
    const themeDropdownMenu = document.getElementById("themeDropdownMenu");
    const themes = ["midnight", "warm-amber", "twilight", "emerald"];
    
    // Check saved theme
    let saved = localStorage.getItem("playx_theme");
    if (saved === "light") saved = "warm-amber";
    else if (saved === "dark") saved = "midnight";
    if (!saved || !themes.includes(saved)) {
      saved = localStorage.getItem("fest_theme");
    }
    let curr = (saved && themes.includes(saved)) ? saved : "midnight";
    applyTheme(curr);

    function applyTheme(name) {
      curr = name;
      document.documentElement.setAttribute("data-theme", name);
      localStorage.setItem("fest_theme", name);
      localStorage.setItem("playx_theme", name === "warm-amber" ? "light" : "dark");

      if (themeDropdownMenu) {
        themeDropdownMenu.querySelectorAll(".theme-menu-item").forEach(item => {
          item.classList.toggle("active", item.getAttribute("data-set-theme") === name);
        });
      }
    }

    if (themeDropdownMenu) {
      themeDropdownMenu.querySelectorAll(".theme-menu-item").forEach(item => {
        item.addEventListener("click", () => {
          const themeName = item.getAttribute("data-set-theme");
          if (themeName) {
            applyTheme(themeName);
            themeDropdownMenu.style.display = "none";
          }
        });
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (themeDropdownMenu) {
          const isShown = themeDropdownMenu.style.display === "block";
          themeDropdownMenu.style.display = isShown ? "none" : "block";
        } else {
          // Cycle themes if no dropdown menu present
          const nextIdx = (themes.indexOf(curr) + 1) % themes.length;
          applyTheme(themes[nextIdx]);
        }
      });
    }

    // Share Dropdown & More Menu Dropdown handlers
    const shareBtn = document.getElementById("shareMainBtn");
    const shareMenu = document.getElementById("shareDropdownMenu");
    if (shareBtn && shareMenu) {
      shareBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = shareMenu.style.display === "block";
        shareMenu.style.display = isOpen ? "none" : "block";
      });
    }

    const moreBtn = document.querySelector(".btn-nav-more");
    const moreMenu = document.querySelector(".nav-more-dropdown");
    if (moreBtn && moreMenu) {
      moreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = moreMenu.style.display === "block";
        moreMenu.style.display = isOpen ? "none" : "block";
      });
    }

    // Global outside click closer
    document.addEventListener("click", () => {
      if (themeDropdownMenu) themeDropdownMenu.style.display = "none";
      if (shareMenu) shareMenu.style.display = "none";
      if (moreMenu) moreMenu.style.display = "none";
    });

    // Share buttons
    const whatsappBtn = document.getElementById("whatsappShareBtn");
    if (whatsappBtn) {
      whatsappBtn.addEventListener("click", () => {
        const text = encodeURIComponent(`Listen to hit ${festivalTitle} on PlayX: ${window.location.href}`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
      });
    }

    const copyLinkBtn = document.getElementById("copyLinkBtn");
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(window.location.href);
          alert("Link copied to clipboard! ✓");
        }
      });
    }
  }

  // Register High-Performance Service Worker for instant offline app shell caching
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("../sw.js").catch((err) => {
        console.debug("ServiceWorker registration notice:", err);
      });
    });
  }
})();
