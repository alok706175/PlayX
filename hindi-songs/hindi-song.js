/* =========================================================
   छठ घाट (Chhath Ghat) - Superhit Hindi Songs Interactive Engine
   Eye-Comfort, Dark Aesthetics, Glassmorphism Audio Player
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     0. BILINGUAL LOCALIZATION STRINGS (HINDI / ENGLISH)
     ========================================================= */
  let currentLang = localStorage.getItem("playx_lang") || "en"; // Default English
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
    hi: {
      langBtnText: "हिंदी",
      langBtnTitle: "भाषा: हिंदी (अंग्रेज़ी में बदलने के लिए क्लिक करें)",
      langBtnAria: "अंग्रेज़ी भाषा में बदलें",
      timeWidgetTitle: "भारतीय मानक समय (IST)",
      navBackText: "वापस जाएं",
      navBackTitle: "मुख्य पृष्ठ पर वापस जाएं",
      heroBadge: "✨ 70 सुपरहिट बॉलीवुड क्लासिक्स",
      mainLogoTitle1: "हिंदी सुपरहिट",
      mainLogoTitle2: "गीत संग्रह",
      taglineText: "॥ बॉलीवुड क्लासिक्स • रोमांटिक हिट्स • दिलकश नगमे • डांस बीट्स ॥",
      loadingSong: "गीत लोड हो रहा है...",
      playlistTitle: "हिंदी गीत सूची",
      playlistSearchPlaceholder: "गीत या गायक का नाम खोजें...",
      searchPlaceholder: "गीत, फिल्म या गायक का नाम खोजें (Search Hindi songs)...",
      noSongsFound: "कोई गीत नहीं मिला",
      noFavsFound: "कोई पसंदीदा गीत नहीं मिला। किसी भी गीत पर ❤️ क्लिक करके पसंदीदा बनाएं!",
      prevSongTitle: "पिछला गीत (J)",
      playBtnTitle: "चलाएं / रोकें (Space)",
      nextSongTitle: "अगला गीत (K)",
      playlistBtnTitle: "गीत सूची (Playlist)",
      playlistCloseTitle: "गीत सूची बंद करें",
      muteBtnTitle: "ध्वनि म्यूट / अनम्यूट (M)",
      speedBtnTitle: "प्लेबैक स्पीड बदलें",
      volumeSliderTitle: "वॉल्यूम कम या ज्यादा करें",
      seekSliderTitle: "गीत को आगे या पीछे करें",
      gridTitleText: "हिंदी सुपरहिट बॉलीवुड संग्रह",
      showingSongsPrefix: "दिखाए जा रहे हैं: ",
      songsSuffix: " गीत",
      shareBtnLabel: "शेयर",
      shareBtnTitle: "हिंदी गीत संग्रह शेयर करें",
      whatsappLabel: "WhatsApp",
      facebookLabel: "Facebook",
      instagramLabel: "Instagram",
      copyLinkText: "लिंक कॉपी करें",
      toastLangSwitched: "भाषा बदलकर हिंदी कर दी गई है",
      toastMuted: "🔇 ध्वनि म्यूट की गई",
      toastUnmuted: "🔊 ध्वनि अनम्यूट की गई",
      toastSpeed: "⚡ प्लेबैक स्पीड: ",
      toastFavAdded: "❤️ पसंदीदा सूची में जोड़ा गया",
      toastFavRemoved: "🤍 पसंदीदा सूची से हटाया गया",
      toastShuffleOn: "🔀 शफ़ल मोड चालू",
      toastShuffleOff: "➡️ सामान्य क्रम मोड",
      toastRepeatOff: "➡️ रिपीट बंद",
      toastRepeatAll: "🔁 सभी गीत रिपीट",
      toastRepeatOne: "🔂 केवल यह गीत रिपीट (Repeat 1)",
      toastTheme: "🎨 थीम बदली गई: ",
      toastCopied: "🔗 लिंक कॉपी हो गया!",
      nowPlayingPrefix: "🎶 बज रहा है: "
    },
    en: {
      langBtnText: "English",
      langBtnTitle: "Language: English (Click to switch to Hindi)",
      langBtnAria: "Switch language to Hindi",
      timeWidgetTitle: "Indian Standard Time (IST)",
      navBackText: "Go Back",
      navBackTitle: "Go Back to Home",
      heroBadge: "✨ 70 SUPERHIT BOLLYWOOD CLASSICS",
      mainLogoTitle1: "Superhit Hindi",
      mainLogoTitle2: "Songs Collection",
      taglineText: "॥ Bollywood Classics • Romantic Hits • Soulful Melodies • Dance Beats ॥",
      loadingSong: "Loading Hindi Songs...",
      playlistTitle: "Hindi Songs Playlist",
      playlistSearchPlaceholder: "Search song, movie, or singer name...",
      searchPlaceholder: "Search song, movie, or singer name...",
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
      const t = i18n[currentLang] || i18n.en;
      showToast(t.toastTheme + THEMES[themeKey].name);
    }
  }

  // Load Saved Theme
  const savedTheme = localStorage.getItem("hindi_songs_theme") || "midnight";
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

    const days = langDays[currentLang] || langDays.en;
    const months = langMonths[currentLang] || langMonths.en;

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
     4. SOCIAL SHARING & URL COPY
     ========================================================= */
  const SHARE_URL = window.location.href;

  function shareOnWhatsApp(customHeading) {
    const title = customHeading || "🎶 70 सुपरहिट हिंदी बॉलीवुड गीत संग्रह 🎧";
    const body =
      `${title}\n\n` +
      `सुनिए सदाबहार 90s क्लासिक्स, रोमांटिक हिट्स और डांस बीट्स 320 Kbps HD ऑडियो में:\n\n` +
      `▶️ *ऑनलाइन गीत यहां सुनें:* \n${SHARE_URL}\n\n` +
      `✨ लता मंगेशकर, कुमार सानु, उदित नारायण, सोनू निगम, अरिजीत सिंह और श्रेया घोषाल के सुपरहिट गीत! 🎵`;

    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
    showToast("✨ WhatsApp खोला जा रहा है...");
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
      shareOnWhatsApp("🎶 70 सुपरहिट हिंदी बॉलीवुड गीत संग्रह 🎧");
    });
  }

  const fbShareBtn = document.getElementById("facebookShareBtn");
  if (fbShareBtn) {
    fbShareBtn.addEventListener("click", () => {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent("🎶 70 सुपरहिट हिंदी बॉलीवुड गीत संग्रह ऑनलाइन सुनें 🎧")}`;
      window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    });
  }

  /* Instagram Share */
  const instaShareBtn = document.getElementById("instagramShareBtn");
  if (instaShareBtn) {
    instaShareBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        showToast(currentLang === "en" ? "✨ Link copied! Share on Instagram 📸" : "✨ लिंक कॉपी हुआ! Instagram पर शेयर करें 📸");
      } catch (err) {
        showToast(currentLang === "en" ? "✨ Opening Instagram..." : "✨ Instagram खोला जा रहा है...");
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
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        const t = i18n[currentLang] || i18n.en;
        showToast(t.toastCopied);
      } catch (err) {
        showToast("Link: " + SHARE_URL);
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
    const t = i18n[currentLang] || i18n.en;

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

  function updateFavoriteUI() {
    // Update category chip count for favorites
    const countFavs = document.getElementById("countFavs");
    if (countFavs) countFavs.textContent = likedSongs.size;

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

  /* Load Hindi Songs dataset */
  async function loadHindiSongs() {
    try {
      const res = await fetch("hindi_songs.json", { cache: "no-store" });
      if (res.ok) {
        songs = await res.json();
      }
    } catch (e) {
      console.warn("Hindi songs fetch error:", e);
    }

    if (!Array.isArray(songs) || songs.length === 0) {
      if (songName) songName.textContent = "No Hindi Songs Found";
      return;
    }

    // Calculate category counts
    const countAll = document.getElementById("countAll");
    const countRomantic = document.getElementById("countRomantic");
    const count90s = document.getElementById("count90s");
    const countSoulful = document.getElementById("countSoulful");
    const countDance = document.getElementById("countDance");
    const countFavs = document.getElementById("countFavs");

    if (countAll) countAll.textContent = songs.length;
    if (countRomantic) countRomantic.textContent = songs.filter(s => s.category === "Romantic").length;
    if (count90s) count90s.textContent = songs.filter(s => s.category === "90s Classics").length;
    if (countSoulful) countSoulful.textContent = songs.filter(s => s.category === "Soulful Melodies").length;
    if (countDance) countDance.textContent = songs.filter(s => s.category === "Dance & Beats").length;
    if (countFavs) countFavs.textContent = likedSongs.size;

    const t = i18n[currentLang] || i18n.en;
    if (playlistTitleText) {
      playlistTitleText.textContent = `${t.playlistTitle} (${songs.length})`;
    }

    renderPlaylist();
    renderSongCardsGrid();
    displaySongInfo(0);
    updateFavoriteUI();

    // Preload first track audio source
    if (offlineAudio && songs[0] && songs[0].file) {
      offlineAudio.src = songs[0].file;
      offlineAudio.load();
    }
  }

  let downloadedHindiSongs = new Set();
  async function refreshDownloadedHindiSongs() {
    if (window.OfflineManager) {
      try {
        const list = await window.OfflineManager.getAllDownloadedSongs();
        downloadedHindiSongs = new Set(list.map(x => x.key));
        const countDownloadsEl = document.getElementById("countDownloads");
        if (countDownloadsEl) {
          const pageDownloadedCount = songs.filter(s => downloadedHindiSongs.has(window.OfflineManager.getSongKey(s))).length;
          countDownloadsEl.textContent = pageDownloadedCount.toString();
        }
      } catch (e) {}
    }
  }

  async function displaySongInfo(index) {
    if (!songs[index]) return;
    currentSong = index;
    const s = songs[index];
    const isEn = currentLang === "en";

    const title = isEn ? (s.nameEn || s.name) : s.name;
    const singer = isEn ? (s.singerEn || s.singer) : s.singer;

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
  }

  async function playSong(index) {
    if (!songs[index]) return;
    currentSong = index;
    await displaySongInfo(index);

    if (offlineAudio) {
      const s = songs[index];
      let playback = { isOffline: false, canPlay: true, src: s.file };
      if (window.OfflineManager) {
        playback = await window.OfflineManager.resolvePlaybackSource(s);
      }

      if (!playback.canPlay) {
        setPlaybackState(false);
        showToast(currentLang === "en" ? "📴 You're offline. Download this song while online to listen offline!" : "📴 आप ऑफ़लाइन हैं। बिना इंटरनेट सुनने के लिए इस गीत को ऑनलाइन रहते हुए डाउनलोड करें।");
        return;
      }

      const fileSrc = playback.src;
      if (offlineAudio.src !== fileSrc) {
        offlineAudio.src = fileSrc;
        offlineAudio.load();
      }

      if (playback.isOffline) {
        showToast("💾 " + (currentLang === "en" ? "Playing local offline copy" : "ऑफ़लाइन लोकल कॉपी बज रही है"));
      }

      const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
      const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
      offlineAudio.volume = volNum / 100;
      offlineAudio.playbackRate = activeRate;

      offlineAudio.play().then(() => {
        setPlaybackState(true);
        preloadNextTrack();
        const prefix = (i18n[currentLang] && i18n[currentLang].nowPlayingPrefix) || "🎶 Now Playing: ";
        showToast(prefix + (currentLang === "en" ? (s.nameEn || s.name) : s.name));
      }).catch(err => {
        console.warn("Playback error:", err);
      });
    }
  }

  function togglePlayback() {
    if (isPlaying) {
      if (offlineAudio && !offlineAudio.paused) {
        offlineAudio.pause();
      }
      setPlaybackState(false);
    } else {
      if (offlineAudio) {
        const s = songs[currentSong];
        if (s && (!offlineAudio.src || offlineAudio.src !== s.file)) {
          offlineAudio.src = s.file;
        }
        const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
        const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
        offlineAudio.volume = volNum / 100;
        offlineAudio.playbackRate = activeRate;
        offlineAudio.play().then(() => {
          preloadNextTrack();
        }).catch(console.warn);
      }
      setPlaybackState(true);
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

  function playNext() {
    if (!songs.length) return;
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

  async function requestWakeLock() {
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
    if (document.visibilityState === "visible") {
      if (offlineAudio) {
        updateLiveProgress();
        if (!offlineAudio.paused && !isPlaying) {
          setPlaybackState(true);
        } else if (offlineAudio.paused && isPlaying) {
          setPlaybackState(false);
        }
      }
      if (isPlaying) {
        requestWakeLock();
      }
    } else {
      if (MEDIA_SESSION_SUPPORTED) {
        try {
          navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
          if (offlineAudio) {
            updateMediaSessionPosition(offlineAudio.currentTime, offlineAudio.duration);
          }
        } catch (e) {}
      }
    }
  });

  window.addEventListener("pagehide", releaseWakeLock);

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
        if (offlineAudio && songs[currentSong]) {
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

    offlineAudio.addEventListener("playing", () => {
      if (!isPlaying) setPlaybackState(true);
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "playing"; } catch (e) {}
      }
      playbackRetryCount = 0;
      updateLiveProgress();
    });

    offlineAudio.addEventListener("timeupdate", () => {
      updateLiveProgress();
      if (offlineAudio.duration && (offlineAudio.currentTime / offlineAudio.duration > 0.75 || (offlineAudio.duration - offlineAudio.currentTime) < 25)) {
        preloadNextTrack();
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
      lastPreloadedIdx = -1;
      if (repeatMode === 2) {
        // Repeat One
        offlineAudio.currentTime = 0;
        offlineAudio.play().catch(console.warn);
      } else if (repeatMode === 1) {
        // Repeat All
        playNext();
      } else {
        // Normal next
        if (currentSong < songs.length - 1) {
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

  function setPlaybackState(playing) {
    isPlaying = playing;
    if (playing) {
      if (playIcon) playIcon.textContent = "❚❚";
      if (miniPlayBtn) miniPlayBtn.textContent = "❚❚";
      if (albumCover) albumCover.classList.add("spinning");
      if (miniCover) miniCover.classList.add("spinning");
      if (playerElem) playerElem.classList.add("playing");
      startProgressSync();
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
      releaseWakeLock();
      if (MEDIA_SESSION_SUPPORTED) {
        try { navigator.mediaSession.playbackState = "paused"; } catch (e) {}
      }
    }
    renderPlaylist(playlistSearch ? playlistSearch.value : "");
    updateMediaSessionMetadata();
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

  function updateLiveProgress() {
    if (!offlineAudio || isSeeking) return;
    const dur = offlineAudio.duration || 0;
    const cur = offlineAudio.currentTime || 0;

    if (dur > 0) {
      const pct = (cur / dur) * 100;
      if (progress) progress.value = pct;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (totalTime) totalTime.textContent = formatTime(dur);
    }
    if (currentTime) currentTime.textContent = formatTime(cur);
    updateMediaSessionPosition(cur, dur);
  }

  /* Seek interactions */
  if (progress) {
    const handleSeekInput = () => {
      isSeeking = true;
      if (seekDebounceTimeout) clearTimeout(seekDebounceTimeout);
      const dur = offlineAudio ? offlineAudio.duration || 0 : 0;
      const pct = parseFloat(progress.value) || 0;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (currentTime && dur > 0) {
        currentTime.textContent = formatTime((pct / 100) * dur);
      }
    };

    const handleSeekCommit = () => {
      const dur = offlineAudio ? offlineAudio.duration || 0 : 0;
      const pct = parseFloat(progress.value) || 0;
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
      }
      isSeeking = false;
    };

    progress.addEventListener("input", handleSeekInput);
    progress.addEventListener("change", handleSeekCommit);
    progress.addEventListener("mouseup", handleSeekCommit);
    progress.addEventListener("touchend", handleSeekCommit);
  }

  /* Shuffle & Repeat Modes */
  if (shuffleBtn) {
    shuffleBtn.addEventListener("click", () => {
      isShuffle = !isShuffle;
      shuffleBtn.classList.toggle("active", isShuffle);
      const t = i18n[currentLang] || i18n.en;
      showToast(isShuffle ? t.toastShuffleOn : t.toastShuffleOff);
    });
  }

  if (repeatBtn) {
    repeatBtn.addEventListener("click", () => {
      repeatMode = (repeatMode + 1) % 3;
      const t = i18n[currentLang] || i18n.en;
      if (repeatMode === 0) {
        repeatBtn.innerHTML = "🔁";
        repeatBtn.classList.remove("active");
        showToast(t.toastRepeatOff);
      } else if (repeatMode === 1) {
        repeatBtn.innerHTML = "🔁";
        repeatBtn.classList.add("active");
        showToast(t.toastRepeatAll);
      } else {
        repeatBtn.innerHTML = "🔂";
        repeatBtn.classList.add("active");
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

  /* Volume & Mute Controls */
  const VOL_HIGH_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M13.5 9.5C14.3 10.3 14.8 11.1 14.8 12s-.5 1.7-1.3 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 7.5C17.9 8.9 18.7 10.4 18.7 12s-.8 3.1-2.2 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  const VOL_MUTE_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"><path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

  if (volumeSlider) {
    volumeSlider.addEventListener("input", () => {
      const volNum = parseInt(volumeSlider.value, 10);
      if (offlineAudio) offlineAudio.volume = volNum / 100;
      if (muteBtn) muteBtn.innerHTML = volNum === 0 ? VOL_MUTE_ICON : VOL_HIGH_ICON;
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      const isMuted = offlineAudio ? offlineAudio.volume === 0 : false;
      const t = i18n[currentLang] || i18n.en;
      if (isMuted) {
        const targetVol = lastVolume > 0 ? Math.round(lastVolume * 100) : 100;
        if (offlineAudio) offlineAudio.volume = targetVol / 100;
        if (volumeSlider) volumeSlider.value = targetVol;
        muteBtn.innerHTML = VOL_HIGH_ICON;
        showToast(t.toastUnmuted);
      } else {
        const currentVol = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
        if (currentVol > 0) lastVolume = currentVol / 100;
        if (offlineAudio) offlineAudio.volume = 0;
        if (volumeSlider) volumeSlider.value = 0;
        muteBtn.innerHTML = VOL_MUTE_ICON;
        showToast(t.toastMuted);
      }
    });
  }

  /* Playback Speed Controller */
  function setPlaybackRate(r) {
    if (offlineAudio) offlineAudio.playbackRate = r;
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
    const t = i18n[currentLang] || i18n.en;
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
    const t = i18n[currentLang] || i18n.en;

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
        <div class="item-duration">${s.duration || "320K"}</div>
      `;

      item.addEventListener("click", () => {
        playSong(s.originalIdx);
        closePlaylist();
      });

      playlistList.appendChild(item);
    });
  }

  /* Render Song Cards Grid Section */
  function renderSongCardsGrid() {
    const grid = document.getElementById("songsCardsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    const query = mainSearchInput ? mainSearchInput.value : "";
    const filtered = getFilteredAndSortedSongs(query);
    const isEn = currentLang === "en";
    const t = i18n[currentLang] || i18n.en;

    if (gridCounterBadge) {
      gridCounterBadge.textContent = `${t.showingSongsPrefix}${filtered.length}${t.songsSuffix}`;
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 16px; background: var(--bg-surface); border: 1px dashed var(--border-medium); border-radius: 20px;">
          <div style="font-size: 38px; margin-bottom: 8px;">🎵</div>
          <h3 style="color: var(--text-primary); margin-bottom: 6px;">${selectedCategory === "favorites" ? t.noFavsFound : (selectedCategory === "downloads" ? (isEn ? "No downloaded songs found. Click ↓ on any song to listen offline!" : "कोई डाउनलोड किया हुआ गीत नहीं मिला। ऑफ़लाइन सुनने के लिए किसी गीत पर ↓ बटन दबाएं!") : t.noSongsFound)}</h3>
          <p style="color: var(--text-muted); font-size: 13.5px;">Try selecting 'All Songs' or searching with another keyword.</p>
        </div>
      `;
      return;
    }

    filtered.forEach((s) => {
      const card = document.createElement("div");
      const isCardPlaying = s.originalIdx === currentSong;
      card.className = "song-card" + (isCardPlaying ? " now-playing" : "");
      card.setAttribute("data-song-idx", s.originalIdx);

      const title = isEn ? (s.nameEn || s.name) : s.name;
      const singer = isEn ? (s.singerEn || s.singer) : s.singer;
      const isLiked = likedSongs.has(s.id);
      const songKey = window.OfflineManager ? window.OfflineManager.getSongKey(s) : s.file;
      const isDownloaded = downloadedHindiSongs.has(songKey);

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
            <button class="song-card-download-btn ${isDownloaded ? 'downloaded' : ''}" type="button" title="${isDownloaded ? 'Downloaded ✓' : 'Download for offline listening'}" aria-label="Download ${title}">
              ${isDownloaded ? '✓' : '↓'}
            </button>
            <button class="song-card-play-btn" type="button" aria-label="Play ${title}">
              <span>${isCardPlaying && isPlaying ? "❚❚" : "▶"}</span>
              <span>${isCardPlaying && isPlaying ? (isEn ? "Pause" : "रोकें") : (isEn ? "Play" : "सुनें")}</span>
            </button>
          </div>
        </div>
      `;

      // Heart like button listener
      const likeBtn = card.querySelector(".card-like-btn");
      if (likeBtn) {
        likeBtn.addEventListener("click", (e) => {
          toggleSongFavorite(s.id, e);
        });
      }

      // Download button listener
      const dlBtn = card.querySelector(".song-card-download-btn");
      if (dlBtn) {
        dlBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          if (!window.OfflineManager) return;
          dlBtn.className = "song-card-download-btn downloading";
          dlBtn.textContent = "0%";
          showToast((currentLang === "en" ? "Downloading: " : "डाउनलोड हो रहा है: ") + (s.name || "Song"));

          try {
            await window.OfflineManager.downloadSong(s, (prog) => {
              if (prog.percent >= 0) {
                dlBtn.textContent = `${prog.percent}%`;
              } else {
                dlBtn.textContent = "⏳";
              }
            });
            dlBtn.className = "song-card-download-btn downloaded";
            dlBtn.textContent = "✓";
            dlBtn.title = "Downloaded ✓";
            showToast(currentLang === "en" ? "Downloaded for offline listening ✓" : "ऑफ़लाइन सुनने के लिए डाउनलोड पूरा हुआ ✓");
            await refreshDownloadedHindiSongs();
            renderSongCardsGrid();
          } catch (err) {
            console.error("Download failed:", err);
            dlBtn.className = "song-card-download-btn";
            dlBtn.textContent = "↓";
            showToast(currentLang === "en" ? "Download failed. Please try again." : "डाउनलोड विफल रहा। कृपया पुनः प्रयास करें।");
          }
        });
      }

      // Card click listener
      card.addEventListener("click", (e) => {
        if (e.target.closest(".song-card-download-btn") || e.target.closest(".card-like-btn")) return;
        if (s.originalIdx === currentSong) {
          togglePlayback();
        } else {
          playSong(s.originalIdx);
        }
      });

      grid.appendChild(card);
    });
  }

  /* Category chips listener */
  if (categoryChips) {
    categoryChips.forEach(chip => {
      chip.addEventListener("click", () => {
        categoryChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        selectedCategory = chip.getAttribute("data-cat") || "all";
        renderSongCardsGrid();
        renderPlaylist(playlistSearch ? playlistSearch.value : "");
      });
    });
  }

  /* Search input listener */
  if (mainSearchInput) {
    mainSearchInput.addEventListener("input", (e) => {
      const q = e.target.value;
      if (mainSearchClearBtn) mainSearchClearBtn.style.display = q ? "flex" : "none";
      renderSongCardsGrid();
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
    if (heroBadge) heroBadge.textContent = t.heroBadge;

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
    if (mainSearchInput) mainSearchInput.placeholder = t.searchPlaceholder;
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
    langToggleBtn.addEventListener("click", () => {
      const next = currentLang === "en" ? "hi" : "en";
      setLanguage(next, true);
    });
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

  function getArtworkList() {
    const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    const makeUrl = (rel) => new URL(rel, origin + basePath).href;

    return [
      { src: makeUrl("favicon.io/hindi-icon-32x32.png"), sizes: "32x32", type: "image/png" },
      { src: makeUrl("favicon.io/hindi-apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
      { src: makeUrl("favicon.io/hindi-icon-192x192.png"), sizes: "192x192", type: "image/png" },
      { src: makeUrl("favicon.io/hindi-icon-512x512.png"), sizes: "512x512", type: "image/png" },
      { src: makeUrl("images/hindi_song_icon.png"), sizes: "512x512", type: "image/png" }
    ];
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
      const albumName = isEn ? "Superhit Bollywood Classics" : "हिंदी सुपरहिट बॉलीवुड संग्रह";

      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: singer || (isEn ? "Bollywood Singer" : "बॉलीवुड गायक"),
        album: albumName,
        artwork: getArtworkList()
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
        if (details.seekTime !== undefined && isFinite(details.seekTime) && offlineAudio) {
          if (details.fastSeek && ("fastSeek" in offlineAudio)) {
            offlineAudio.fastSeek(details.seekTime);
          } else {
            offlineAudio.currentTime = details.seekTime;
          }
          updateLiveProgress();
          updateMediaSessionPosition(offlineAudio.currentTime, offlineAudio.duration);
        }
      }],
      ["seekbackward", (details) => {
        const skip = details.seekOffset || 10;
        if (offlineAudio) {
          offlineAudio.currentTime = Math.max(0, (offlineAudio.currentTime || 0) - skip);
          updateLiveProgress();
          updateMediaSessionPosition(offlineAudio.currentTime, offlineAudio.duration);
        }
      }],
      ["seekforward", (details) => {
        const skip = details.seekOffset || 10;
        if (offlineAudio) {
          offlineAudio.currentTime = Math.min(offlineAudio.duration || 9999, (offlineAudio.currentTime || 0) + skip);
          updateLiveProgress();
          updateMediaSessionPosition(offlineAudio.currentTime, offlineAudio.duration);
        }
      }],
      ["stop", () => {
        if (offlineAudio) {
          offlineAudio.pause();
          offlineAudio.currentTime = 0;
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
    } else if (e.key === "t" || e.key === "T") {
      e.preventDefault();
      cycleTheme();
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
      closeShortcuts();
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
        showToast(currentLang === "en" ? "🎉 App installed successfully!" : "🎉 ऐप सफलतापूर्वक इंस्टॉल हो गया!");
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
