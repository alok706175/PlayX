/* =========================================================
   सुर संगम | PlayX Unified Festival Music Engine
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
  let currentLang = localStorage.getItem("playx_lang") || "en";
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
      seekSlider.addEventListener("mousedown", () => { isDraggingSeek = true; });
      seekSlider.addEventListener("touchstart", () => { isDraggingSeek = true; });
      seekSlider.addEventListener("input", onSeekInput);
      seekSlider.addEventListener("change", onSeekChange);
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
    if (songs.length === 0) return;
    currentViewMode = currentViewMode === "vinyl" ? "video" : "vinyl";
    applyViewMode();
  }

  function applyViewMode() {
    if (!videoStage || !vinylDisc) return;
    if (currentViewMode === "video") {
      videoStage.style.display = "block";
      vinylDisc.style.display = "none";
      if (viewToggleBtn) {
        viewToggleBtn.innerHTML = `<span>💿</span> <span>Vinyl View</span>`;
        viewToggleBtn.title = "Switch to Vinyl Record View";
      }
    } else {
      videoStage.style.display = "none";
      vinylDisc.style.display = "flex";
      if (viewToggleBtn) {
        viewToggleBtn.innerHTML = `<span>🎬</span> <span>Video View</span>`;
        viewToggleBtn.title = "Switch to YouTube Video View";
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
    const initialId = (initialSong && initialSong.youtubeId) || "";
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
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === YT.PlayerState.PLAYING) {
              isPlaying = true;
              updatePlayBtn();
              setVinylSpinning(true);
              startProgressTimer();
            } else if (event.data === YT.PlayerState.PAUSED) {
              isPlaying = false;
              updatePlayBtn();
              setVinylSpinning(false);
              stopProgressTimer();
            } else if (event.data === YT.PlayerState.ENDED) {
              onSongEnded();
            }
          },
          onError: (err) => {
            console.warn("YouTube Player notice:", err);
          }
        }
      });
    } catch (e) {
      console.warn("YouTube player init notice:", e);
    }
  }

  async function loadSongs() {
    if (!dataFile) return;
    try {
      const res = await fetch(dataFile, { cache: "no-store" });
      songs = await res.json();

      if (songs.length > 0) {
        ensureYouTubeAPI();
        if (songCountEl) {
          songCountEl.textContent = `${songs.length} ${currentLang === "hi" ? "गाने" : "Songs"}`;
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
      songCountEl.textContent = currentLang === "hi" ? "0 गाने (जल्द आ रहे हैं)" : "Coming Soon";
    }
    if (trackTitle) {
      trackTitle.textContent = currentLang === "hi" ? "गाने जल्द आ रहे हैं" : "Songs Coming Soon";
    }
    if (trackSinger) {
      trackSinger.textContent = currentLang === "hi" ? "PlayX म्यूज़िक लाइब्रेरी" : "PlayX Music Library";
    }
    if (trackTag) {
      trackTag.textContent = currentLang === "hi" ? "⏳ जल्द आ रहा है" : "⏳ Coming Soon";
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
            ${currentLang === "hi" ? "इस श्रेणी में गाने जल्द जोड़े जाएंगे" : "Songs for this category are coming soon!"}
          </h4>
          <p style="font-size: 0.9rem; color: #94a3b8; max-width: 380px; margin: 0 auto 1.5rem; line-height: 1.5;">
            ${currentLang === "hi" 
              ? "यहाँ कोई डमी या नकली गाना नहीं रखा गया है। जब मूल गाने उपलब्ध होंगे, वे यहाँ स्वतः जुड़ जाएंगे।" 
              : "No dummy songs are included here. Original songs will be added here as soon as they become available."}
          </p>
          <a href="../home.html" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 999px; color: #fff; text-decoration: none; font-size: 0.88rem; font-weight: 600; transition: all 0.2s;">
            <span>←</span> <span>${currentLang === "hi" ? "होम पर जाएं (Go Home)" : "Go Back Home"}</span>
          </a>
        </div>
      `;
    }
  }

  function loadTrack(index, autoPlay = true) {
    if (!songs[index]) return;
    currentIndex = index;
    const song = songs[index];

    if (trackTitle) trackTitle.textContent = song.name;
    if (trackSinger) trackSinger.textContent = song.singer;
    if (trackTag) trackTag.textContent = song.tag || song.category || festivalTitle;

    // Update cover artwork
    const coverUrl = song.youtubeId ? `https://i.ytimg.com/vi/${song.youtubeId}/hqdefault.jpg` : "";
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

    // Highlight active row in playlist
    document.querySelectorAll(".song-item-row").forEach((row, idx) => {
      row.classList.toggle("active", idx === index);
    });

    if (ytPlayer && ytPlayer.loadVideoById) {
      if (autoPlay) {
        ytPlayer.loadVideoById(song.youtubeId);
        isPlaying = true;
        updatePlayBtn();
        setVinylSpinning(true);
        startProgressTimer();
      } else {
        ytPlayer.cueVideoById(song.youtubeId);
        isPlaying = false;
        updatePlayBtn();
        setVinylSpinning(false);
      }
    } else {
      if (autoPlay) {
        isPlaying = true;
        updatePlayBtn();
        setVinylSpinning(true);
      }
    }
  }

  function togglePlay() {
    if (songs.length === 0) {
      alert(currentLang === "hi" ? "इस श्रेणी में अभी कोई गाना उपलब्ध नहीं है। गाने जल्द जोड़े जाएंगे!" : "No songs available in this category yet. Coming soon!");
      return;
    }
    if (!songs[currentIndex]) return;
    if (!ytPlayer || !ytPlayer.playVideo) {
      ensureYouTubeAPI();
      return;
    }

    if (isPlaying) {
      ytPlayer.pauseVideo();
      isPlaying = false;
      setVinylSpinning(false);
      stopProgressTimer();
    } else {
      ytPlayer.playVideo();
      isPlaying = true;
      setVinylSpinning(true);
      startProgressTimer();
    }
    updatePlayBtn();
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
    if (repeatMode === 2) {
      loadTrack(currentIndex, true);
    } else if (repeatMode === 1 || currentIndex < songs.length - 1) {
      playNext();
    } else {
      isPlaying = false;
      updatePlayBtn();
      setVinylSpinning(false);
      stopProgressTimer();
    }
  }

  function onSeekInput() {
    if (!seekSlider || !ytPlayer || !ytPlayer.getDuration) return;
    const dur = ytPlayer.getDuration() || 0;
    if (dur > 0 && currentTimeEl) {
      const cur = (seekSlider.value / 100) * dur;
      currentTimeEl.textContent = formatTime(cur);
    }
  }

  function onSeekChange() {
    isDraggingSeek = false;
    if (!seekSlider || !ytPlayer || !ytPlayer.seekTo) return;
    const dur = ytPlayer.getDuration() || 0;
    if (dur > 0) {
      const targetTime = (seekSlider.value / 100) * dur;
      ytPlayer.seekTo(targetTime, true);
    }
  }

  function startProgressTimer() {
    stopProgressTimer();
    progressInterval = setInterval(() => {
      if (!ytPlayer || !ytPlayer.getCurrentTime || isDraggingSeek) return;
      try {
        const cur = ytPlayer.getCurrentTime() || 0;
        const dur = ytPlayer.getDuration() || 0;

        if (currentTimeEl) currentTimeEl.textContent = formatTime(cur);
        if (dur > 0) {
          if (durationEl) durationEl.textContent = formatTime(dur);
          if (seekSlider) seekSlider.value = (cur / dur) * 100;
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
      const thumbUrl = song.youtubeId ? `https://i.ytimg.com/vi/${song.youtubeId}/default.jpg` : "";

      row.innerHTML = `
        <span class="song-num">${idx + 1 < 10 ? "0" : ""}${idx + 1}</span>
        ${thumbUrl ? `<div class="song-thumb-col"><img src="${thumbUrl}" alt="${song.name}" class="song-row-thumb" loading="lazy"></div>` : ""}
        <div class="song-info-col">
          <div class="song-name-text">${song.name}</div>
          <div class="song-singer-text">${song.singer} • <span class="tag-pill">${song.tag || song.category}</span></div>
        </div>
        <div class="song-actions-col">
          <button class="fav-icon-btn ${isFav ? "liked" : ""}" data-id="${song.id}" type="button" title="Favorites">${isFav ? "❤️" : "🤍"}</button>
          <span class="song-dur-text">${song.duration || "4:00"}</span>
          <button class="row-play-btn" type="button" title="Play">▶</button>
        </div>
      `;

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

  function initClock() {
    const timeEl = document.getElementById("currentTime");
    if (!timeEl) return;
    function tick() {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  function initTheme() {
    const themeBtn = document.getElementById("themeToggleBtn");
    if (!themeBtn) return;
    const themes = ["midnight", "warm-amber", "twilight", "emerald"];
    let curr = document.documentElement.getAttribute("data-theme") || "midnight";

    themeBtn.addEventListener("click", () => {
      const nextIdx = (themes.indexOf(curr) + 1) % themes.length;
      curr = themes[nextIdx];
      document.documentElement.setAttribute("data-theme", curr);
      localStorage.setItem("fest_theme", curr);
    });
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
