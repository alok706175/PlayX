/* =========================================================
   सुर संगम | Festival Audio Player Engine
   Powers: Saawan Songs, Durga Puja Songs, Holi Songs
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

  try {
    const saved = localStorage.getItem("fav_" + festivalTitle);
    if (saved) likedSongs = new Set(JSON.parse(saved));
  } catch (e) {}

  const audio = new Audio();
  audio.preload = "auto";

  // Elements
  let playBtn, prevBtn, nextBtn, shuffleBtn, repeatBtn;
  let trackTitle, trackSinger, trackTag, trackThumb;
  let seekSlider, currentTimeEl, durationEl;
  let volumeSlider, muteBtn, speedBtn;
  let playlistContainer, searchInput, songCountEl;

  document.addEventListener("DOMContentLoaded", () => {
    initElements();
    initClock();
    initTheme();
    loadSongs();
  });

  function initElements() {
    playBtn = document.getElementById("playerPlayBtn");
    prevBtn = document.getElementById("playerPrevBtn");
    nextBtn = document.getElementById("playerNextBtn");
    shuffleBtn = document.getElementById("playerShuffleBtn");
    repeatBtn = document.getElementById("playerRepeatBtn");

    trackTitle = document.getElementById("playerTrackTitle");
    trackSinger = document.getElementById("playerTrackSinger");
    trackTag = document.getElementById("playerTrackTag");
    trackThumb = document.getElementById("playerTrackThumb");

    seekSlider = document.getElementById("playerSeekSlider");
    currentTimeEl = document.getElementById("playerCurrentTime");
    durationEl = document.getElementById("playerDuration");

    volumeSlider = document.getElementById("playerVolumeSlider");
    muteBtn = document.getElementById("playerMuteBtn");
    speedBtn = document.getElementById("playerSpeedBtn");

    playlistContainer = document.getElementById("playlistContainer");
    searchInput = document.getElementById("playlistSearchInput");
    songCountEl = document.getElementById("playlistSongCount");

    // Audio event listeners
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onSongEnded);

    if (playBtn) playBtn.addEventListener("click", togglePlay);
    if (prevBtn) prevBtn.addEventListener("click", playPrev);
    if (nextBtn) nextBtn.addEventListener("click", playNext);
    if (shuffleBtn) shuffleBtn.addEventListener("click", toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener("click", toggleRepeat);

    if (seekSlider) {
      seekSlider.addEventListener("input", () => {
        if (audio.duration) {
          audio.currentTime = (seekSlider.value / 100) * audio.duration;
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener("input", () => {
        audio.volume = volumeSlider.value / 100;
        audio.muted = false;
        updateVolumeIcon();
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        audio.muted = !audio.muted;
        updateVolumeIcon();
      });
    }

    if (speedBtn) {
      const speeds = [1, 1.25, 1.5, 0.8];
      let sIdx = 0;
      speedBtn.addEventListener("click", () => {
        sIdx = (sIdx + 1) % speeds.length;
        audio.playbackRate = speeds[sIdx];
        speedBtn.textContent = speeds[sIdx] + "x";
      });
    }

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        renderPlaylist(searchInput.value.trim().toLowerCase());
      });
    }
  }

  function initClock() {
    const timeEl = document.getElementById("currentTime");
    const dateEl = document.getElementById("currentDate");
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
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString(currentLang === "hi" ? "hi-IN" : "en-IN", {
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

  async function loadSongs() {
    if (!dataFile) return;
    try {
      const res = await fetch(dataFile);
      songs = await res.json();
      if (songCountEl) songCountEl.textContent = songs.length;
      if (songs.length > 0) {
        loadTrack(0, false);
        renderPlaylist();
      }
    } catch (e) {
      console.error("Failed to load songs from:", dataFile, e);
    }
  }

  function loadTrack(index, autoPlay = true) {
    if (!songs[index]) return;
    currentIndex = index;
    const song = songs[index];

    audio.src = song.file;
    if (trackTitle) trackTitle.textContent = song.name;
    if (trackSinger) trackSinger.textContent = song.singer;
    if (trackTag) trackTag.textContent = song.tag || song.category || festivalTitle;

    // Highlight active in playlist
    document.querySelectorAll(".song-item-row").forEach((row, idx) => {
      row.classList.toggle("active", idx === index);
    });

    if (autoPlay) {
      audio.play().then(() => {
        isPlaying = true;
        updatePlayBtn();
        setVinylSpinning(true);
      }).catch(err => console.warn(err));
    } else {
      isPlaying = false;
      updatePlayBtn();
      setVinylSpinning(false);
    }
  }

  function togglePlay() {
    if (!audio.src) {
      loadTrack(0, true);
      return;
    }
    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      setVinylSpinning(false);
    } else {
      audio.play().then(() => {
        isPlaying = true;
        setVinylSpinning(true);
      }).catch(err => console.warn(err));
    }
    updatePlayBtn();
  }

  function playNext() {
    let next = isShuffle 
      ? Math.floor(Math.random() * songs.length) 
      : (currentIndex + 1) % songs.length;
    loadTrack(next, true);
  }

  function playPrev() {
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
      } else if (repeatMode === 1) {
        repeatBtn.classList.add("active");
        repeatBtn.textContent = "🔁 All";
      } else {
        repeatBtn.classList.add("active");
        repeatBtn.textContent = "🔂 1";
      }
    }
  }

  function onSongEnded() {
    if (repeatMode === 2) {
      loadTrack(currentIndex, true);
    } else {
      playNext();
    }
  }

  function onTimeUpdate() {
    if (!audio.duration) return;
    const cur = audio.currentTime;
    const dur = audio.duration;
    if (seekSlider) seekSlider.value = (cur / dur) * 100;
    if (currentTimeEl) currentTimeEl.textContent = formatTime(cur);
  }

  function onLoadedMetadata() {
    if (durationEl) durationEl.textContent = formatTime(audio.duration);
  }

  function formatTime(sec) {
    if (isNaN(sec)) return "00:00";
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
    const disc = document.getElementById("vinylDisc");
    if (disc) {
      disc.style.animationPlayState = spinning ? "running" : "paused";
    }
  }

  function updateVolumeIcon() {
    if (!muteBtn) return;
    muteBtn.textContent = audio.muted || audio.volume === 0 ? "🔇" : "🔊";
  }

  function renderPlaylist(query = "") {
    if (!playlistContainer) return;
    playlistContainer.innerHTML = "";

    songs.forEach((song, idx) => {
      const matchText = (song.name + " " + song.singer + " " + (song.tag || "")).toLowerCase();
      if (query && !matchText.includes(query)) return;

      const row = document.createElement("div");
      row.className = `song-item-row ${idx === currentIndex ? "active" : ""}`;
      
      const isFav = likedSongs.has(song.id);

      row.innerHTML = `
        <span class="song-num">${idx + 1 < 10 ? "0" : ""}${idx + 1}</span>
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

  // Register High-Performance Service Worker for instant offline audio caching
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("../sw.js").catch((err) => {
        console.debug("ServiceWorker registration notice:", err);
      });
    });
  }

})();
