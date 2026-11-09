/* =========================================================
   PlayX - Superhit Hindi Songs Interactive Engine
   Eye-Comfort, Dark Aesthetics, Glassmorphism Audio Player
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     0. BILINGUAL LOCALIZATION STRINGS (HINDI / ENGLISH)
     ========================================================= */
  let currentLang = "en";
try { localStorage.setItem("playx_lang", "en"); } catch(e){}
  let selectedCategory = "all";
  let currentSort = "default";
  let isShuffle = false;
  let repeatMode = 0; // 0: Off, 1: Repeat All, 2: Repeat One

  // Load Liked Songs from localStorage
  let likedSongs = new Set();
  try {
    const savedFavs = localStorage.getItem("hindi_songs_favs");
    if (savedFavs) {
      likedSongs = new Set(JSON.parse(savedFavs));
    }
  } catch (e) {
    console.warn("Error reading favorites:", e);
  }

  const i18n = {
    en: {

      langBtnText: "English",
      langBtnTitle: "Language: English (Click to switch to Hindi)",
      langBtnAria: "Switch language to Hindi",
      timeWidgetTitle: "Indian Standard Time (IST)",
      navBackText: "Go Home",
      navBackTitle: "Go to Home",
      heroBadge: "✨ 210 SUPERHIT BOLLYWOOD CLASSICS",
      mainLogoTitle1: "Superhit Hindi",
      mainLogoTitle2: "Songs Collection",
      taglineText: "★ Bollywood Classics • Romantic Hits • Soulful Melodies • Dance Beats ★",
      loadingSong: "Loading Hindi Songs...",
      playlistTitle: "Hindi Songs Playlist",
      playlistSearchPlaceholder: "Search song, movie, or singer name...",
      searchPlaceholder: "Search 210 Hindi songs, movies, or artists...",
      noSongsFound: "No songs found matching your search",
      noFavsFound: "No favorite songs yet. Click ❤️ on any song to add to your favorites!",
      prevSongTitle: "Previous Track (J)",
      playBtnTitle: "Play / Pause (Space)",
      nextSongTitle: "Next Track (K)",
      playlistBtnTitle: "Playlist (P)",
      playlistCloseTitle: "Close Playlist",
      muteBtnTitle: "Mute / Unmute Volume (M)",
      speedBtnTitle: "Playback Speed",
      volumeSliderTitle: "Adjust Volume",
      seekSliderTitle: "Seek Track",
      gridTitleText: "Superhit Bollywood Collection",
      showingSongsPrefix: "Showing ",
      songsSuffix: " Songs",
      shareBtnLabel: "Share",
      shareBtnTitle: "Share Hindi Songs Collection",
      whatsappLabel: "WhatsApp",
      facebookLabel: "Facebook",
      instagramLabel: "Instagram",
      copyLinkText: "Copy Link",
      toastLangSwitched: "Language switched to English",
      toastMuted: "🔇 Volume Muted",
      toastUnmuted: "🔊 Volume Unmuted",
      toastSpeed: "⚡ Playback Speed: ",
      toastFavAdded: "❤️ Added to Favorites",
      toastFavRemoved: "🤍 Removed from Favorites",
      toastShuffleOn: "🔀 Shuffle Mode ON",
      toastShuffleOff: "➡️ Normal Order Mode",
      toastRepeatOff: "➡️ Repeat Mode OFF",
      toastRepeatAll: "🔁 Repeat All Songs",
      toastRepeatOne: "🔂 Repeat Current Song (1)",
      toastTheme: "🎨 Theme Switched: ",
      toastCopied: "🔗 Link copied to clipboard!",
      nowPlayingPrefix: "🎶 Now Playing: "
    }
  };

  /* =========================================================
     1. THEME & EYE-COMFORT SYSTEM
     ========================================================= */
  const THEMES = {
    "midnight": { name: "Midnight Slate", icon: "🌙" },
    "warm-amber": { name: "Warm Amber (Night)", icon: "☕" },
    "twilight": { name: "Twilight Aurora", icon: "🌌" },
    "emerald": { name: "Emerald Oasis", icon: "🌿" }
  };

  const themeDropdown = document.getElementById("themeDropdown");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeCurrentIcon = document.getElementById("themeCurrentIcon");
  const themeMenuItems = document.querySelectorAll(".theme-menu-item");

  function setTheme(themeKey, notify = false) {
    if (!THEMES[themeKey]) themeKey = "midnight";
    document.documentElement.setAttribute("data-theme", themeKey);
    localStorage.setItem("hindi_songs_theme", themeKey);
    localStorage.setItem("playx_theme", themeKey === "classic-dark" ? "light" : "dark");

    if (themeCurrentIcon) {
      themeCurrentIcon.textContent = THEMES[themeKey].icon;
    }

    if (themeMenuItems) {
      themeMenuItems.forEach(item => {
        const itemTheme = item.getAttribute("data-set-theme");
        if (itemTheme === themeKey) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }

    // Update Meta Theme Color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const colors = {
        "midnight": "#0c0f17",
        "warm-amber": "#140f0c",
        "twilight": "#0d0a1a",
        "emerald": "#071412"
      };
      metaThemeColor.setAttribute("content", colors[themeKey] || "#0c0f17");
    }

    if (notify) {
      const t = i18n.en;
      showToast(t.toastTheme + THEMES[themeKey].name);
    }
  }

  // Load Saved Theme
  const savedPlayx = localStorage.getItem("playx_theme");
    const savedTheme = (savedPlayx === "light") ? "classic-dark" : (localStorage.getItem("hindi_songs_theme") || "midnight");
  setTheme(savedTheme, false);

  if (themeToggleBtn && themeDropdown) {
    themeToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      themeDropdown.classList.toggle("open");
    });
  }

  if (themeMenuItems) {
    themeMenuItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const themeKey = item.getAttribute("data-set-theme");
        setTheme(themeKey, true);
        if (themeDropdown) themeDropdown.classList.remove("open");
      });
    });
  }

  function cycleTheme() {
    const keys = Object.keys(THEMES);
    const current = document.documentElement.getAttribute("data-theme") || "midnight";
    const idx = keys.indexOf(current);
    const nextTheme = keys[(idx + 1) % keys.length];
    setTheme(nextTheme, true);
  }

  /* =========================================================
     2. LIVE CLOCK (IST)
     ========================================================= */
  const langDays = {
    hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };
  const langMonths = {
    hi: ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"],
    en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  };

  let isClockHovered = false;
  const timeWidget = document.getElementById("timeWidget");
  if (timeWidget) {
    timeWidget.addEventListener("mouseenter", () => {
      isClockHovered = true;
      updateClock();
    });
    timeWidget.addEventListener("mouseleave", () => {
      isClockHovered = false;
      updateClock();
    });
  }

  function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const suffix = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    const days = langDays.en;
    const months = langMonths.en;

    const timeEl = document.getElementById("currentTime");
    const dateEl = document.getElementById("currentDate");

    if (timeEl) {
      timeEl.textContent = isClockHovered ? `${hours}:${minutes}:${seconds} ${suffix}` : `${hours}:${minutes} ${suffix}`;
    }
    if (dateEl) {
      dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    }
  }
  setInterval(updateClock, 1000);

  /* =========================================================
     3. TOAST NOTIFICATION UTILITY
     ========================================================= */
  let toastTimeout = null;
  function showToast(message, position = "right") {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;

    toast.textContent = message;
    
    // Position toast on the left for minus / backward seek
    if (position === "left" || (typeof message === "string" && message.includes("-5s"))) {
      toast.classList.add("pos-left");
    } else {
      toast.classList.remove("pos-left");
    }
    
    toast.classList.add("show");

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.remove("pos-left");
    }, 2400);
  }

  /* =========================================================
     4. SOCIAL SHARING & DYNAMIC SONG DEEP-LINK ENGINE
     ========================================================= */
  function getCurrentSongShareInfo() {
    const s = songs[currentSong];
    const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
    const pathname = window.location.pathname;
    let url = window.location.href.split("?")[0];
    if (s) {
      const songId = s.id || (currentSong + 1);
      url = `${origin}${pathname}?song=${encodeURIComponent(songId)}&index=${encodeURIComponent(currentSong)}`;
    }
    const isEn = currentLang === "en";
    const title = s ? (isEn ? (s.nameEn || s.name) : s.name) : "Superhit Bollywood Hindi Songs";
    const singer = s ? (isEn ? (s.singerEn || s.singer) : s.singer) : "Bollywood Singers";
    return { url, title, singer, song: s };
  }

  function shareOnWhatsApp(customHeading) {
    const info = getCurrentSongShareInfo();
    const heading = customHeading || (info.song
      ? `🎶 *${info.title}* - ${info.singer} 🎧`
      : `🎶 ${songs.length || 205} Superhit Bollywood Hindi Classics 🎧`);

    const body =
      `${heading}\n\n` +
      `Listen to this song in 320 Kbps HD audio on PlayX:\n` +
      `▶️ *Listen Direct Here:* \n${info.url}\n\n` +
      `✨ Bollywood Classics • Romantic Hits • Soulful Melodies 🎵`;

    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
    showToast("✨ Opening WhatsApp...");
  }


  const shareDropdown = document.getElementById("shareDropdown");
  const shareMainBtn = document.getElementById("shareMainBtn");
  if (shareMainBtn && shareDropdown) {
    shareMainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = shareDropdown.classList.toggle("open");
      shareMainBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  const waShareBtn = document.getElementById("whatsappShareBtn");
  if (waShareBtn) {
    waShareBtn.addEventListener("click", () => {
      shareOnWhatsApp();
    });
  }

  const fbShareBtn = document.getElementById("facebookShareBtn");
  if (fbShareBtn) {
    fbShareBtn.addEventListener("click", () => {
      const info = getCurrentSongShareInfo();
      const quote = info.song
        ? `🎶 Listen to "${info.title}" by ${info.singer} in HD audio on PlayX!`
        : `🎶 Listen to ${songs.length || 205} Superhit Bollywood Hindi Classics Online on PlayX 🎧`;
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(info.url)}&quote=${encodeURIComponent(quote)}`;
      window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    });
  }

  /* Instagram Share */
  const instaShareBtn = document.getElementById("instagramShareBtn");
  if (instaShareBtn) {
    instaShareBtn.addEventListener("click", async () => {
      const info = getCurrentSongShareInfo();
      try {
        await navigator.clipboard.writeText(info.url);
        showToast(`✨ Link copied for "${info.title}"! Share on Instagram 📸`);
      } catch (err) {
        showToast("✨ Opening Instagram...");
      }
      if (shareDropdown) shareDropdown.classList.remove("open");
      setTimeout(() => {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }, 500);
    });
  }

  const copyLinkBtn = document.getElementById("copyLinkBtn");
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener("click", async () => {
      const info = getCurrentSongShareInfo();
      try {
        await navigator.clipboard.writeText(info.url);
        showToast(info.song ? `🔗 Link copied for "${info.title}"!` : "🔗 Link copied to clipboard!");
      } catch (err) {
        showToast("Link: " + info.url);
      }
      if (shareDropdown) shareDropdown.classList.remove("open");
    });
  }

  document.addEventListener("click", (e) => {
    if (shareDropdown && !shareDropdown.contains(e.target)) {
      shareDropdown.classList.remove("open");
    }
    if (themeDropdown && !themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove("open");
    }
    if (speedDropdown && !speedDropdown.contains(e.target)) {
      speedDropdown.classList.remove("open");
    }
  });

  /* =========================================================
     5. HINDI SONGS AUDIO PLAYER ENGINE
     ========================================================= */
  let songs = [];
  let currentSong = 0;
  let isPlaying = false;
  let isSeeking = false;
  let progressInterval = null;
  let seekDebounceTimeout = null;
  let lastVolume = 1;

  const offlineAudio = document.getElementById("offlineAudio");
  const songName = document.getElementById("offlineSongName");
  const songSinger = document.getElementById("offlineSinger");
  const playButton = document.getElementById("offlinePlay");
  const playIcon = document.getElementById("playIcon");
  const albumCover = document.getElementById("albumCover");
  const prevBtn = document.getElementById("prevSong");
  const nextBtn = document.getElementById("nextSong");
  const progress = document.getElementById("offlineProgress");
  const progressFill = document.getElementById("progressFill");
  const currentTime = document.getElementById("currentSongTime");
  const totalTime = document.getElementById("totalSongTime");
  const muteBtn = document.getElementById("muteBtn");
  const volumeSlider = document.getElementById("volumeSlider");
  const speedDropdown = document.getElementById("speedDropdown");
  const speedBtn = document.getElementById("speedBtn");
  const speedLabel = document.getElementById("speedLabel");
  const speedMenuItems = document.querySelectorAll(".speed-menu-item");
  const playerElem = document.getElementById("offlinePlayer");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const repeatBtn = document.getElementById("repeatBtn");
  const playerFavBtn = document.getElementById("playerFavBtn");

  // Mini-Player elements
  const miniPlayerDock = document.getElementById("miniPlayerDock");
  const miniCover = document.getElementById("miniCover");
  const miniTitle = document.getElementById("miniTitle");
  const miniSinger = document.getElementById("miniSinger");
  const miniPlayBtn = document.getElementById("miniPlayBtn");
  const miniPrevBtn = document.getElementById("miniPrevBtn");
  const miniNextBtn = document.getElementById("miniNextBtn");
  const miniFavBtn = document.getElementById("miniFavBtn");
  const miniSongCluster = document.getElementById("miniSongCluster");

  // Search & Filter elements
  const mainSearchInput = document.getElementById("mainSearchInput");
  const mainSearchClearBtn = document.getElementById("mainSearchClearBtn");
  const sortSelect = document.getElementById("sortSelect");
  const categoryChips = document.querySelectorAll(".category-chip");
  const gridCounterBadge = document.getElementById("gridCounterBadge");

  // Playlist drawer elements
  const playlistToggleBtn = document.getElementById("playlistToggleBtn");
  const playlistCloseBtn = document.getElementById("playlistCloseBtn");
  const playlistModal = document.getElementById("playlistModal");
  const playlistBackdrop = document.getElementById("playlistBackdrop");
  const playlistList = document.getElementById("playlistList");
  const playlistTitleText = document.getElementById("playlistTitleText");
  const playlistSearch = document.getElementById("playlistSearch");

  // Shortcuts modal elements
  const shortcutsBtn = document.getElementById("shortcutsBtn");
  const shortcutsModal = document.getElementById("shortcutsModal");
  const shortcutsCloseBtn = document.getElementById("shortcutsCloseBtn");

  // Language Elements
  const langToggleBtn = document.getElementById("langToggleBtn");
  const langText = document.getElementById("langText");
  const mainLogoText = document.getElementById("mainLogoText");
  const taglineText = document.getElementById("taglineText");
  const gridTitleText = document.getElementById("gridTitleText");

  let currentSpeedIndex = 2; // Default 1.0x
  const PLAYBACK_SPEEDS = [
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1.0, label: "1.0x" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.50x" },
    { value: 2.0, label: "2.0x" }
  ];

  /* Format seconds to M:SS */
  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  /* Save favorites to localStorage */
  function saveFavorites() {
    try {
      localStorage.setItem("hindi_songs_favs", JSON.stringify(Array.from(likedSongs)));
    } catch (e) {
      console.warn("Could not save favorites:", e);
    }
  }

  /* Toggle Favorite for a song */
  function toggleSongFavorite(songId, event) {
    if (event) event.stopPropagation();
    const t = i18n.en;

    if (likedSongs.has(songId)) {
      likedSongs.delete(songId);
      showToast(t.toastFavRemoved);
    } else {
      likedSongs.add(songId);
      showToast(t.toastFavAdded);
    }

    saveFavorites();
    updateFavoriteUI();

    if (selectedCategory === "favorites") {
      renderSongCardsGrid();
      renderPlaylist(playlistSearch ? playlistSearch.value : "");
    }
  }

  function updateFavoritesChipVisibility() {
    const favBtn = document.getElementById("catFavoritesBtn") || document.querySelector('.category-chip[data-cat="favorites"]');
    const countFavs = document.getElementById("countFavs");
    const favCount = likedSongs ? likedSongs.size : 0;
    if (countFavs) countFavs.textContent = favCount;
    if (favBtn) {
      if (favCount >= 1) {
        favBtn.style.display = "inline-flex";
      } else {
        favBtn.style.display = "none";
        if (selectedCategory === "favorites") {
          selectCategory("all");
        }
      }
    }
  }

  function selectCategory(cat) {
    selectedCategory = cat;
    if (categoryChips) {
      categoryChips.forEach(c => {
        if ((c.getAttribute("data-cat") || "all") === cat) {
          c.classList.add("active");
        } else {
          c.classList.remove("active");
        }
      });
    }
    renderSongCardsGrid();
    renderPlaylist(playlistSearch ? playlistSearch.value : "");
  }

  function updateFavoriteUI() {
    // Update category chip count and visibility for favorites
    updateFavoritesChipVisibility();

    // Update player favorite button
    const currentSongObj = songs[currentSong];
    const isCurLiked = currentSongObj && likedSongs.has(currentSongObj.id);

    if (playerFavBtn) {
      playerFavBtn.innerHTML = isCurLiked ? "❤️" : "🤍";
      playerFavBtn.classList.toggle("active", isCurLiked);
    }

    if (miniFavBtn) {
      miniFavBtn.innerHTML = isCurLiked ? "❤️" : "🤍";
    }

    // Update all cards
    const cardLikeBtns = document.querySelectorAll(".card-like-btn");
    cardLikeBtns.forEach(btn => {
      const sId = parseInt(btn.getAttribute("data-fav-id"), 10);
      if (likedSongs.has(sId)) {
        btn.classList.add("liked");
        btn.innerHTML = "❤️";
      } else {
        btn.classList.remove("liked");
        btn.innerHTML = "🤍";
      }
    });
  }

  function updateSongCategoryCounts() {
    const countAll = document.getElementById("countAll");
    const countRomantic = document.getElementById("countRomantic");
    const count90s = document.getElementById("count90s");
    const countSoulful = document.getElementById("countSoulful");
    const countDance = document.getElementById("countDance");

    if (countAll) countAll.textContent = songs.length;
    if (countRomantic) countRomantic.textContent = songs.filter(s => s.category === "Romantic").length;
    if (count90s) count90s.textContent = songs.filter(s => s.category === "90s Classics").length;
    if (countSoulful) countSoulful.textContent = songs.filter(s => s.category === "Soulful Melodies").length;
    if (countDance) countDance.textContent = songs.filter(s => s.category === "Dance & Beats").length;

    updateFavoritesChipVisibility();

    const t = i18n.en;
    if (playlistTitleText) {
      playlistTitleText.textContent = `${t.playlistTitle} (${songs.length})`;
    }
    const heroBadge = document.getElementById("heroBadge");
    if (heroBadge) {
      heroBadge.textContent = `✨ ${songs.length} SUPERHIT BOLLYWOOD CLASSICS`;
    }
    const gridCounterBadge = document.getElementById("gridCounterBadge");
    if (gridCounterBadge) {
      gridCounterBadge.textContent = `Showing ${songs.length} Songs`;
    }
  }

  function initSongUIAndDeepLinking() {
    updateSongCategoryCounts();
    renderPlaylist();
    renderSongCardsGrid();

    // Deep-linking via URL query params (?song=ID or ?play=ID or ?index=N)
    let initialIdx = 0;
    let shouldAutoPlay = false;
    let hasUrlParam = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const songParam = params.get("song") || params.get("play") || params.get("id");
      const idxParam = params.get("index");
      if (idxParam !== null && !isNaN(parseInt(idxParam, 10))) {
        initialIdx = Math.max(0, Math.min(songs.length - 1, parseInt(idxParam, 10)));
        shouldAutoPlay = true;
        hasUrlParam = true;
      } else if (songParam) {
        const found = songs.findIndex(s => String(s.id) === String(songParam) || (s.nameEn && s.nameEn.toLowerCase() === songParam.toLowerCase()));
        if (found !== -1) {
          initialIdx = found;
          shouldAutoPlay = true;
          hasUrlParam = true;
        }
      }
    } catch(e){}

    // If no explicit URL query, restore last played track from localStorage!
    if (!hasUrlParam) {
      try {
        const savedSong = localStorage.getItem("hindi_player_last_song");
        if (savedSong !== null) {
          const parsed = parseInt(savedSong, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < songs.length) {
            initialIdx = parsed;
          }
        }
      } catch (e) {}
    }

    displaySongInfo(initialIdx);

    // Restore last position from localStorage if not auto-playing a new URL song
    if (!shouldAutoPlay) {
      try {
        const savedPos = parseFloat(localStorage.getItem("hindi_player_last_pos") || "0");
        if (!isNaN(savedPos) && savedPos > 0 && offlineAudio) {
          const restorePosHandler = () => {
            if (offlineAudio.duration && isFinite(offlineAudio.duration) && savedPos < offlineAudio.duration) {
              offlineAudio.currentTime = savedPos;
              updateLiveProgress();
            }
          };
          offlineAudio.addEventListener("loadedmetadata", restorePosHandler, { once: true });
        }
      } catch (e) {}
    }

    if (shouldAutoPlay) {
      playSong(initialIdx);
    }
    updateFavoriteUI();

    // Preload track audio source
    if (offlineAudio && songs[initialIdx] && songs[initialIdx].file) {
      offlineAudio.src = songs[initialIdx].file;
      offlineAudio.load();
    }
  }

  /* Load Hindi Songs dataset */
  async function loadHindiSongs() {
    // 1. Instant rendering from preloaded bundle if available
    if (Array.isArray(window.PLAYX_HINDI_SONGS_DATA) && window.PLAYX_HINDI_SONGS_DATA.length > 0) {
      songs = window.PLAYX_HINDI_SONGS_DATA;
      initSongUIAndDeepLinking();
    }

    // 2. Fetch latest hindi_songs.json with cache busting to guarantee newly added songs show up
    try {
      const res = await fetch(`hindi_songs.json?_t=${Date.now()}`, { cache: "no-cache" });
      if (res.ok) {
        const fetched = await res.json();
        if (Array.isArray(fetched) && fetched.length > 0) {
          const hadPrior = Array.isArray(songs) && songs.length > 0;
          const hasDataChanged =
            !hadPrior ||
            songs.length !== fetched.length ||
            (songs.length > 0 && fetched.length > 0 && songs[songs.length - 1]?.id !== fetched[fetched.length - 1]?.id) ||
            (songs.length > 0 && fetched.length > 0 && songs[songs.length - 1]?.title !== fetched[fetched.length - 1]?.title);

          songs = fetched;
          window.PLAYX_HINDI_SONGS_DATA = fetched;

          if (!hadPrior) {
            initSongUIAndDeepLinking();
          } else if (hasDataChanged) {
            updateSongCategoryCounts();
            renderPlaylist();
            renderSongCardsGrid();
            if (songIndex >= songs.length) {
              songIndex = 0;
            }
            if (songs[songIndex]) {
              currentSong = songs[songIndex];
            }
          }
        }
      }
    } catch (e) {
      console.warn("Hindi songs fetch note:", e);
    }

    if (!Array.isArray(songs) || songs.length === 0) {
      if (songName) songName.textContent = "No Hindi Songs Found";
      return;
    }
  }

  let downloadedHindiSongs = new Set();
  async function refreshDownloadedHindiSongs() {
    const downloadsBtn = document.getElementById("catDownloadsBtn") || document.querySelector('.category-chip[data-cat="downloads"]');
    const countDownloadsEl = document.getElementById("countDownloads");

    if (window.OfflineManager) {
      try {
        const list = await window.OfflineManager.getAllDownloadedSongs();
        downloadedHindiSongs = new Set(list.map(x => x.key));
        const pageDownloadedCount = songs.filter(s => downloadedHindiSongs.has(window.OfflineManager.getSongKey(s))).length;
        if (countDownloadsEl) {
          countDownloadsEl.textContent = pageDownloadedCount.toString();
        }
        if (downloadsBtn) {
          if (pageDownloadedCount >= 1) {
            downloadsBtn.style.display = "inline-flex";
          } else {
            downloadsBtn.style.display = "none";
            if (selectedCategory === "downloads") {
              selectCategory("all");
            }
          }
        }
        return;
      } catch (e) {}
    }

    if (countDownloadsEl) countDownloadsEl.textContent = "0";
    if (downloadsBtn) downloadsBtn.style.display = "none";
  }

  function escapeHTML(text) {
    if (!text) return "";
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.toString().replace(/[&<>"']/g, (m) => map[m]);
  }

  async function displaySongInfo(index) {
    if (!songs[index]) return;
    currentSong = index;
    try {
      localStorage.setItem("hindi_player_last_song", index.toString());
    } catch (e) {}
    const s = songs[index];
    const isEn = currentLang === "en";

    const title = s.nameEn || s.name;
    const singer = s.singerEn || s.singer;

    let isOffline = false;
    if (window.OfflineManager) {
      isOffline = await window.OfflineManager.isSongDownloaded(s);
    }

    if (songName) {
      songName.innerHTML = `${escapeHTML(title)} ${isOffline ? '<span class="offline-playback-badge" title="Offline Local Audio">💾 Offline</span>' : ''}`;
    }
    if (songSinger) songSinger.textContent = `🎤 ${singer}`;

    if (miniTitle) miniTitle.textContent = title;
    if (miniSinger) miniSinger.textContent = singer;

    // Highlight current active card in the grid
    const cards = document.querySelectorAll(".song-card");
    cards.forEach((card) => {
      const cardSongId = parseInt(card.getAttribute("data-song-idx"), 10);
      if (cardSongId === index) {
        card.classList.add("now-playing");
      } else {
        card.classList.remove("now-playing");
      }
    });

    updateFavoriteUI();
    updateCardPlayingState();
  }

  /* =========================================================
     YOUTUBE AUDIO-ONLY EMBED ENGINE (FOR AUTO-ADDED SONGS)
     Plays embedded audio via off-screen YouTube iframe player
     ========================================================= */
  let ytAudioPlayer = null;
  let isYtReady = false;
  let activeAudioSource = "mp3"; // "mp3" or "youtube"
  let isYtScriptLoading = false;

  function ensureYouTubeApi(callback) {
    if (window.YT && window.YT.Player) {
      if (callback) callback();
      return;
    }
    if (isYtScriptLoading) {
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          if (callback) callback();
        }
      }, 100);
      return;
    }
    isYtScriptLoading = true;
    const oldReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof oldReady === "function") oldReady();
      if (callback) callback();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.async = true;
      document.head.appendChild(tag);
    }
  }

  function getOrCreateYtAudioStage() {
    let container = document.getElementById("hindiYtAudioWrapper");
    if (!container) {
      container = document.createElement("div");
      container.id = "hindiYtAudioWrapper";
      container.style.cssText = "position:fixed;width:1px;height:1px;left:-9999px;top:-9999px;opacity:0.001;pointer-events:none;z-index:-1;";
      container.innerHTML = '<div id="hindiYtAudioStage"></div>';
      document.body.appendChild(container);
    }
    return document.getElementById("hindiYtAudioStage");
  }

  function playYouTubeAudio(song) {
    const videoId = song.videoId || song.youtubeId;
    if (!videoId) return;

    activeAudioSource = "youtube";
    if (offlineAudio && !offlineAudio.paused) {
      offlineAudio.pause();
    }

    const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
    const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;

    ensureYouTubeApi(() => {
      getOrCreateYtAudioStage();

      if (!ytAudioPlayer) {
        try {
          ytAudioPlayer = new YT.Player("hindiYtAudioStage", {
            height: "1",
            width: "1",
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 0,
              modestbranding: 1,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin || (window.location.protocol + "//" + window.location.host)
            },
            events: {
              onReady: (e) => {
                isYtReady = true;
                e.target.setVolume(volNum);
                e.target.playVideo();
                setPlaybackState(true);
              },
              onStateChange: (e) => {
                if (!window.YT) return;
                if (e.data === YT.PlayerState.PLAYING) {
                  setBufferingState(false);
                  setPlaybackState(true);
                  updateHindiTabTitle();
                } else if (e.data === YT.PlayerState.BUFFERING) {
                  setBufferingState(true);
                } else if (e.data === YT.PlayerState.PAUSED) {
                  setBufferingState(false);
                  setPlaybackState(false);
                  updateHindiTabTitle();
                } else if (e.data === YT.PlayerState.ENDED) {
                  try { localStorage.setItem("hindi_player_last_pos", "0"); } catch (e) {}
                  if (hindiSleepTimerMode === -1) {
                    hindiSleepTimerMode = 0;
                    const badge = document.getElementById("hindiSleepBadge");
                    if (badge) badge.style.display = "none";
                    if (hindiSleepTimerBtn) hindiSleepTimerBtn.classList.remove("active");
                    setPlaybackState(false);
                    return;
                  }
                  if (repeatMode === 2) {
                    ytAudioPlayer.seekTo(0);
                    ytAudioPlayer.playVideo();
                  } else {
                    playNext();
                  }
                }
              },
              onError: (err) => {
                console.warn("YouTube embed audio notice:", err);
              }
            }
          });
        } catch (err) {
          console.warn("Error creating YT Player:", err);
        }
      } else {
        try {
          if (typeof ytAudioPlayer.loadVideoById === "function") {
            ytAudioPlayer.loadVideoById({ videoId: videoId, startSeconds: 0 });
            ytAudioPlayer.setVolume(volNum);
            ytAudioPlayer.playVideo();
            if (typeof ytAudioPlayer.setPlaybackRate === "function") {
              ytAudioPlayer.setPlaybackRate(activeRate);
            }
            setPlaybackState(true);
          }
        } catch (e) {
          console.warn("YouTube play error:", e);
        }
      }
    });

    const prefix = (i18n[currentLang] && i18n[currentLang].nowPlayingPrefix) || "🎶 Now Playing: ";
    showToast(prefix + (currentLang === "en" ? (song.nameEn || song.name) : song.name));
  }

  function pauseYouTubeAudio() {
    if (ytAudioPlayer && typeof ytAudioPlayer.pauseVideo === "function") {
      try { ytAudioPlayer.pauseVideo(); } catch (e) {}
    }
  }

  function resumeYouTubeAudio() {
    if (ytAudioPlayer && typeof ytAudioPlayer.playVideo === "function") {
      try { ytAudioPlayer.playVideo(); } catch (e) {}
    }
  }

  async function playSong(index, immediate = false) {
    if (!songs[index]) return;

    if (!immediate && isPlaying && isCrossfadeEnabled && !isCrossfading && activeAudioSource === "mp3") {
      isCrossfading = true;
      fadeHindiVolumeDown(350, () => {
        isCrossfading = false;
        playSong(index, true);
      });
      return;
    }

    currentSong = index;
    songCrossfadeTriggered = false;
    try {
      await displaySongInfo(index);
    } catch (err) {
      console.warn("displaySongInfo error:", err);
    }

    const s = songs[index];
    const isYt = Boolean(s.videoId || s.youtubeId);

    // If song is from YouTube, route to off-screen audio-only embed player
    if (isYt) {
      playYouTubeAudio(s);
      return;
    }

    // Normal MP3 track playback
    activeAudioSource = "mp3";
    pauseYouTubeAudio();

    if (offlineAudio) {
      let playback = { isOffline: false, canPlay: true, src: s.file };
      if (window.OfflineManager) {
        try {
          playback = await window.OfflineManager.resolvePlaybackSource(s);
        } catch (e) {}
      }

      if (!playback.canPlay) {
        setPlaybackState(false);
        showToast("📴 You're offline. Download this song while online to listen offline!");
        return;
      }

      setBufferingState(true);
      const fileSrc = playback.src;
      const targetFullUrl = new URL(fileSrc, window.location.href).href;
      if (offlineAudio.src !== targetFullUrl) {
        offlineAudio.src = fileSrc;
      }

      if (playback.isOffline) {
        showToast("💾 Playing local offline copy");
      }

      const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
      const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
      offlineAudio.volume = volNum / 100;
      offlineAudio.playbackRate = activeRate;

      offlineAudio.play().then(() => {
        setPlaybackState(true);
        fadeHindiVolumeUp(300);
        preloadNextTrack();
        const prefix = (i18n[currentLang] && i18n[currentLang].nowPlayingPrefix) || "🎶 Now Playing: ";
        showToast(prefix + (currentLang === "en" ? (s.nameEn || s.name) : s.name));
      }).catch(err => {
        console.warn("Playback error:", err);
      });
    }
  }

  /* =========================================================
     DYNAMIC TAB TITLE & STATUS ENGINE
     ========================================================= */
  const originalHindiDocTitle = document.title;

  function updateHindiTabTitle(status = "") {
    const s = songs[currentSong];
    if (!s) {
      document.title = originalHindiDocTitle;
      return;
    }
    const isEn = currentLang === "en";
    const title = isEn ? (s.nameEn || s.name) : s.name;
    const singer = isEn ? (s.singerEn || s.singer) : s.singer;
    const singerText = singer ? ` • ${singer}` : "";

    if (status === "buffering") {
      document.title = `⏳ Buffering: ${title}${singerText} | PlayX`;
    } else if (isPlaying) {
      document.title = `▶ ${title}${singerText} | PlayX`;
    } else {
      document.title = `❚❚ Paused: ${title} | PlayX`;
    }
  }

  /* =========================================================
     SMOOTH AUDIO FADE IN / FADE OUT
     ========================================================= */
  function fadeHindiVolumeDown(durationMs = 350, onComplete) {
    const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
    const steps = 7;
    const interval = Math.max(20, Math.floor(durationMs / steps));
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const factor = Math.max(0, 1 - (step / steps));

      if ((activeAudioSource === "mp3" || activeAudioSource === "offline") && offlineAudio) {
        offlineAudio.volume = (volNum / 100) * factor;
      } else if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.setVolume === "function") {
        try { ytAudioPlayer.setVolume(Math.round(volNum * factor)); } catch (e) {}
      }

      if (step >= steps) {
        clearInterval(timer);
        if (onComplete) onComplete();
      }
    }, interval);
  }

  function fadeHindiVolumeUp(durationMs = 350) {
    const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
    const steps = 7;
    const interval = Math.max(20, Math.floor(durationMs / steps));
    let step = 0;

    if ((activeAudioSource === "mp3" || activeAudioSource === "offline") && offlineAudio) {
      offlineAudio.volume = 0;
    } else if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.setVolume === "function") {
      try { ytAudioPlayer.setVolume(0); } catch (e) {}
    }

    const timer = setInterval(() => {
      step++;
      const factor = Math.min(1, step / steps);

      if ((activeAudioSource === "mp3" || activeAudioSource === "offline") && offlineAudio) {
        offlineAudio.volume = (volNum / 100) * factor;
      } else if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.setVolume === "function") {
        try { ytAudioPlayer.setVolume(Math.round(volNum * factor)); } catch (e) {}
      }

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);
  }

  function pauseHindiWithFadeOut() {
    fadeHindiVolumeDown(300, () => {
      if (activeAudioSource === "youtube") {
        pauseYouTubeAudio();
      } else if (offlineAudio && !offlineAudio.paused) {
        offlineAudio.pause();
      }
      setPlaybackState(false);
      updateHindiTabTitle();
      const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
      setTimeout(() => {
        if ((activeAudioSource === "mp3" || activeAudioSource === "offline") && offlineAudio) {
          offlineAudio.volume = volNum / 100;
        } else if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.setVolume === "function") {
          try { ytAudioPlayer.setVolume(volNum); } catch (e) {}
        }
      }, 80);
    });
  }

  /* =========================================================
     SMART SLEEP TIMER & 3-DOTS MORE OPTIONS ENGINE
     (Screen-Off Triggered Countdown)
     ========================================================= */
  let hindiSleepTimerBtn = null;
  let hindiSleepBadge = null;
  let hindiSleepTimerId = null;
  let hindiSleepTimerMode = 0; // 0: off by default, -1: end of song, >0: minutes
  let hindiSleepRemainingSeconds = 0;
  let hindiSleepLastActiveTs = null;

  function isDeviceScreenOff() {
    return document.visibilityState === "hidden";
  }

  function updateHindiSleepTimerDisplay() {
    const statusText = document.getElementById("moreMenuSleepStatus");
    const badge = document.getElementById("playerMoreSleepBadge") || hindiSleepBadge;

    if (hindiSleepTimerMode === 0) {
      if (statusText) statusText.textContent = "Off";
      if (badge) badge.style.display = "none";
      if (hindiSleepTimerBtn) {
        hindiSleepTimerBtn.classList.remove("has-sleep-timer");
        hindiSleepTimerBtn.title = "More Options (Sleep Timer: Off)";
      }
      return;
    }

    if (hindiSleepTimerMode === -1) {
      if (statusText) statusText.textContent = "End of Song";
      if (badge) {
        badge.textContent = "1s";
        badge.style.display = "none";
      }
      if (hindiSleepTimerBtn) {
        hindiSleepTimerBtn.classList.add("has-sleep-timer");
        hindiSleepTimerBtn.title = "Sleep Timer: Stop after current song";
      }
      return;
    }

    const mins = Math.max(1, Math.ceil(hindiSleepRemainingSeconds / 60));
    if (hindiSleepTimerBtn) {
      hindiSleepTimerBtn.classList.add("has-sleep-timer");
    }

    if (isDeviceScreenOff()) {
      if (statusText) statusText.textContent = `Screen Off Active (${mins}m left)`;
      if (hindiSleepTimerBtn) hindiSleepTimerBtn.title = `Sleep Timer: ${mins}m left (Screen Off counting)`;
    } else {
      if (hindiSleepRemainingSeconds === (hindiSleepTimerMode * 60)) {
        if (statusText) statusText.textContent = `Screen Off pe ${mins}m`;
        if (hindiSleepTimerBtn) hindiSleepTimerBtn.title = `Sleep Timer: ${mins}m (Starts when screen turns off)`;
      } else {
        const consumedMins = hindiSleepTimerMode - mins;
        if (statusText) statusText.textContent = `Paused (${mins}m left • Screen Off pe resume)`;
        if (hindiSleepTimerBtn) hindiSleepTimerBtn.title = `Sleep Timer: ${mins}m left (Paused while screen is ON)`;
      }
    }
  }

  function checkHindiSleepTimerTick() {
    if (hindiSleepTimerMode <= 0) return;
    const isScreenOff = isDeviceScreenOff();
    const now = Date.now();

    if (isScreenOff && isPlaying) {
      if (hindiSleepLastActiveTs) {
        const elapsed = Math.floor((now - hindiSleepLastActiveTs) / 1000);
        if (elapsed > 0) {
          hindiSleepRemainingSeconds = Math.max(0, hindiSleepRemainingSeconds - elapsed);
          hindiSleepLastActiveTs = now;
        }
      } else {
        hindiSleepLastActiveTs = now;
      }

      if (hindiSleepRemainingSeconds <= 7 && hindiSleepRemainingSeconds > 0) {
        fadeHindiVolumeDown(hindiSleepRemainingSeconds * 1000);
      }

      if (hindiSleepRemainingSeconds <= 0) {
        triggerHindiSleepTimerEnd();
        return;
      }
    } else {
      // Screen is ON or song paused: pause counting, preserve remaining seconds
      if (hindiSleepLastActiveTs) {
        const elapsed = Math.floor((now - hindiSleepLastActiveTs) / 1000);
        hindiSleepRemainingSeconds = Math.max(0, hindiSleepRemainingSeconds - elapsed);
        hindiSleepLastActiveTs = null;
      }
    }
    updateHindiSleepTimerDisplay();
  }

  function triggerHindiSleepTimerEnd() {
    if (hindiSleepTimerId) {
      clearInterval(hindiSleepTimerId);
      hindiSleepTimerId = null;
    }
    hindiSleepTimerMode = 0;
    hindiSleepRemainingSeconds = 0;
    hindiSleepLastActiveTs = null;

    if (hindiSleepTimerBtn) {
      hindiSleepTimerBtn.classList.remove("has-sleep-timer");
      hindiSleepTimerBtn.title = "More Options (Sleep Timer: Off)";
    }
    const statusText = document.getElementById("moreMenuSleepStatus");
    if (statusText) statusText.textContent = "Off";

    const sleepOptBtns = document.querySelectorAll("#sleepOptionsList .sleep-opt-btn");
    sleepOptBtns.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-val") === "0");
    });

    pauseHindiWithFadeOut();
    showToast("🌙 Sleep Timer: Device screen off होने के बाद का समय पूरा हो गया। शुभरात्रि! 😴");
  }

  function initHindiSleepTimerUI() {
    const moreDropdown = document.getElementById("playerMoreDropdown");
    const moreBtn = document.getElementById("playerMoreBtn");
    hindiSleepTimerBtn = moreBtn;
    hindiSleepBadge = document.getElementById("playerMoreSleepBadge");

    const mainView = document.getElementById("menuMainView");
    const sleepView = document.getElementById("menuSleepView");
    const openSleepSubmenu = document.getElementById("openSleepTimerSubmenu");
    const sleepBackBtn = document.getElementById("sleepSubmenuBack");
    const sleepSubmenuClose = document.getElementById("sleepSubmenuClose");
    const sleepOptBtns = document.querySelectorAll("#sleepOptionsList .sleep-opt-btn");
    const shareMenuBtn = document.getElementById("shareSongFromMenu");

    if (!moreDropdown || !moreBtn) return;

    const moreMenuEl = document.getElementById("playerMoreMenu");

    function closeMoreMenu() {
      if (moreDropdown) moreDropdown.classList.remove("open");
      if (moreBtn) moreBtn.setAttribute("aria-expanded", "false");
      if (moreMenuEl) moreMenuEl.style.display = "none";
      if (sleepView) sleepView.style.display = "none";
      if (mainView) mainView.style.display = "block";
    }

    // Toggle 3-dots menu
    moreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = moreDropdown.classList.toggle("open");
      moreBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      if (moreMenuEl) moreMenuEl.style.display = isOpen ? "block" : "none";
      if (isOpen) {
        // Always reset to show only the 2 options: Sleep Timer and Share Song
        if (mainView) mainView.style.display = "block";
        if (sleepView) sleepView.style.display = "none";
        updateHindiSleepTimerDisplay();
      }
    });

    // Option 1: Open Sleep Timer Submenu
    if (openSleepSubmenu) {
      openSleepSubmenu.addEventListener("click", (e) => {
        e.stopPropagation();
        if (mainView) mainView.style.display = "none";
        if (sleepView) sleepView.style.display = "block";
        updateHindiSleepTimerDisplay();
      });
    }

    // Back to the 2 options from Sleep Timer Submenu
    if (sleepBackBtn) {
      sleepBackBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (sleepView) sleepView.style.display = "none";
        if (mainView) mainView.style.display = "block";
        updateHindiSleepTimerDisplay();
      });
    }

    if (sleepSubmenuClose) {
      sleepSubmenuClose.addEventListener("click", (e) => {
        e.stopPropagation();
        closeMoreMenu();
      });
    }

    // Option 2: Share Song
    if (shareMenuBtn) {
      shareMenuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        closeMoreMenu();
        const curSong = songs[currentSong];
        const title = curSong ? (currentLang === "en" ? (curSong.nameEn || curSong.name) : curSong.name) : "PlayX Song";
        const singer = curSong?.singer ? ` - ${curSong.singer}` : "";
        const shareUrl = window.location.href;
        if (navigator.share) {
          navigator.share({
            title: `🎵 ${title}${singer} on PlayX`,
            text: `Listen to ${title}${singer} on PlayX Hindi Songs!`,
            url: shareUrl
          }).catch(() => {});
        } else {
          try {
            navigator.clipboard.writeText(shareUrl);
            showToast("🔗 Link copied to clipboard!");
          } catch (err) {
            showToast("🔗 Share: " + shareUrl);
          }
        }
      });
    }

    // Sleep Timer duration option click
    sleepOptBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = parseInt(btn.getAttribute("data-val"), 10);
        setHindiSleepTimer(val, true);
        closeMoreMenu();
      });
    });

    // Click outside closes dropdown
    document.addEventListener("click", (e) => {
      if (moreDropdown && !moreDropdown.contains(e.target)) {
        closeMoreMenu();
      }
    });

    // Default sleep timer off
    setHindiSleepTimer(0, false);
  }

  function setHindiSleepTimer(val, showToastMsg = true) {
    if (hindiSleepTimerId) {
      clearInterval(hindiSleepTimerId);
      hindiSleepTimerId = null;
    }

    hindiSleepTimerMode = val;
    hindiSleepLastActiveTs = null;

    const sleepOptBtns = document.querySelectorAll("#sleepOptionsList .sleep-opt-btn");
    sleepOptBtns.forEach(btn => {
      const btnVal = parseInt(btn.getAttribute("data-val"), 10);
      btn.classList.toggle("active", btnVal === val);
    });

    if (val === 0) {
      hindiSleepRemainingSeconds = 0;
      updateHindiSleepTimerDisplay();
      if (showToastMsg) showToast("🌙 Sleep Timer turned off");
      return;
    }

    if (val === -1) {
      hindiSleepRemainingSeconds = 0;
      updateHindiSleepTimerDisplay();
      if (showToastMsg) showToast("🌙 Sleep Timer set: Stop after current song");
      return;
    }

    // Release screen wake lock so device screen is allowed to turn off naturally
    releaseWakeLock();

    hindiSleepRemainingSeconds = val * 60;
    if (isDeviceScreenOff() && isPlaying) {
      hindiSleepLastActiveTs = Date.now();
    } else {
      hindiSleepLastActiveTs = null;
    }

    updateHindiSleepTimerDisplay();

    if (showToastMsg) {
      showToast(`🌙 Sleep Timer: ${val}m सेट! डिवाइस Screen Off होने के बाद से टाइमर काउंट करेगा 📱💤`);
    }

    hindiSleepTimerId = setInterval(checkHindiSleepTimerTick, 1000);
  }

  function togglePlayback() {
    if (isPlaying) {
      pauseHindiWithFadeOut();
    } else {
      if (activeAudioSource === "youtube") {
        resumeYouTubeAudio();
        setPlaybackState(true);
        fadeHindiVolumeUp(300);
      } else if (offlineAudio) {
        const s = songs[currentSong];
        if (s && s.file && (!offlineAudio.src || offlineAudio.src !== s.file)) {
          offlineAudio.src = s.file;
        }
        const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
        const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
        offlineAudio.volume = volNum / 100;
        offlineAudio.playbackRate = activeRate;
        offlineAudio.play().then(() => {
          preloadNextTrack();
          fadeHindiVolumeUp(300);
        }).catch(console.warn);
        setPlaybackState(true);
      }
    }
  }

  function playPrevious() {
    if (!songs.length) return;
    if (isShuffle) {
      const randomPos = Math.floor(Math.random() * songs.length);
      playSong(randomPos);
      return;
    }
    const prevPos = (currentSong - 1 + songs.length) % songs.length;
    playSong(prevPos);
  }

  
  /* =========================================================
     STREAMING RESILIENCE: BUFFERING & STALL INDICATOR ENGINE
     ========================================================= */
  let isBuffering = false;
  function setBufferingState(buffering) {
    isBuffering = !!buffering;
    const overlay = document.getElementById("bufferingOverlay");
    const statusPill = document.getElementById("bufferingStatusPill");
    if (buffering) {
      if (albumCover) albumCover.classList.add("buffering");
      if (overlay) overlay.classList.add("active");
      if (statusPill) statusPill.style.display = "inline-flex";
      updateHindiTabTitle("buffering");
    } else {
      if (albumCover) albumCover.classList.remove("buffering");
      if (overlay) overlay.classList.remove("active");
      if (statusPill) statusPill.style.display = "none";
      updateHindiTabTitle();
    }
  }

  /* =========================================================
     CUSTOM UP NEXT QUEUE ENGINE
     ========================================================= */
  let userQueue = [];
  try {
    const savedQueue = localStorage.getItem("hindi_player_queue");
    if (savedQueue) {
      const parsed = JSON.parse(savedQueue);
      if (Array.isArray(parsed)) {
        userQueue = parsed.filter(idx => typeof idx === "number" && idx >= 0);
      }
    }
  } catch (e) {
    console.warn("Queue reading error:", e);
  }

  function saveUserQueue() {
    try {
      localStorage.setItem("hindi_player_queue", JSON.stringify(userQueue));
    } catch (e) {}
  }

  function updateQueueUI() {
    const queueBadge = document.getElementById("queueBadge");
    const queueCountPill = document.getElementById("queueCountPill");
    const count = userQueue.length;

    if (queueBadge) {
      if (count > 0) {
        queueBadge.textContent = count > 99 ? "99+" : count;
        queueBadge.style.display = "flex";
      } else {
        queueBadge.style.display = "none";
      }
    }

    if (queueCountPill) {
      queueCountPill.textContent = count;
    }

    renderQueueList();
  }

  function addToQueue(songIdx, playNextNow = false) {
    if (songIdx < 0 || songIdx >= songs.length) return;
    const song = songs[songIdx];
    if (!song) return;

    if (playNextNow) {
      userQueue.unshift(songIdx);
    } else {
      userQueue.push(songIdx);
    }
    saveUserQueue();
    updateQueueUI();

  /* Mobile Mini Player Tap to Scroll & Horizontal Swipe Gestures */
  const miniDock = document.getElementById("miniPlayerDock");
  const miniCluster = document.getElementById("miniSongCluster");

  if (miniCluster) {
    miniCluster.addEventListener("click", () => {
      const mainPlayer = document.getElementById("offlinePlayer") || document.getElementById("heroSection");
      if (mainPlayer) {
        mainPlayer.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  if (miniDock) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    miniDock.addEventListener("touchstart", (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
      }
    }, { passive: true });

    miniDock.addEventListener("touchend", (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
          if (diffX < 0) {
            playNext();
            showToast("⏭ Next Track", "right");
          } else {
            playPrevious();
            showToast("⏮ Previous Track", "left");
          }
        }
      }
    }, { passive: true });
  }

    const title = currentLang === "en" ? (song.nameEn || song.name) : song.name;
    const msg = playNextNow
      ? `⏭ "${title}" set as Play Next!`
      : `➕ "${title}" added to Up Next (${userQueue.length} in queue)`;
    showToast(msg);

    // Pulse animation on queue button
    const queueBtn = document.getElementById("queueToggleBtn");
    if (queueBtn) {
      queueBtn.classList.remove("pulse-glow");
      void queueBtn.offsetWidth;
      queueBtn.classList.add("pulse-glow");
      setTimeout(() => queueBtn.classList.remove("pulse-glow"), 800);
    }
  }

  function removeFromQueue(queuePos, e) {
    if (e) e.stopPropagation();
    if (queuePos >= 0 && queuePos < userQueue.length) {
      const removedIdx = userQueue.splice(queuePos, 1)[0];
      saveUserQueue();
      updateQueueUI();
      const removedSong = songs[removedIdx];
      if (removedSong) {
        const title = currentLang === "en" ? (removedSong.nameEn || removedSong.name) : removedSong.name;
        showToast(`✕ Removed "${title}" from queue`);
      }
    }
  }

  function clearQueue() {
    if (userQueue.length === 0) {
      showToast("Queue is already empty");
      return;
    }
    userQueue = [];
    saveUserQueue();
    updateQueueUI();
    showToast("🗑️ Up Next queue cleared");
  }

  const queueModal = document.getElementById("queueModal");
  const queueBackdrop = document.getElementById("queueBackdrop");
  const queueToggleBtn = document.getElementById("queueToggleBtn");
  const queueCloseBtn = document.getElementById("queueCloseBtn");
  const queueClearBtn = document.getElementById("queueClearBtn");

  function openQueue() {
    if (queueModal) queueModal.classList.add("open");
    if (queueBackdrop) queueBackdrop.classList.add("open");
    updateQueueUI();
  }

  function closeQueue() {
    if (queueModal) queueModal.classList.remove("open");
    if (queueBackdrop) queueBackdrop.classList.remove("open");
  }

  function toggleQueue() {
    if (queueModal && queueModal.classList.contains("open")) {
      closeQueue();
    } else {
      openQueue();
    }
  }

  function renderQueueList() {
    const list = document.getElementById("queueList");
    const nowTitle = document.getElementById("queueNowTitle");
    const nowSinger = document.getElementById("queueNowSinger");

    const curSongObj = songs[currentSong];
    if (curSongObj) {
      const isEn = currentLang === "en";
      if (nowTitle) nowTitle.textContent = isEn ? (curSongObj.nameEn || curSongObj.name) : curSongObj.name;
      if (nowSinger) nowSinger.textContent = (isEn ? (curSongObj.singerEn || curSongObj.singer) : curSongObj.singer) || "Bollywood";
    }

    if (!list) return;
    list.innerHTML = "";

    if (userQueue.length === 0) {
      list.innerHTML = `
        <div class="queue-empty-state">
          <div class="queue-empty-icon">
            <svg viewBox="0 0 24 24" width="46" height="46" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.65; color:var(--accent-color, #f59e0b);">
              <path d="M3 6h18"/>
              <path d="M3 12h12"/>
              <path d="M3 18h8"/>
              <path d="M16 16l5 3-5 3v-6z" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="queue-empty-text">Your Up Next queue is empty</div>
          <div class="queue-empty-sub">Click the ➕ button on any song card or playlist item to line up your songs!</div>
        </div>
      `;
      return;
    }

    const isEn = currentLang === "en";
    userQueue.forEach((songIdx, pos) => {
      const s = songs[songIdx];
      if (!s) return;
      const title = isEn ? (s.nameEn || s.name) : s.name;
      const singer = (isEn ? (s.singerEn || s.singer) : s.singer) || "Bollywood";

      const item = document.createElement("div");
      item.className = "queue-item";
      item.setAttribute("role", "option");
      item.innerHTML = `
        <div class="queue-item-order">${pos + 1}</div>
        <div class="queue-item-info">
          <div class="queue-item-title">${title}</div>
          <div class="queue-item-singer">🎤 ${singer}</div>
        </div>
        <div class="queue-item-actions">
          <button class="queue-item-play-btn" type="button" title="Play Now" aria-label="Play ${title}">▶</button>
          <button class="queue-item-remove-btn" type="button" title="Remove from queue" aria-label="Remove ${title}">✕</button>
        </div>
      `;

      // Play now button
      const playBtn = item.querySelector(".queue-item-play-btn");
      if (playBtn) {
        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          userQueue.splice(pos, 1);
          saveUserQueue();
          updateQueueUI();
          playSong(songIdx);
        });
      }

      // Remove button
      const removeBtn = item.querySelector(".queue-item-remove-btn");
      if (removeBtn) {
        removeBtn.addEventListener("click", (e) => {
          removeFromQueue(pos, e);
        });
      }

      // Clicking on the item row plays it
      const infoDiv = item.querySelector(".queue-item-info");
      if (infoDiv) {
        infoDiv.addEventListener("click", () => {
          userQueue.splice(pos, 1);
          saveUserQueue();
          updateQueueUI();
          playSong(songIdx);
        });
      }

      list.appendChild(item);
    });
  }

  function playNext() {
    if (!songs.length) return;
    if (userQueue.length > 0) {
      const nextPos = userQueue.shift();
      saveUserQueue();
      updateQueueUI();
      playSong(nextPos);
      return;
    }
    if (isShuffle) {
      const randomPos = Math.floor(Math.random() * songs.length);
      playSong(randomPos);
      return;
    }
    const nextPos = (currentSong + 1) % songs.length;
    playSong(nextPos);
  }

  /* =========================================================
     5.1 SCREEN WAKE LOCK & BACKGROUND KEEPALIVE ENGINE
     ========================================================= */
  let wakeLockSentinel = null;
  let silentAudioKeeper = null;

  function initSilentAudioKeeper() {
    if (silentAudioKeeper) return;
    try {
      silentAudioKeeper = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFRm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      silentAudioKeeper.loop = true;
      silentAudioKeeper.volume = 0.001;
    } catch (e) {}
  }

  function startKeepAlive() {
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

  async function requestWakeLock() {
    if (hindiSleepTimerMode > 0) return; // Allow screen to turn off naturally when Sleep Timer is armed
    if ("wakeLock" in navigator && !wakeLockSentinel && document.visibilityState === "visible") {
      try {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
          wakeLockSentinel = null;
        });
      } catch (err) {
        // Handled silently for low battery/background tabs
      }
    }
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => {});
      wakeLockSentinel = null;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (hindiSleepTimerMode > 0) {
      checkHindiSleepTimerTick();
    }
    if (document.visibilityState === "visible") {
      updateLiveProgress();
      if ((activeAudioSource === "mp3" || activeAudioSource === "offline") && offlineAudio) {
        if (!offlineAudio.paused && !isPlaying) {
          setPlaybackState(true);
        } else if (offlineAudio.paused && isPlaying) {
          setPlaybackState(false);
        }
      } else if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.getPlayerState === "function") {
        const state = ytAudioPlayer.getPlayerState();
        if (state === 1 && !isPlaying) {
          setPlaybackState(true);
        } else if (state === 2 && isPlaying) {
          setPlaybackState(false);
        }
      }
      if (isPlaying) {
        requestWakeLock();
      }
    } else {
      if (isPlaying) {
        startKeepAlive();
      }
      if (MEDIA_SESSION_SUPPORTED) {
        try {
          navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
          const cur = getHindiActiveCurrentTime();
          const dur = getHindiActiveDuration();
          updateMediaSessionPosition(cur, dur);
        } catch (e) {}
      }
    }
  });

  window.addEventListener("pagehide", () => {
    releaseWakeLock();
    stopKeepAlive();
  });

  /* Background speculative preloader for smooth gapless track transitions */
  const bgPreloadAudio = document.getElementById("bgPreloadAudio") || (function() {
    const a = document.createElement("audio");
    a.id = "bgPreloadAudio";
    a.preload = "none";
    a.style.display = "none";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    return a;
  })();

  let lastPreloadedIdx = -1;
  function preloadNextTrack() {
    if (!songs || songs.length <= 1) return;
    const nextIdx = isShuffle ? -1 : ((currentSong + 1) % songs.length);
    if (nextIdx >= 0 && nextIdx !== lastPreloadedIdx && songs[nextIdx] && songs[nextIdx].file) {
      lastPreloadedIdx = nextIdx;
      try {
        bgPreloadAudio.src = songs[nextIdx].file;
        bgPreloadAudio.preload = "auto";
        bgPreloadAudio.load();
      } catch (e) {}

      // Cache Storage background pre-warm
      if ("caches" in window) {
        caches.open("chhath-media-cache-v2").then((cache) => {
          cache.match(songs[nextIdx].file).then((matched) => {
            if (!matched) {
              fetch(songs[nextIdx].file, { mode: "cors" }).then((res) => {
                if (res.ok) cache.put(songs[nextIdx].file, res);
              }).catch(() => {});
            }
          });
        }).catch(() => {});
      }
    }
  }

  /* Audio network recovery */
  let playbackRetryCount = 0;
  const MAX_PLAYBACK_RETRIES = 2;
  function handlePlaybackError(err) {
    console.warn("Background audio streaming error:", err);
    if (isPlaying && playbackRetryCount < MAX_PLAYBACK_RETRIES) {
      playbackRetryCount++;
      setTimeout(() => {
        if (offlineAudio && songs[currentSong] && songs[currentSong].file) {
          const savedPos = offlineAudio.currentTime;
          offlineAudio.src = songs[currentSong].file;
          offlineAudio.load();
          if (savedPos > 0) offlineAudio.currentTime = savedPos;
          offlineAudio.play().then(() => {
            playbackRetryCount = 0;
            setPlaybackState(true);
          }).catch(() => {});
        }
      }, 1000);
    } else {
      playbackRetryCount = 0;
      setPlaybackState(false);
      showToast(currentLang === "en" ? "⚠️ Audio error: skipping to next track..." : "⚠️ ऑडियो लोड नहीं हुआ। अगला गीत शुरू हो रहा है...");
      setTimeout(() => {
        playNext();
      }, 1500);
    }
  }

  if (offlineAudio) {
    offlineAudio.addEventListener("play", () => {
      if (!isPlaying) setPlaybackState(true);
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "playing"; } catch (e) {}
      }
      requestWakeLock();
      playbackRetryCount = 0;
    });

    offlineAudio.addEventListener("pause", () => {
      if (isPlaying) setPlaybackState(false);
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "paused"; } catch (e) {}
      }
      releaseWakeLock();
    });

    offlineAudio.addEventListener("loadstart", () => {
      if (isPlaying) setBufferingState(true);
    });

    offlineAudio.addEventListener("canplay", () => {
      setBufferingState(false);
    });

    offlineAudio.addEventListener("playing", () => {
      setBufferingState(false);
      if (!isPlaying) setPlaybackState(true);
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "playing"; } catch (e) {}
      }
      playbackRetryCount = 0;
      updateLiveProgress();
      updateHindiTabTitle();
    });

    offlineAudio.addEventListener("waiting", () => {
      setBufferingState(true);
    });

    offlineAudio.addEventListener("stalled", () => {
      setBufferingState(true);
    });

    offlineAudio.addEventListener("timeupdate", () => {
      updateLiveProgress();
      if (offlineAudio.duration) {
        const cur = offlineAudio.currentTime;
        const dur = offlineAudio.duration;
        if (cur / dur > 0.75 || dur - cur < 25) {
          preloadNextTrack();
        }
        // Smooth crossfade near track end (last 1.8s)
        if (!songCrossfadeTriggered && isCrossfadeEnabled && dur > 15 && (dur - cur) <= 1.8 && (dur - cur) > 0.3 && repeatMode !== 2) {
          songCrossfadeTriggered = true;
          fadeHindiVolumeDown(1400, () => {
            playNext();
          });
        }
      }
    });

    offlineAudio.addEventListener("durationchange", () => {
      updateLiveProgress();
      updateMediaSessionPosition(offlineAudio.currentTime, offlineAudio.duration);
    });

    offlineAudio.addEventListener("ratechange", () => {
      updateMediaSessionPosition(offlineAudio.currentTime, offlineAudio.duration);
    });

    offlineAudio.addEventListener("error", handlePlaybackError);

    offlineAudio.addEventListener("ended", () => {
      try { localStorage.setItem("hindi_player_last_pos", "0"); } catch (e) {}
      lastPreloadedIdx = -1;
      if (hindiSleepTimerMode === -1) {
        hindiSleepTimerMode = 0;
        const badge = document.getElementById("hindiSleepBadge");
        if (badge) badge.style.display = "none";
        if (hindiSleepTimerBtn) hindiSleepTimerBtn.classList.remove("active");
        setPlaybackState(false);
        updateHindiTabTitle();
        return;
      }
      if (repeatMode === 2) {
        // Repeat One
        offlineAudio.currentTime = 0;
        offlineAudio.play().catch(console.warn);
      } else if (repeatMode === 1) {
        // Repeat All
        playNext();
      } else {
        // Normal next
        if (userQueue.length > 0 || currentSong < songs.length - 1) {
          playNext();
        } else {
          setPlaybackState(false);
          if (MEDIA_SESSION_SUPPORTED) {
            try { navigator.mediaSession.playbackState = "none"; } catch (e) {}
          }
        }
      }
    });
  }

  window.addEventListener("online", () => {
    if (isPlaying) {
      if ((activeAudioSource === "mp3" || activeAudioSource === "offline") && offlineAudio) {
        if (offlineAudio.paused) {
          offlineAudio.play().catch(() => {});
        }
      } else if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.playVideo === "function") {
        ytAudioPlayer.playVideo();
      }
      updateHindiTabTitle();
    }
  });

  function setPlaybackState(playing) {
    isPlaying = playing;
    if (typeof checkHindiSleepTimerTick === "function") {
      checkHindiSleepTimerTick();
    }
    if (playing) {
      if (playIcon) playIcon.textContent = "❚❚";
      if (miniPlayBtn) miniPlayBtn.textContent = "❚❚";
      if (albumCover) albumCover.classList.add("spinning");
      if (miniCover) miniCover.classList.add("spinning");
      if (playerElem) playerElem.classList.add("playing");
      startProgressSync();
      startKeepAlive();
      requestWakeLock();
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "playing"; } catch (e) {}
      }
    } else {
      if (playIcon) playIcon.textContent = "▶";
      if (miniPlayBtn) miniPlayBtn.textContent = "▶";
      if (albumCover) albumCover.classList.remove("spinning");
      if (miniCover) miniCover.classList.remove("spinning");
      if (playerElem) playerElem.classList.remove("playing");
      stopProgressSync();
      stopKeepAlive();
      releaseWakeLock();
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "paused"; } catch (e) {}
      }
    }
    renderPlaylist(playlistSearch ? playlistSearch.value : "");
    updateCardPlayingState();
    updateMediaSessionMetadata();
    updateHindiTabTitle();
  }

  function startProgressSync() {
    stopProgressSync();
    progressInterval = setInterval(updateLiveProgress, 250);
  }

  function stopProgressSync() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
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

  function getHindiActiveDuration() {
    if (activeAudioSource === "youtube") {
      let dur = (ytAudioPlayer && typeof ytAudioPlayer.getDuration === "function") ? (ytAudioPlayer.getDuration() || 0) : 0;
      if (!dur || dur <= 0 || isNaN(dur)) {
        dur = parseDurationToSec(songs[currentSong]?.duration);
      }
      return dur > 0 ? dur : 225;
    }
    const dur = offlineAudio ? offlineAudio.duration || 0 : 0;
    if (!dur || dur <= 0 || isNaN(dur)) {
      return parseDurationToSec(songs[currentSong]?.duration) || 225;
    }
    return dur;
  }

  function getHindiActiveCurrentTime() {
    if (activeAudioSource === "youtube") {
      if (ytAudioPlayer && typeof ytAudioPlayer.getCurrentTime === "function") {
        try { return ytAudioPlayer.getCurrentTime() || 0; } catch (e) {}
      }
      return 0;
    }
    return offlineAudio ? offlineAudio.currentTime || 0 : 0;
  }

  function updateLiveProgress() {
    if (typeof checkHindiSleepTimerTick === "function") {
      checkHindiSleepTimerTick();
    }
    if (isSeeking) return;

    if (activeAudioSource === "youtube") {
      if (ytAudioPlayer && typeof ytAudioPlayer.getCurrentTime === "function") {
        try {
          const cur = ytAudioPlayer.getCurrentTime() || 0;
          const dur = getHindiActiveDuration();
          if (dur > 0) {
            const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
            if (progress) progress.value = pct;
            if (progressFill) progressFill.style.width = `${pct}%`;
            if (totalTime) totalTime.textContent = formatTime(dur);
          }
          if (currentTime) currentTime.textContent = formatTime(cur);
          updateMediaSessionPosition(cur, dur);
        } catch (e) {}
      }
      return;
    }

    if (!offlineAudio) return;
    const dur = getHindiActiveDuration();
    const cur = offlineAudio.currentTime || 0;

    if (dur > 0) {
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      if (progress) progress.value = pct;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (totalTime) totalTime.textContent = formatTime(dur);
      const miniFill = document.getElementById("miniProgressFill");
      if (miniFill) miniFill.style.width = `${pct}%`;
    }
    if (currentTime) currentTime.textContent = formatTime(cur);
    updateMediaSessionPosition(cur, dur);

    // Save playback position periodically
    try {
      if (cur > 1 && dur > 5 && cur < dur - 2) {
        localStorage.setItem("hindi_player_last_pos", cur.toFixed(1));
      }
    } catch (e) {}
  }

  /* Seek interactions */
  if (progress) {
    const handleSeekInput = () => {
      isSeeking = true;
      if (seekDebounceTimeout) clearTimeout(seekDebounceTimeout);
      const dur = getHindiActiveDuration();
      const pct = parseFloat(progress.value) || 0;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (currentTime && dur > 0) {
        currentTime.textContent = formatTime((pct / 100) * dur);
      }
    };

    const handleSeekCommit = () => {
      const pct = parseFloat(progress.value) || 0;
      const dur = getHindiActiveDuration();
      if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.getDuration === "function") {
        try {
          if (dur > 0) {
            const targetSec = (pct / 100) * dur;
            ytAudioPlayer.seekTo(targetSec, true);
            if (currentTime) currentTime.textContent = formatTime(targetSec);
          }
        } catch (e) {}
        isSeeking = false;
        return;
      }

      if (dur > 0 && offlineAudio) {
        const targetSec = (pct / 100) * dur;
        try {
          if ("fastSeek" in offlineAudio) {
            offlineAudio.fastSeek(targetSec);
          } else {
            offlineAudio.currentTime = targetSec;
          }
        } catch (e) {
          offlineAudio.currentTime = targetSec;
        }
        if (currentTime) currentTime.textContent = formatTime(targetSec);
      }
      isSeeking = false;
    };

    progress.addEventListener("input", handleSeekInput);
    progress.addEventListener("change", handleSeekCommit);
    progress.addEventListener("mouseup", handleSeekCommit);
    progress.addEventListener("touchend", handleSeekCommit);
    progress.addEventListener("touchcancel", handleSeekCommit);
  }

  /* Shuffle & Repeat Modes */
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle("active", isShuffle);
      shuffleBtn.title = isShuffle ? "Shuffle Mode: ON (S)" : "Shuffle Mode: OFF (S)";
      const t = i18n.en;
      showToast(isShuffle ? t.toastShuffleOn : t.toastShuffleOff);
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      repeatMode = (repeatMode + 1) % 3;
      const t = i18n.en;
      if (repeatMode === 0) {
        repeatBtn.innerHTML = REPEAT_OFF_ICON;
        repeatBtn.classList.remove("active");
        repeatBtn.title = "Repeat Mode: Off (R)";
        showToast(t.toastRepeatOff);
      } else if (repeatMode === 1) {
        repeatBtn.innerHTML = REPEAT_ALL_ICON;
        repeatBtn.classList.add("active");
        repeatBtn.title = "Repeat Mode: Repeat All (R)";
        showToast(t.toastRepeatAll);
      } else {
        repeatBtn.innerHTML = REPEAT_ONE_ICON;
        repeatBtn.classList.add("active");
        repeatBtn.title = "Repeat Mode: Repeat One (R)";
        showToast(t.toastRepeatOne);
      }
    });
  }

  if (playerFavBtn) {
    playerFavBtn.addEventListener("click", () => {
      const curSongObj = songs[currentSong];
      if (curSongObj) toggleSongFavorite(curSongObj.id);
    });
  }

  if (miniFavBtn) {
    miniFavBtn.addEventListener("click", () => {
      const curSongObj = songs[currentSong];
      if (curSongObj) toggleSongFavorite(curSongObj.id);
    });
  }

    /* Initialize and Restore Saved Volume State */
  function initVolumeState() {
    try {
      const savedVolStr = localStorage.getItem("playx_volume") || localStorage.getItem("hindi_player_volume");
      const savedMuted = localStorage.getItem("hindi_player_muted") === "1";

      let vol = 100;
      if (savedVolStr !== null) {
        const parsed = parseInt(savedVolStr, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          vol = parsed;
        }
      }

      if (savedMuted || vol === 0) {
        if (volumeSlider) volumeSlider.value = 0;
        if (offlineAudio) offlineAudio.volume = 0;
        if (muteBtn) muteBtn.innerHTML = VOL_MUTE_ICON;
        lastVolume = vol > 0 ? vol / 100 : 1;
      } else {
        if (volumeSlider) volumeSlider.value = vol;
        if (offlineAudio) offlineAudio.volume = vol / 100;
        if (muteBtn) muteBtn.innerHTML = VOL_HIGH_ICON;
        lastVolume = vol / 100;
      }
    } catch (e) {
      console.warn("Volume state init notice:", e);
    }
  }

  
  /* =========================================================
     SMOOTH AUDIO CROSSFADE ENGINE
     ========================================================= */
  let isCrossfadeEnabled = true;
  try {
    const savedCrossfade = localStorage.getItem("hindi_player_crossfade");
    if (savedCrossfade !== null) {
      isCrossfadeEnabled = savedCrossfade === "1";
    }
  } catch (e) {}

  let isCrossfading = false;
  let songCrossfadeTriggered = false;

  function toggleCrossfade() {
    isCrossfadeEnabled = !isCrossfadeEnabled;
    try {
      localStorage.setItem("hindi_player_crossfade", isCrossfadeEnabled ? "1" : "0");
    } catch (e) {}
    updateCrossfadeUI();
    showToast(isCrossfadeEnabled ? "🌊 Smooth Crossfade: ON" : "➡️ Smooth Crossfade: OFF");
  }

  function updateCrossfadeUI() {
    const crossfadeBtn = document.getElementById("crossfadeBtn");
    if (crossfadeBtn) {
      crossfadeBtn.classList.toggle("active", isCrossfadeEnabled);
      crossfadeBtn.title = isCrossfadeEnabled
        ? "Crossfade: Smooth Transition (Active)"
        : "Crossfade: Smooth Transition (Off)";
    }
  }

  
  /* Keyboard Volume & Modal Helpers */
  function adjustVolumeDelta(delta) {
    if (!volumeSlider) return;
    let currentVol = parseInt(volumeSlider.value, 10);
    if (isNaN(currentVol)) currentVol = 100;
    let newVol = Math.max(0, Math.min(100, currentVol + delta));
    volumeSlider.value = newVol;
    if (offlineAudio) offlineAudio.volume = newVol / 100;
    if (ytAudioPlayer && typeof ytAudioPlayer.setVolume === "function") {
      try { ytAudioPlayer.setVolume(newVol); } catch (e) {}
    }
    if (muteBtn) muteBtn.innerHTML = newVol === 0 ? VOL_MUTE_ICON : VOL_HIGH_ICON;
    try {
      localStorage.setItem("playx_volume", newVol.toString());
      localStorage.setItem("hindi_player_volume", newVol.toString());
      localStorage.setItem("hindi_player_muted", newVol === 0 ? "1" : "0");
    } catch (e) {}
    showToast(`🔊 Volume: ${newVol}%`);
  }

  function toggleShortcuts() {
    if (shortcutsModal && shortcutsModal.classList.contains("open")) {
      closeShortcuts();
    } else {
      openShortcuts();
    }
  }

  /* Volume & Mute Controls */
  
  /* Premium Vector SVG Icons for Mode Controls */
  const SHUFFLE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mode-svg"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`;
  const REPEAT_OFF_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mode-svg"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
  const REPEAT_ALL_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="mode-svg"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`;
  const REPEAT_ONE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mode-svg"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/><text x="12" y="15" font-size="8.5" font-weight="900" fill="currentColor" stroke="none" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif">1</text></svg>`;
  const QUEUE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mode-svg"><path d="M3 6h18"/><path d="M3 12h12"/><path d="M3 18h8"/><path d="M16 16l5 3-5 3v-6z" fill="currentColor" stroke="none"/></svg>`;

  const VOL_HIGH_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M13.5 9.5C14.3 10.3 14.8 11.1 14.8 12s-.5 1.7-1.3 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 7.5C17.9 8.9 18.7 10.4 18.7 12s-.8 3.1-2.2 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const VOL_MUTE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      const volNum = parseInt(volumeSlider.value, 10);
      if (offlineAudio) offlineAudio.volume = volNum / 100;
      if (ytAudioPlayer && typeof ytAudioPlayer.setVolume === "function") {
        try { ytAudioPlayer.setVolume(volNum); } catch (e) {}
      }
      if (muteBtn) muteBtn.innerHTML = volNum === 0 ? VOL_MUTE_ICON : VOL_HIGH_ICON;
      try {
        localStorage.setItem("playx_volume", volNum.toString());
        localStorage.setItem("hindi_player_volume", volNum.toString());
        localStorage.setItem("hindi_player_muted", volNum === 0 ? "1" : "0");
      } catch (e) {}
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      const isMuted = activeAudioSource === "youtube"
        ? (ytAudioPlayer && typeof ytAudioPlayer.isMuted === "function" ? ytAudioPlayer.isMuted() : false)
        : (offlineAudio ? offlineAudio.volume === 0 : false);
      const t = i18n.en;
      if (isMuted) {
        const targetVol = lastVolume > 0 ? Math.round(lastVolume * 100) : 100;
        if (offlineAudio) offlineAudio.volume = targetVol / 100;
        if (ytAudioPlayer && typeof ytAudioPlayer.unMute === "function") {
          try { ytAudioPlayer.unMute(); ytAudioPlayer.setVolume(targetVol); } catch (e) {}
        }
        if (volumeSlider) volumeSlider.value = targetVol;
        muteBtn.innerHTML = VOL_HIGH_ICON;
        try {
          localStorage.setItem("playx_volume", targetVol.toString());
          localStorage.setItem("hindi_player_volume", targetVol.toString());
          localStorage.setItem("hindi_player_muted", "0");
        } catch (e) {}
        showToast(t.toastUnmuted);
      } else {
        const currentVol = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
        if (currentVol > 0) lastVolume = currentVol / 100;
        if (offlineAudio) offlineAudio.volume = 0;
        if (ytAudioPlayer && typeof ytAudioPlayer.mute === "function") {
          try { ytAudioPlayer.mute(); } catch (e) {}
        }
        if (volumeSlider) volumeSlider.value = 0;
        muteBtn.innerHTML = VOL_MUTE_ICON;
        try {
          localStorage.setItem("hindi_player_muted", "1");
        } catch (e) {}
        showToast(t.toastMuted);
      }
    });
  }

  /* Playback Speed Controller */
  function setPlaybackRate(r) {
    if (offlineAudio) offlineAudio.playbackRate = r;
    if (ytAudioPlayer && typeof ytAudioPlayer.setPlaybackRate === "function") {
      try { ytAudioPlayer.setPlaybackRate(r); } catch (e) {}
    }
    if (speedLabel) speedLabel.textContent = `${r}x`;
    if (speedMenuItems) {
      speedMenuItems.forEach(item => {
        const sp = parseFloat(item.getAttribute("data-speed"));
        if (Math.abs(sp - r) < 0.01) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }
    const t = i18n.en;
    showToast((t.toastSpeed || "⚡ Playback Speed: ") + `${r}x`);
  }

  if (speedBtn && speedDropdown) {
    speedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      speedDropdown.classList.toggle("open");
    });
  }

  if (speedMenuItems) {
    speedMenuItems.forEach(item => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const sp = parseFloat(item.getAttribute("data-speed"));
        if (!isNaN(sp)) setPlaybackRate(sp);
        if (speedDropdown) speedDropdown.classList.remove("open");
      });
    });
  }

  /* =========================================================
     6. FILTERING, SEARCH & SORTING
     ========================================================= */
  function getFilteredAndSortedSongs(query = "") {
    const q = query.trim().toLowerCase();
    const isEn = currentLang === "en";

    let list = songs.map((s, originalIdx) => ({ ...s, originalIdx })).filter(s => {
      // Filter by category
      if (selectedCategory === "favorites") {
        if (!likedSongs.has(s.id)) return false;
      } else if (selectedCategory === "downloads") {
        const key = window.OfflineManager ? window.OfflineManager.getSongKey(s) : s.file;
        if (!downloadedHindiSongs.has(key)) return false;
      } else if (selectedCategory !== "all" && s.category !== selectedCategory) {
        return false;
      }

      // Filter by search query
      if (!q) return true;
      const title = (s.name || "").toLowerCase();
      const titleEn = (s.nameEn || "").toLowerCase();
      const singer = (s.singer || "").toLowerCase();
      const singerEn = (s.singerEn || "").toLowerCase();
      const cat = (s.category || "").toLowerCase();

      return title.includes(q) || titleEn.includes(q) || singer.includes(q) || singerEn.includes(q) || cat.includes(q);
    });

    // Apply sorting
    if (currentSort === "title-asc") {
      list.sort((a, b) => (isEn ? (a.nameEn || a.name) : a.name).localeCompare(isEn ? (b.nameEn || b.name) : b.name));
    } else if (currentSort === "singer-asc") {
      list.sort((a, b) => (isEn ? (a.singerEn || a.singer) : a.singer).localeCompare(isEn ? (b.singerEn || b.singer) : b.singer));
    } else if (currentSort === "duration-desc") {
      const parseDur = (durStr) => {
        if (!durStr) return 0;
        const parts = durStr.split(":").map(Number);
        return (parts[0] || 0) * 60 + (parts[1] || 0);
      };
      list.sort((a, b) => parseDur(b.duration) - parseDur(a.duration));
    }

    return list;
  }

  /* Render Playlist Drawer */
  function renderPlaylist(query = "") {
    if (!playlistList) return;
    playlistList.innerHTML = "";

    const filtered = getFilteredAndSortedSongs(query);
    const isEn = currentLang === "en";
    const t = i18n.en;

    if (filtered.length === 0) {
      playlistList.innerHTML = `<div style="text-align:center;padding:30px 10px;color:var(--text-muted);font-size:14px;">${selectedCategory === "favorites" ? t.noFavsFound : t.noSongsFound}</div>`;
      return;
    }

    filtered.forEach((s) => {
      const item = document.createElement("div");
      item.className = "playlist-item" + (s.originalIdx === currentSong ? " active" : "");
      item.setAttribute("role", "option");

      const title = isEn ? (s.nameEn || s.name) : s.name;
      const singer = isEn ? (s.singerEn || s.singer) : s.singer;

      item.innerHTML = `
        <div class="item-num">${s.originalIdx === currentSong ? (isPlaying ? "❚❚" : "▶") : (s.id || s.originalIdx + 1)}</div>
        <div class="item-info">
          <div class="item-title">${title}</div>
          <div class="item-singer">🎤 ${singer} • <span style="opacity:0.7;">${s.category || "Bollywood"}</span></div>
        </div>
        <div class="item-actions" style="display:flex;align-items:center;gap:6px;">
          <div class="item-duration">${s.duration || "320K"}</div>
          <button class="item-queue-btn" type="button" title="Add to Up Next queue" aria-label="Add ${title} to queue">➕</button>
        </div>
      `;

      const qBtn = item.querySelector(".item-queue-btn");
      if (qBtn) {
        qBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          addToQueue(s.originalIdx);
        });
      }

      item.addEventListener("click", () => {
        playSong(s.originalIdx);
        closePlaylist();
      });

      playlistList.appendChild(item);
    });
  }

  /* =========================================================
     PROGRESSIVE LAZY BATCH RENDERING & EVENT DELEGATION
     ========================================================= */
  const GRID_PAGE_SIZE = 24; // 24 cards per batch (fills viewport smoothly without mobile DOM lag)
  let gridCurrentRenderedCount = 0;
  let gridCurrentFilteredList = [];
  let gridIntersectionObserver = null;
  let gridIsLoadingBatch = false;

  function createSongCardElement(s, isEn) {
    const card = document.createElement("div");
    const isCardPlaying = s.originalIdx === currentSong;
    card.className = "song-card" + (isCardPlaying ? " now-playing" : "");
    card.setAttribute("data-song-idx", s.originalIdx);
    card.setAttribute("data-song-id", s.id);

    const title = isEn ? (s.nameEn || s.name) : s.name;
    const singer = isEn ? (s.singerEn || s.singer) : s.singer;
    const isYtSong = Boolean(s.videoId || s.youtubeId || s.embedUrl);
    const isLiked = likedSongs.has(s.id);
    const songKey = window.OfflineManager ? window.OfflineManager.getSongKey(s) : s.file;
    const isDownloaded = !isYtSong && downloadedHindiSongs.has(songKey);

    const actionBtnHtml = isYtSong ? `
          <button class="song-card-video-btn" type="button" title="Play Video (Watch YouTube Video)" aria-label="Play Video for ${title}">
            <span>Play Video</span>
          </button>
    ` : `
          <button class="song-card-download-btn ${isDownloaded ? 'downloaded' : ''}" type="button" title="${isDownloaded ? 'Downloaded ✓' : 'Download for offline listening'}" aria-label="Download ${title}">
            ${isDownloaded ? '✓' : '↓'}
          </button>
    `;

    card.innerHTML = `
      <div class="song-card-header">
        <div class="card-number-badge">${s.originalIdx === currentSong && isPlaying ? "❚❚" : (s.id || s.originalIdx + 1)}</div>
        <div class="song-card-cat">${s.category || "Bollywood"}</div>
        <button class="card-like-btn ${isLiked ? 'liked' : ''}" type="button" data-fav-id="${s.id}" title="Favorite / Like">
          ${isLiked ? '❤️' : '🤍'}
        </button>
      </div>

      <div class="song-card-body">
        <div class="song-card-title">${title}</div>
        <div class="song-card-singer">🎤 ${singer}</div>
      </div>

      <div class="song-card-footer">
        <div class="song-card-duration">⏱️ ${s.duration || "320 Kbps"}</div>
        <div class="song-card-actions">
          <button class="song-card-queue-btn" type="button" title="Add to Up Next queue" aria-label="Add ${title} to queue">➕</button>
          ${actionBtnHtml}
          <button class="song-card-play-btn" type="button" aria-label="Play ${title}">
            <span>${isCardPlaying && isPlaying ? "❚❚" : "▶"}</span>
            <span>${isCardPlaying && isPlaying ? "Pause" : "Play"}</span>
          </button>
        </div>
      </div>
    `;

    return card;
  }

  function triggerAutoLoad() {
    if (gridIsLoadingBatch) return;
    if (gridCurrentRenderedCount >= gridCurrentFilteredList.length) {
      updateGridSentinel(false);
      return;
    }
    renderSongCardsBatch();
  }

  function renderSongCardsBatch() {
    if (gridIsLoadingBatch) return;
    const grid = document.getElementById("songsCardsGrid");
    if (!grid) return;

    const total = gridCurrentFilteredList.length;
    const startIndex = gridCurrentRenderedCount;

    if (startIndex >= total) {
      updateGridSentinel(false);
      return;
    }

    gridIsLoadingBatch = true;
    try {
      const isEn = currentLang === "en";
      const endIndex = Math.min(total, startIndex + GRID_PAGE_SIZE);

      const fragment = document.createDocumentFragment();
      for (let i = startIndex; i < endIndex; i++) {
        const s = gridCurrentFilteredList[i];
        if (s) {
          fragment.appendChild(createSongCardElement(s, isEn));
        }
      }
      grid.appendChild(fragment);
      gridCurrentRenderedCount = endIndex;

      // Update counter badge: "Showing X of Y Songs"
      if (gridCounterBadge) {
        const t = i18n.en;
        if (gridCurrentRenderedCount < total) {
          gridCounterBadge.textContent = `${t.showingSongsPrefix}${gridCurrentRenderedCount} / ${total}${t.songsSuffix}`;
        } else {
          gridCounterBadge.textContent = `${t.showingSongsPrefix}${total}${t.songsSuffix}`;
        }
      }

      // Attach / update sentinel if more items remain
      const hasMore = gridCurrentRenderedCount < total;
      updateGridSentinel(hasMore, total - gridCurrentRenderedCount);
    } finally {
      gridIsLoadingBatch = false;
    }

    // Check if sentinel is still in view / near viewport to auto-load next batch immediately
    requestAnimationFrame(() => {
      checkAndTriggerAutoLoad();
    });
  }

  function updateGridSentinel(hasMore, remainingCount = 0) {
    const gridSection = document.getElementById("songsGridSection");
    if (!gridSection) return;
    let sentinel = document.getElementById("gridInfiniteSentinel");

    if (!hasMore) {
      if (sentinel) {
        sentinel.style.display = "none";
      }
      if (gridIntersectionObserver) {
        gridIntersectionObserver.disconnect();
        gridIntersectionObserver = null;
      }
      return;
    }

    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "gridInfiniteSentinel";
      sentinel.className = "grid-infinite-sentinel";
      gridSection.appendChild(sentinel);
    }

    sentinel.style.display = "flex";
    sentinel.innerHTML = `
      <div class="sentinel-content">
        <span class="sentinel-spinner"></span>
        <span class="sentinel-text">Loading more songs... (${remainingCount} remaining)</span>
        <button type="button" class="sentinel-load-btn" id="btnManualLoadMore">Load More</button>
      </div>
    `;

    const loadBtn = sentinel.querySelector("#btnManualLoadMore");
    if (loadBtn) {
      loadBtn.addEventListener("click", () => {
        triggerAutoLoad();
      });
    }

    // Always re-attach observer to newly positioned/updated sentinel
    if (gridIntersectionObserver) {
      gridIntersectionObserver.disconnect();
      gridIntersectionObserver = null;
    }

    if ("IntersectionObserver" in window) {
      gridIntersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          triggerAutoLoad();
        }
      }, {
        root: null,
        rootMargin: "800px 0px 800px 0px", // Trigger 800px early before reaching bottom for seamless auto-load
        threshold: 0
      });
      gridIntersectionObserver.observe(sentinel);
    }
  }

  // Automatic Infinite Scroll triggers - works reliably across mobile & desktop browsers
  function checkAndTriggerAutoLoad() {
    if (gridIsLoadingBatch) return;
    if (gridCurrentRenderedCount >= gridCurrentFilteredList.length) return;
    const sentinel = document.getElementById("gridInfiniteSentinel");
    if (!sentinel || sentinel.style.display === "none") return;

    // Viewport-relative check via getBoundingClientRect
    const rect = sentinel.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
    if (rect.top <= viewportHeight + 700) {
      triggerAutoLoad();
    }
  }

  window.addEventListener("scroll", checkAndTriggerAutoLoad, { passive: true });
  window.addEventListener("touchmove", checkAndTriggerAutoLoad, { passive: true });
  window.addEventListener("wheel", checkAndTriggerAutoLoad, { passive: true });
  window.addEventListener("resize", checkAndTriggerAutoLoad, { passive: true });

  /* Render Song Cards Grid Section */
  function renderSongCardsGrid() {
    const grid = document.getElementById("songsCardsGrid");
    if (!grid) return;

    if (gridIntersectionObserver) {
      gridIntersectionObserver.disconnect();
      gridIntersectionObserver = null;
    }
    const oldSentinel = document.getElementById("gridInfiniteSentinel");
    if (oldSentinel) oldSentinel.style.display = "none";

    grid.innerHTML = "";
    gridCurrentRenderedCount = 0;

    const query = mainSearchInput ? mainSearchInput.value : "";
    gridCurrentFilteredList = getFilteredAndSortedSongs(query);
    const isEn = currentLang === "en";
    const t = i18n.en;

    if (gridCurrentFilteredList.length === 0) {
      if (gridCounterBadge) {
        gridCounterBadge.textContent = `${t.showingSongsPrefix}0${t.songsSuffix}`;
      }
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: var(--bg-surface); border: 1px dashed var(--border-medium); border-radius: 20px;">
          <div style="font-size: 38px; margin-bottom: 8px;">🎵</div>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">${selectedCategory === "favorites" ? t.noFavsFound : (selectedCategory === "downloads" ? (isEn ? "No downloaded songs found. Click ↓ on any song to listen offline!" : "कोई डाउनलोड किया हुआ गीत नहीं मिला। ऑफ़लाइन सुनने के लिए किसी गीत पर ↓ बटन दबाएं!") : t.noSongsFound)}</h3>
          <p style="color: var(--text-muted); font-size: 13.5px;">Try selecting 'All Songs' or searching with another keyword.</p>
        </div>
      `;
      return;
    }

    // Render initial batch (instant paint in <15ms!)
    renderSongCardsBatch();

    // Ensure event delegation is hooked
    initSongGridEventDelegation();
  }

  /* Event Delegation for Songs Grid (Replaces 840+ individual listeners with 1 efficient listener) */
  function initSongGridEventDelegation() {
    const grid = document.getElementById("songsCardsGrid");
    if (!grid || grid.dataset.delegated === "true") return;
    grid.dataset.delegated = "true";

    grid.addEventListener("click", async (e) => {
      const card = e.target.closest(".song-card");
      if (!card) return;

      const songIdx = parseInt(card.getAttribute("data-song-idx"), 10);
      const song = songs[songIdx];
      if (!song) return;

      // 1. Heart Like / Favorite
      const likeBtn = e.target.closest(".card-like-btn");
      if (likeBtn) {
        e.stopPropagation();
        toggleSongFavorite(song.id, e);
        const isNowLiked = likedSongs.has(song.id);
        likeBtn.classList.toggle("liked", isNowLiked);
        likeBtn.textContent = isNowLiked ? "❤️" : "🤍";
        return;
      }

      // 2. Queue Button
      const qBtn = e.target.closest(".song-card-queue-btn");
      if (qBtn) {
        e.stopPropagation();
        addToQueue(songIdx);
        return;
      }

      // 3. YouTube Play Video Button (Opens Embedded Video Player)
      const videoBtn = e.target.closest(".song-card-video-btn");
      if (videoBtn) {
        e.stopPropagation();
        openYouTubeVideoModal(song);
        return;
      }

      // 4. Download Button
      const dlBtn = e.target.closest(".song-card-download-btn");
      if (dlBtn) {
        e.stopPropagation();
        if (!window.OfflineManager) return;
        dlBtn.className = "song-card-download-btn downloading";
        dlBtn.textContent = "0%";
        showToast("Downloading: " + (song.name || "Song"));

        try {
          await window.OfflineManager.downloadSong(song, (prog) => {
            if (prog.percent >= 0) {
              dlBtn.textContent = `${prog.percent}%`;
            } else {
              dlBtn.textContent = "⏳";
            }
          });
          dlBtn.className = "song-card-download-btn downloaded";
          dlBtn.textContent = "✓";
          dlBtn.title = "Downloaded ✓";
          showToast("Downloaded for offline listening ✓");
          await refreshDownloadedHindiSongs();
          renderSongCardsGrid();
        } catch (err) {
          console.error("Download failed:", err);
          dlBtn.className = "song-card-download-btn";
          dlBtn.textContent = "↓";
          showToast("Download failed. Please try again.");
        }
        return;
      }

      // 5. Play / Pause Button or Card body click
      if (songIdx === currentSong && isPlaying) {
        togglePlayback();
      } else {
        playSong(songIdx);
      }
    });
  }

  /* =========================================================
     YOUTUBE EMBED VIDEO MODAL ENGINE (PLAY VIDEO)
     ========================================================= */
  function openYouTubeVideoModal(song) {
    if (!song) return;
    const videoId = song.videoId || song.youtubeId || (song.embedUrl ? song.embedUrl.split("/").pop().split("?")[0] : "");
    if (!videoId) {
      showToast("Video not available for this song");
      return;
    }

    // Pause audio playback if currently active so audio does not overlap with video
    if (isPlaying) {
      togglePlayback();
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
              <span class="video-modal-badge">🎬 YouTube HD Video</span>
              <h3 class="playx-video-modal-title" id="playxVideoModalTitle"></h3>
              <p class="playx-video-modal-artist" id="playxVideoModalArtist"></p>
            </div>
            <button class="playx-video-modal-close" id="playxVideoModalClose" type="button" title="Close Video" aria-label="Close Video">✕</button>
          </div>
          <div class="playx-video-modal-player-wrap">
            <iframe
              id="playxVideoModalIframe"
              src=""
              title="YouTube Video Player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen>
            </iframe>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      const closeBtn = modal.querySelector("#playxVideoModalClose");
      if (closeBtn) {
        closeBtn.addEventListener("click", closeYouTubeVideoModal);
      }

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeYouTubeVideoModal();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("active")) {
          closeYouTubeVideoModal();
        }
      });
    }

    const isEn = currentLang === "en";
    const songTitle = isEn ? (song.nameEn || song.name) : song.name;
    const songSinger = isEn ? (song.singerEn || song.singer) : song.singer;

    const titleEl = modal.querySelector("#playxVideoModalTitle");
    const artistEl = modal.querySelector("#playxVideoModalArtist");
    const iframe = modal.querySelector("#playxVideoModalIframe");

    if (titleEl) titleEl.textContent = songTitle;
    if (artistEl) artistEl.textContent = "🎤 " + (songSinger || "Bollywood Hit");

    const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
    const embedSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&origin=${encodeURIComponent(origin)}`;
    if (iframe) {
      iframe.src = embedSrc;
    }

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeYouTubeVideoModal() {
    const modal = document.getElementById("playxVideoModal");
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";

    const iframe = modal.querySelector("#playxVideoModalIframe");
    if (iframe) {
      iframe.src = "";
    }
  }

  window.openYouTubeVideoModal = openYouTubeVideoModal;
  window.closeYouTubeVideoModal = closeYouTubeVideoModal;

  /* Real-Time Card Active State Update (Zero DOM Re-rendering) */
  function updateCardPlayingState() {
    const cards = document.querySelectorAll("#songsCardsGrid .song-card");
    cards.forEach(card => {
      const idx = parseInt(card.getAttribute("data-song-idx"), 10);
      const isCardActive = idx === currentSong;
      card.classList.toggle("now-playing", isCardActive);

      const numBadge = card.querySelector(".card-number-badge");
      const playBtnSpan = card.querySelector(".song-card-play-btn span:first-child");
      const playBtnLabel = card.querySelector(".song-card-play-btn span:last-child");

      if (isCardActive) {
        if (numBadge) numBadge.textContent = isPlaying ? "❚❚" : "▶";
        if (playBtnSpan) playBtnSpan.textContent = isPlaying ? "❚❚" : "▶";
        if (playBtnLabel) playBtnLabel.textContent = isPlaying ? "Pause" : "Play";
      } else {
        const originalId = card.getAttribute("data-song-id") || (idx + 1);
        if (numBadge) numBadge.textContent = originalId;
        if (playBtnSpan) playBtnSpan.textContent = "▶";
        if (playBtnLabel) playBtnLabel.textContent = "Play";
      }
    });
  }

  /* Category chips listener */
  if (categoryChips) {
    categoryChips.forEach(chip => {
      chip.addEventListener("click", () => {
        const cat = chip.getAttribute("data-cat") || "all";
        selectCategory(cat);
      });
    });
  }

  /* Search input listener with smooth 180ms debounce */
  let searchDebounceTimer = null;
  if (mainSearchInput) {
    mainSearchInput.addEventListener("input", (e) => {
      const q = e.target.value;
      if (mainSearchClearBtn) mainSearchClearBtn.style.display = q ? "flex" : "none";
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        renderSongCardsGrid();
      }, 180);
    });
  }

  if (mainSearchClearBtn) {
    mainSearchClearBtn.addEventListener("click", () => {
      if (mainSearchInput) {
        mainSearchInput.value = "";
        mainSearchClearBtn.style.display = "none";
        renderSongCardsGrid();
      }
    });
  }

  /* Sorting change listener */
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      renderSongCardsGrid();
      renderPlaylist(playlistSearch ? playlistSearch.value : "");
    });
  }

  /* =========================================================
     7. STICKY FLOATING BOTTOM MINI-PLAYER
     ========================================================= */
  window.addEventListener("scroll", () => {
    if (!miniPlayerDock) return;
    if (window.scrollY > 340) {
      miniPlayerDock.classList.add("visible");
    } else {
      miniPlayerDock.classList.remove("visible");
    }
  }, { passive: true });

  if (miniSongCluster) {
    miniSongCluster.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (miniPlayBtn) miniPlayBtn.addEventListener("click", togglePlayback);
  if (miniPrevBtn) miniPrevBtn.addEventListener("click", playPrevious);
  if (miniNextBtn) miniNextBtn.addEventListener("click", playNext);

  /* =========================================================
     8. PLAYLIST DRAWER MODAL
     ========================================================= */
  function openPlaylist() {
    if (playlistModal) playlistModal.classList.add("open");
    if (playlistBackdrop) playlistBackdrop.classList.add("open");
    if (playlistSearch) {
      setTimeout(() => playlistSearch.focus(), 150);
    }
  }

  function closePlaylist() {
    if (playlistModal) playlistModal.classList.remove("open");
    if (playlistBackdrop) playlistBackdrop.classList.remove("open");
  }

  if (playlistToggleBtn) {
    playlistToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openPlaylist();
    });
  }

  if (playlistCloseBtn) playlistCloseBtn.addEventListener("click", closePlaylist);
  if (playlistBackdrop) playlistBackdrop.addEventListener("click", closePlaylist);

  if (playlistSearch) {
    playlistSearch.addEventListener("input", (e) => {
      renderPlaylist(e.target.value);
    });
  }

  /* =========================================================
     9. KEYBOARD SHORTCUTS MODAL
     ========================================================= */
  function openShortcuts() {
    if (shortcutsModal) shortcutsModal.classList.add("open");
    if (playlistBackdrop) playlistBackdrop.classList.add("open");
  }

  function closeShortcuts() {
    if (shortcutsModal) shortcutsModal.classList.remove("open");
    if (playlistBackdrop && !playlistModal.classList.contains("open")) {
      playlistBackdrop.classList.remove("open");
    }
  }

  if (shortcutsBtn) shortcutsBtn.addEventListener("click", openShortcuts);
  if (shortcutsCloseBtn) shortcutsCloseBtn.addEventListener("click", closeShortcuts);

  /* =========================================================
     10. BILINGUAL LANGUAGE TOGGLE
     ========================================================= */
  function setLanguage(lang, showToastMsg = false) {
    if (!i18n[lang]) return;
    currentLang = lang;
    localStorage.setItem("playx_lang", lang);
    const t = i18n[lang];

    document.documentElement.lang = currentLang;

    if (langToggleBtn) {
      langToggleBtn.setAttribute("data-lang", lang);
      langToggleBtn.title = t.langBtnTitle;
      langToggleBtn.setAttribute("aria-label", t.langBtnAria);
    }
    if (langText) langText.textContent = t.langBtnText;

    const navBackText = document.getElementById("navBackText");
    const navBackBtn = document.getElementById("navBackBtn");
    if (navBackText) navBackText.textContent = t.navBackText;
    if (navBackBtn && t.navBackTitle) navBackBtn.title = t.navBackTitle;

    const heroBadge = document.getElementById("heroBadge");
    if (heroBadge) heroBadge.textContent = t.heroBadge.replace(/\d+/, songs.length);

    const mainLogo = document.getElementById("mainLogoText");
    if (mainLogo) {
      mainLogo.innerHTML = `<span class="main-title-gradient">${t.mainLogoTitle1}</span> ${t.mainLogoTitle2}`;
    }

    const shareBtnLabel = document.getElementById("shareBtnLabel");
    if (shareBtnLabel && t.shareBtnLabel) shareBtnLabel.textContent = t.shareBtnLabel;

    const shareMainBtn = document.getElementById("shareMainBtn");
    if (shareMainBtn && t.shareBtnTitle) shareMainBtn.title = t.shareBtnTitle;

    const whatsappShareText = document.getElementById("whatsappShareText");
    if (whatsappShareText && t.whatsappLabel) whatsappShareText.textContent = t.whatsappLabel;

    const facebookShareText = document.getElementById("facebookShareText");
    if (facebookShareText && t.facebookLabel) facebookShareText.textContent = t.facebookLabel;

    const instagramShareText = document.getElementById("instagramShareText");
    if (instagramShareText && t.instagramLabel) instagramShareText.textContent = t.instagramLabel;

    const copyLinkText = document.getElementById("copyLinkText");
    if (copyLinkText && t.copyLinkText) copyLinkText.textContent = t.copyLinkText;

    if (prevBtn && t.prevSongTitle) prevBtn.title = t.prevSongTitle;
    if (playButton && t.playBtnTitle) playButton.title = t.playBtnTitle;
    if (nextBtn && t.nextSongTitle) nextBtn.title = t.nextSongTitle;
    if (muteBtn && t.muteBtnTitle) muteBtn.title = t.muteBtnTitle;
    if (speedBtn && t.speedBtnTitle) speedBtn.title = t.speedBtnTitle;
    if (volumeSlider && t.volumeSliderTitle) volumeSlider.title = t.volumeSliderTitle;
    if (progress && t.seekSliderTitle) progress.title = t.seekSliderTitle;
    if (playlistToggleBtn && t.playlistBtnTitle) playlistToggleBtn.title = t.playlistBtnTitle;
    if (playlistCloseBtn && t.playlistCloseTitle) playlistCloseBtn.title = t.playlistCloseTitle;

    if (taglineText) taglineText.textContent = t.taglineText;
    if (gridTitleText) gridTitleText.textContent = t.gridTitleText;
    if (mainSearchInput) mainSearchInput.placeholder = t.searchPlaceholder.replace(/\d+/, songs.length);
    if (playlistSearch) playlistSearch.placeholder = t.playlistSearchPlaceholder;

    displaySongInfo(currentSong);
    renderPlaylist(playlistSearch ? playlistSearch.value : "");
    renderSongCardsGrid();
    updateClock();

    if (showToastMsg) {
      showToast(t.toastLangSwitched);
    }
  }

  if (langToggleBtn) {
    // Language toggle disabled for English-only mode
    /* langToggleBtn.addEventListener("click", () => {
      const next = currentLang === "en" ? "hi" : "en";
      setLanguage(next, true);
    }); */
  }
  setLanguage(currentLang, false);

  /* Player button event listeners */
  if (playButton) playButton.addEventListener("click", togglePlayback);
  if (prevBtn) prevBtn.addEventListener("click", playPrevious);
  if (nextBtn) nextBtn.addEventListener("click", playNext);

  /* =========================================================
     11. ADVANCED MEDIA SESSION API & SYSTEM CONTROLS
     ========================================================= */
  const MEDIA_SESSION_SUPPORTED = typeof navigator !== "undefined" && "mediaSession" in navigator;

  function getArtworkList(s) {
    const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    const makeUrl = (rel) => new URL(rel, origin + basePath).href;

    const list = [];
    const vid = s ? (s.videoId || s.youtubeId) : "";
    if (s && s.image) {
      list.push({ src: s.image.startsWith("http") ? s.image : makeUrl(s.image), sizes: "512x512", type: "image/jpeg" });
    } else if (vid) {
      list.push(
        { src: `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg`, sizes: "1280x720", type: "image/jpeg" },
        { src: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, sizes: "480x360", type: "image/jpeg" }
      );
    }
    list.push(
      { src: makeUrl("images/hindi_song_icon.png"), sizes: "512x512", type: "image/png" },
      { src: makeUrl("favicon.io/hindi-icon-512x512.png"), sizes: "512x512", type: "image/png" },
      { src: makeUrl("favicon.io/hindi-icon-192x192.png"), sizes: "192x192", type: "image/png" },
      { src: makeUrl("favicon.io/hindi-icon-32x32.png"), sizes: "32x32", type: "image/png" }
    );
    return list;
  }

  function updateMediaSessionPosition(pos = 0, dur = 0) {
    if (!MEDIA_SESSION_SUPPORTED || !("setPositionState" in navigator.mediaSession)) return;
    if (!isFinite(dur) || dur <= 0 || !isFinite(pos) || pos < 0) return;
    const rate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
    try {
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: rate,
        position: Math.min(pos, dur)
      });
    } catch (e) { }
  }

  function updateMediaSessionMetadata() {
    if (!MEDIA_SESSION_SUPPORTED || !songs[currentSong]) return;
    try {
      const s = songs[currentSong];
      const isEn = currentLang === "en";
      const title = isEn ? (s.nameEn || s.name) : s.name;
      const singer = isEn ? (s.singerEn || s.singer) : s.singer;
      const albumName = "Superhit Bollywood Classics";

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: singer || "Bollywood Singer",
        album: albumName,
        artwork: getArtworkList(s)
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch (e) { }
  }

  function initMediaSessionHandlers() {
    if (!MEDIA_SESSION_SUPPORTED) return;

    const actionHandlers = [
      ["play", () => {
        if (!isPlaying) togglePlayback();
      }],
      ["pause", () => {
        if (isPlaying) togglePlayback();
      }],
      ["previoustrack", () => {
        playPrevious();
      }],
      ["nexttrack", () => {
        playNext();
      }],
      ["seekto", (details) => {
        if (details.seekTime !== undefined && isFinite(details.seekTime)) {
          const target = details.seekTime;
          if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.seekTo === "function") {
            ytAudioPlayer.seekTo(target, true);
          } else if (offlineAudio) {
            if (details.fastSeek && ("fastSeek" in offlineAudio)) {
              offlineAudio.fastSeek(target);
            } else {
              offlineAudio.currentTime = target;
            }
          }
          updateLiveProgress();
          updateMediaSessionPosition(target, getHindiActiveDuration());
        }
      }],
      ["seekbackward", (details) => {
        const skip = details.seekOffset || 10;
        const cur = getHindiActiveCurrentTime();
        const target = Math.max(0, cur - skip);
        if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.seekTo === "function") {
          ytAudioPlayer.seekTo(target, true);
        } else if (offlineAudio) {
          offlineAudio.currentTime = target;
        }
        updateLiveProgress();
        updateMediaSessionPosition(target, getHindiActiveDuration());
      }],
      ["seekforward", (details) => {
        const skip = details.seekOffset || 10;
        const cur = getHindiActiveCurrentTime();
        const dur = getHindiActiveDuration();
        const target = Math.min(dur || 9999, cur + skip);
        if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.seekTo === "function") {
          ytAudioPlayer.seekTo(target, true);
        } else if (offlineAudio) {
          offlineAudio.currentTime = target;
        }
        updateLiveProgress();
        updateMediaSessionPosition(target, dur);
      }],
      ["stop", () => {
        if (offlineAudio) {
          offlineAudio.pause();
          offlineAudio.currentTime = 0;
        }
        if (activeAudioSource === "youtube" && ytAudioPlayer && typeof ytAudioPlayer.pauseVideo === "function") {
          ytAudioPlayer.pauseVideo();
        }
        setPlaybackState(false);
        if (MEDIA_SESSION_SUPPORTED) {
          try {
            navigator.mediaSession.playbackState = "none";
          } catch (e) {}
        }
      }]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (err) {
        console.debug(`Media Session action '${action}' not supported:`, err);
      }
    }
  }

  initMediaSessionHandlers();

  window.addEventListener("keydown", (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (activeTag === "input" || activeTag === "textarea") {
      if (e.key === "Escape") {
        closePlaylist();
        closeShortcuts();
      }
      return;
    }

    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      togglePlayback();
    } else if (e.key === "j" || e.key === "J") {
      e.preventDefault();
      playPrevious();
    } else if (e.key === "k" || e.key === "K") {
      e.preventDefault();
      playNext();
    } else if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      if (muteBtn) muteBtn.click();
    } else if (e.key === "l" || e.key === "L") {
      e.preventDefault();
      const curSongObj = songs[currentSong];
      if (curSongObj) toggleSongFavorite(curSongObj.id);
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      if (playlistModal && playlistModal.classList.contains("open")) {
        closePlaylist();
      } else {
        openPlaylist();
      }
    } else if (e.key === "q" || e.key === "Q") {
      e.preventDefault();
      toggleQueue();
    } else if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      cycleTheme();
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      if (shuffleBtn) shuffleBtn.click();
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      if (repeatBtn) repeatBtn.click();
    } else if (e.key === "?" || e.key === "h" || e.key === "H") {
      e.preventDefault();
      toggleShortcuts();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      adjustVolumeDelta(5);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      adjustVolumeDelta(-5);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (offlineAudio) {
        offlineAudio.currentTime = Math.min(offlineAudio.duration || 9999, (offlineAudio.currentTime || 0) + 5);
        updateLiveProgress();
        showToast("⏩ +5s", "right");
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (offlineAudio) {
        offlineAudio.currentTime = Math.max(0, (offlineAudio.currentTime || 0) - 5);
        updateLiveProgress();
        showToast("⏪ -5s", "left");
      }
    } else if (e.key === "Escape") {
      closePlaylist();
      closeQueue();
      closeShortcuts();
      const moreDropdown = document.getElementById("playerMoreDropdown");
      if (moreDropdown) moreDropdown.classList.remove("open");
      const moreMenu = document.getElementById("playerMoreMenu");
      if (moreMenu) moreMenu.style.display = "none";
      if (speedDropdown) speedDropdown.classList.remove("open");
      if (themeDropdown) themeDropdown.classList.remove("open");
      if (shareDropdown) shareDropdown.classList.remove("open");
    }
  });

  /* =========================================================
     12. STARTUP INITIALIZATION & AUDIO UNLOCK ENGINE
     ========================================================= */
  setLanguage("en", false);
  loadHindiSongs();
  initHindiSleepTimerUI();
  initVolumeState();

  /* Queue Toggle and Modal Listeners */
  if (queueToggleBtn) {
    queueToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleQueue();
    });
  }
  if (queueCloseBtn) queueCloseBtn.addEventListener("click", closeQueue);
  if (queueBackdrop) queueBackdrop.addEventListener("click", closeQueue);
  if (queueClearBtn) queueClearBtn.addEventListener("click", clearQueue);
  updateQueueUI();


  // PWA Install prompt handling
  const pwaInstallBtn = document.getElementById("pwaInstallBtn");
  if (pwaInstallBtn && window.OfflineManager) {
    if (window.OfflineManager.canInstallPwa()) {
      pwaInstallBtn.classList.add("visible");
    }

    pwaInstallBtn.addEventListener("click", async () => {
      const accepted = await window.OfflineManager.promptPwaInstall();
      if (accepted) {
        pwaInstallBtn.classList.remove("visible");
        showToast("🎉 App installed successfully!");
      }
    });
  }

  // Subscribe to offline manager updates
  if (window.OfflineManager) {
    window.OfflineManager.subscribe((type) => {
      if (type === "installable" && pwaInstallBtn) {
        pwaInstallBtn.classList.add("visible");
      } else if (type === "installed" && pwaInstallBtn) {
        pwaInstallBtn.classList.remove("visible");
      } else if (type === "download-complete" || type === "delete" || type === "clear") {
        refreshDownloadedHindiSongs().then(() => {
          renderSongCardsGrid();
          renderPlaylist(playlistSearch ? playlistSearch.value : "");
        });
      }
    });
    refreshDownloadedHindiSongs();
  }

  // Register High-Performance Service Worker for instant offline audio caching
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("../sw.js").catch((err) => {
        console.debug("ServiceWorker registration notice:", err);
      });
    });
  }

  // Mobile audio & media unlock on first user gesture across touch/click/pointer
  function unlockAudioPipeline() {
    if (offlineAudio && !offlineAudio.src && songs && songs[0] && songs[0].file) {
      offlineAudio.src = songs[0].file;
      offlineAudio.load();
    }
  }

  ["touchstart", "touchend", "pointerdown", "click", "keydown"].forEach((evt) => {
    document.addEventListener(evt, unlockAudioPipeline, { passive: true, once: true });
  });
})();
