/* =========================================================
   PlayX | Festival & Bollywood Music Hub
   Master Homepage Interactive Engine
   ========================================================= */

(function () {
  "use strict";

  // State
  // State
  let currentTheme = localStorage.getItem("playx_theme") || "dark";
  if (currentTheme !== "light" && currentTheme !== "dark") {
    currentTheme = "dark";
  }
  let currentLang = "en";
try { localStorage.setItem("playx_lang", "en"); } catch(e){}
  let activeFilter = "all";
  let currentPlayingTrack = null;
  let audioPlayer = new Audio();
  let isPlaying = false;

  const TRANSLATIONS = {
    hi: {
      btnText: "English",
      btnTitle: "Language: English",
      timeWidgetTitle: "Indian Standard Time (IST)",
      sectionTitle: "Festive & Music Categories",
      sectionSubtitle: "Choose your favorite category and enjoy the dedicated player.",
      chhathTitle: "Chhath Puja Mahaparv Songs",
      chhathDesc: "Sacred Chhath Puja Arghya and devotional melodies by Sharda Sinha, Pawan Singh, Khesari Lal Yadav, and Anuradha Paudwal.",
      chhathPills: ["25+ Sacred Songs", "320 Kbps HD", "Offline Player"],
      hindiTitle: "Hindi Superhit Bollywood Songs",
      hindiDesc: "Evergreen 90s classics, romantic melodies, and dance tracks by Arijit Singh, Sonu Nigam, Lata Mangeshkar, Kumar Sanu, and Alka Yagnik.",
      hindiPills: ["207 Classic Hits", "320 Kbps HD", "Dark Mode Player"],
      saawanTitle: "Saawan Shiv Bhajan & Bol Bam",
      saawanDesc: "Sacred Shiv Bhajans, Kanwar Geet, and Bol Bam devotional melodies by top devotional artists.",
      saawanPills: ["25+ Shiv Bhajans", "HD Audio", "PlayX Special"],
      durgaTitle: "Durga Puja & Navratri Bhakti",
      durgaDesc: "Divine devotional melodies, Mata Ki Aarti, and Navratri special Bhakti geet for festive celebration.",
      durgaPills: ["25+ Durga Bhajans", "Navratri Special", "PlayX Special"],
      holiTitle: "Colorful Holi Songs & Fhag",
      holiDesc: "Superhit festive Holi melodies, traditional Fhag, and colorful dance hits to celebrate the festival of colors.",
      holiPills: ["25+ Holi Hits", "Holi Festival", "PlayX Special"],
      bhojpuriTitle: "Bhojpuri Superhit Songs",
      bhojpuriDesc: "Top Bhojpuri hit songs, festive dance melodies, and energetic beats from renowned folk icons.",
      bhojpuriPills: ["25+ Desi Hits", "Folk & DJ Hits", "PlayX Special"],
      haryanviTitle: "Haryanvi Superhit Songs",
      haryanviDesc: "High-energy Haryanvi DJ tracks, folk melodies, and chartbuster dance hits.",
      haryanviPills: ["25+ DJ Hits", "Folk Beats", "PlayX Special"],
      punjabiTitle: "Punjabi Superhit Songs",
      punjabiDesc: "Top Punjabi and Bhangra hits by Diljit Dosanjh, Sidhu Moosewala, Guru Randhawa, and more.",
      punjabiPills: ["25+ Bhangra Hits", "Urban Beats", "PlayX Special"],
      footerCol1Title: "Festive Categories",
      footerLinkChhath: "Chhath Puja Mahaparv",
      footerLinkSaawan: "Saawan Shiv Bhajan",
      footerLinkDurga: "Durga Puja & Navratri",
      footerLinkHoli: "Colorful Holi Songs",
      footerCol2Title: "Music Collections",
      footerLinkHindi: "Hindi Bollywood Superhits",
      footerLinkBhojpuri: "Bhojpuri Superhits",
      footerLinkHaryanvi: "Haryanvi Superhits",
      footerLinkPunjabi: "Punjabi Superhits",
      footerLinkMantra: "Surya Gayatri Mantra",
      footerCol3Title: "Features",
      footerLinkOffline: "Offline Downloads",
      footerLinkPwa: "Install PWA App",
      footerLinkSitemap: "Sitemap"
    },
    en: {
      btnText: "English",
      btnTitle: "Current Language: English (Click to switch to Hindi)",
      timeWidgetTitle: "Indian Standard Time (IST)",
      sectionTag: "POPULAR COLLECTIONS",
      sectionTitle: "Festivals & Music Categories",
      sectionSubtitle: "Choose your favorite category and enjoy specialized HD music players.",

      hindiTitle: "Hindi Song",
      hindiSub: "Evergreen Classics & Romantic Melodies",
      hindiDesc: "Timeless 90s classics, romantic blockbusters, and energetic dance tracks from Arijit Singh, Sonu Nigam, Lata Mangeshkar, and Kumar Sanu.",
      hindiPills: ["207 Classic Hits", "320 Kbps HD", "Dark Mode Player"],

      haryanviTitle: "Haryanvi Song",
      haryanviSub: "Sapna Choudhary & DJ Bass Hits",
      haryanviDesc: "Haryanvi party hits and folk tunes. Listen to top superhits in 320 Kbps HD audio.",
      haryanviPills: ["DJ Bass Hits", "Haryanvi Hits", "PlayX Special"],

      punjabiTitle: "Punjabi Song",
      punjabiSub: "Diljit Dosanjh, Sidhu Moose Wala & Bhangra",
      punjabiDesc: "Top Punjabi party anthems and Bhangra beats. Original songs for this category are coming soon.",
      punjabiPills: ["Bhangra Beats", "Party Anthems", "PlayX Special"],

      durgaTitle: "Navratri Song & Bhajan ",
      durgaSub: "Maa Durga Aarti, Bhent & Garba-Dandiya",
      durgaDesc: "Maa Durga aarti, bhents and Navratri devotion. Original songs for this category are coming soon.",
      durgaPills: ["Navratri Special", "Garba & Aarti", "PlayX Special"],

      saawanTitle: "Saawan  Song & Bhajan",
      saawanSub: "Holy Kanwar Yatra & Lord Shiva Songs",
      saawanDesc: "Sacred Saawan and Kanwar Yatra bhajans. Original devotional songs for this category are coming soon.",
      saawanPills: ["Shiv Bhajans", "Bol Bam Hits", "PlayX Special"],

      chhathTitle: "Chhath puja Song",
      chhathSub: "Divine Sun God & Chhathi Maiya Songs",
      chhathDesc: "Sacred Chhath Puja bhajans including Ugi Hey Dinanath, Kelwa Ke Paat Par, and Kaanch Hi Baans Ke Bahangiya by legendary artists.",
      chhathPills: ["25+ Traditional Songs", "320 Kbps HD", "Offline Player"],

      holiTitle: "Holi Song",
      holiSub: "Festival of Colors & Folk Celebrations",
      holiDesc: "Celebration of colors, festive tracks and folk songs. Original songs for this category are coming soon.",
      holiPills: ["Holi Hits", "320 Kbps HD", "PlayX Special"],

      bhojpuriTitle: "Bhojpuri Song",
      bhojpuriSub: "Desi Hits, Lokgeet & Dance Beats",
      bhojpuriDesc: "Top Bhojpuri folk and popular tracks. Original songs for this category are coming soon.",
      bhojpuriPills: ["Desi Hits", "Folk & Dance", "PlayX Special"],

      // Footer Translations
      footerBrandTagline: "A Largest Music Library Website.",
      footerCol1Title: "Festival Categories",
      footerLinkChhath: "Chhath Puja Mahaparv",
      footerLinkSaawan: "Saawan Shiv Bhajans",
      footerLinkDurga: "Durga Puja & Navratri",
      footerLinkHoli: "Holi Songs & Fhag",

      footerCol2Title: "Music Collections",
      footerLinkHindi: "Hindi Song",
      footerLinkBhojpuri: "Bhojpuri Song",
      footerLinkHaryanvi: "Haryanvi Song",
      footerLinkPunjabi: "Punjabi Song",
      footerLinkMantra: "Surya Gayatri Mantra",

      footerCol3Title: "Features & Links",
      footerLinkOffline: "Offline Downloads",
      footerLinkPwa: "Install Web App (PWA)",
      footerLinkSitemap: "Sitemap",
      footerCopyright: "Copyright © 2026 <strong>PlayX</strong> . All Rights Reserved."
    }
  };

  // Preview songs configuration (isolated per category)
  const PREVIEW_SONGS = {};

  /* =========================================================
     1. INITIALIZATION ON DOM LOADED
     ========================================================= */
  function initAll() {
    initTheme();
    initLanguage();
    initClock();
    initCategoryFilters();
    initPreviewAudio();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  /* =========================================================
     2. LIGHT / DARK MODE THEME CONTROLLER
     ========================================================= */
  function initTheme() {
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeToggleUI();

    const themeBtn = document.getElementById("themeToggleBtn");
    if (!themeBtn) return;

    themeBtn.addEventListener("click", () => {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";

      if (window.BulbThemeTransition) {
        window.BulbThemeTransition.trigger({
          targetTheme: nextTheme,
          toggleBtn: themeBtn,
          onApplyTheme: () => {
            currentTheme = nextTheme;
            document.documentElement.setAttribute("data-theme", currentTheme);
            localStorage.setItem("playx_theme", currentTheme);
            updateThemeToggleUI();
          }
        });
      } else {
        currentTheme = nextTheme;
        document.documentElement.setAttribute("data-theme", currentTheme);
        localStorage.setItem("playx_theme", currentTheme);
        updateThemeToggleUI();
      }
    });
  }

  const SVG_SUN = `<svg class="btn-nav-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

  const SVG_MOON = `<svg class="btn-nav-svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

  function updateThemeToggleUI() {
    const themeBtn = document.getElementById("themeToggleBtn");
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", currentTheme === "light" ? "#f8fafc" : "#0a0712");
    }
    if (!themeBtn) return;

    if (currentTheme === "dark") {
      const themeLabel = "Dark Mode";
      themeBtn.innerHTML = `${SVG_MOON} <span id="themeBtnText">${themeLabel}</span>`;
      themeBtn.setAttribute("title", "Switch to Light Mode");
      themeBtn.setAttribute("aria-label", "Switch to Light Mode");
    } else {
      const themeLabel = "Light Mode";
      themeBtn.innerHTML = `${SVG_SUN} <span id="themeBtnText">${themeLabel}</span>`;
      themeBtn.setAttribute("title", "Switch to Dark Mode");
      themeBtn.setAttribute("aria-label", "Switch to Dark Mode");
    }
  }

  /* =========================================================
     2.1 BILINGUAL LANGUAGE CONTROLLER (HINDI / ENGLISH)
     ========================================================= */
  function initLanguage() {
    const langBtn = document.getElementById("langToggleBtn");
    applyLanguage(currentLang);

    if (!langBtn) return;
    // Language switcher disabled (English only mode)
    /* langBtn.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "hi" : "en";
      localStorage.setItem("playx_lang", currentLang);
      applyLanguage(currentLang);
    }); */
  }

  function applyLanguage(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    document.documentElement.lang = lang;
    const langBtn = document.getElementById("langToggleBtn");
    const langBtnText = document.getElementById("langBtnText");

    if (langBtnText) langBtnText.textContent = t.btnText;
    if (langBtn) {
      langBtn.setAttribute("title", t.btnTitle);
      langBtn.setAttribute("data-lang", lang);
    }

    const secTag = document.querySelector(".section-tag");
    const secTitle = document.querySelector(".section-title");
    const secSub = document.querySelector(".section-subtitle");
    if (secTag) secTag.textContent = t.sectionTag;
    if (secTitle) secTitle.textContent = t.sectionTitle;
    if (secSub) secSub.textContent = t.sectionSubtitle;

    function updatePills(card, pills) {
      if (!card || !pills) return;
      const pillEls = card.querySelectorAll(".highlight-pill");
      pillEls.forEach((el, idx) => {
        if (pills[idx]) el.textContent = pills[idx];
      });
    }

    // Card 1: Chhath
    const cardChhath = document.querySelector(".card-chhath");
    if (cardChhath) {
      const h3 = cardChhath.querySelector(".card-title-group h3");
      const sub = cardChhath.querySelector(".card-subtitle-en");
      const desc = cardChhath.querySelector(".card-description");
      if (h3) h3.textContent = t.chhathTitle;
      if (sub) sub.textContent = t.chhathSub;
      if (desc) desc.textContent = t.chhathDesc;
      updatePills(cardChhath, t.chhathPills);
    }

    // Card 2: Hindi
    const cardHindi = document.querySelector(".card-hindi");
    if (cardHindi) {
      const h3 = cardHindi.querySelector(".card-title-group h3");
      const sub = cardHindi.querySelector(".card-subtitle-en");
      const desc = cardHindi.querySelector(".card-description");
      if (h3) h3.textContent = t.hindiTitle;
      if (sub) sub.textContent = t.hindiSub;
      if (desc) desc.textContent = t.hindiDesc;
      updatePills(cardHindi, t.hindiPills);
    }

    // Card 3: Saawan
    const cardSaawan = document.querySelector(".card-saawan");
    if (cardSaawan) {
      const h3 = cardSaawan.querySelector(".card-title-group h3");
      const sub = cardSaawan.querySelector(".card-subtitle-en");
      const desc = cardSaawan.querySelector(".card-description");
      if (h3) h3.textContent = t.saawanTitle;
      if (sub) sub.textContent = t.saawanSub;
      if (desc) desc.textContent = t.saawanDesc;
      updatePills(cardSaawan, t.saawanPills);
    }

    // Card 4: Durga
    const cardDurga = document.querySelector(".card-durga");
    if (cardDurga) {
      const h3 = cardDurga.querySelector(".card-title-group h3");
      const sub = cardDurga.querySelector(".card-subtitle-en");
      const desc = cardDurga.querySelector(".card-description");
      if (h3) h3.textContent = t.durgaTitle;
      if (sub) sub.textContent = t.durgaSub;
      if (desc) desc.textContent = t.durgaDesc;
      updatePills(cardDurga, t.durgaPills);
    }

    // Card 5: Holi
    const cardHoli = document.querySelector(".card-holi");
    if (cardHoli) {
      const h3 = cardHoli.querySelector(".card-title-group h3");
      const sub = cardHoli.querySelector(".card-subtitle-en");
      const desc = cardHoli.querySelector(".card-description");
      if (h3) h3.textContent = t.holiTitle;
      if (sub) sub.textContent = t.holiSub;
      if (desc) desc.textContent = t.holiDesc;
      updatePills(cardHoli, t.holiPills);
    }

    // Card 6: Bhojpuri
    const cardBhojpuri = document.querySelector(".card-bhojpuri");
    if (cardBhojpuri) {
      const h3 = cardBhojpuri.querySelector(".card-title-group h3");
      const sub = cardBhojpuri.querySelector(".card-subtitle-en");
      const desc = cardBhojpuri.querySelector(".card-description");
      if (h3) h3.textContent = t.bhojpuriTitle;
      if (sub) sub.textContent = t.bhojpuriSub;
      if (desc) desc.textContent = t.bhojpuriDesc;
      updatePills(cardBhojpuri, t.bhojpuriPills);
    }

    // Card 7: Haryanvi
    const cardHaryanvi = document.querySelector(".card-haryanvi");
    if (cardHaryanvi) {
      const h3 = cardHaryanvi.querySelector(".card-title-group h3");
      const sub = cardHaryanvi.querySelector(".card-subtitle-en");
      const desc = cardHaryanvi.querySelector(".card-description");
      if (h3) h3.textContent = t.haryanviTitle;
      if (sub) sub.textContent = t.haryanviSub;
      if (desc) desc.textContent = t.haryanviDesc;
      updatePills(cardHaryanvi, t.haryanviPills);
    }

    // Card 8: Punjabi
    const cardPunjabi = document.querySelector(".card-punjabi");
    if (cardPunjabi) {
      const h3 = cardPunjabi.querySelector(".card-title-group h3");
      const sub = cardPunjabi.querySelector(".card-subtitle-en");
      const desc = cardPunjabi.querySelector(".card-description");
      if (h3) h3.textContent = t.punjabiTitle;
      if (sub) sub.textContent = t.punjabiSub;
      if (desc) desc.textContent = t.punjabiDesc;
      updatePills(cardPunjabi, t.punjabiPills);
    }

    // Footer Translations
    const setTxt = (id, text) => {
      const el = document.getElementById(id);
      if (el && text) el.textContent = text;
    };
    const setHtml = (id, html) => {
      const el = document.getElementById(id);
      if (el && html) el.innerHTML = html;
    };

    setTxt("footerBrandTagline", t.footerBrandTagline);
    setTxt("footerCol1Title", t.footerCol1Title);
    setTxt("footerLinkChhath", t.footerLinkChhath);
    setTxt("footerLinkSaawan", t.footerLinkSaawan);
    setTxt("footerLinkDurga", t.footerLinkDurga);
    setTxt("footerLinkHoli", t.footerLinkHoli);

    setTxt("footerCol2Title", t.footerCol2Title);
    setTxt("footerLinkHindi", t.footerLinkHindi);
    setTxt("footerLinkBhojpuri", t.footerLinkBhojpuri);
    setTxt("footerLinkHaryanvi", t.footerLinkHaryanvi);
    setTxt("footerLinkPunjabi", t.footerLinkPunjabi);
    setTxt("footerLinkMantra", t.footerLinkMantra);

    setTxt("footerCol3Title", t.footerCol3Title);
    setTxt("footerLinkOffline", t.footerLinkOffline);
    setTxt("footerLinkPwa", t.footerLinkPwa);
    setTxt("footerLinkSitemap", t.footerLinkSitemap);
    setHtml("footerCopyright", t.footerCopyright);
    updateThemeToggleUI();

    if (typeof updateClockDisplay === "function") {
      updateClockDisplay();
    }
  }

  /* =========================================================
     3. LIVE INDIAN STANDARD TIME (IST) CLOCK (CHHATH PUJA STYLE)
     ========================================================= */
  const langDays = {
    hi: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };
  const langMonths = {
    hi: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
    en: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
  };

  let updateClockDisplay = null;
  let isClockHovered = false;

  function initClock() {
    const timeWidget = document.getElementById("timeWidget") || document.getElementById("liveClockWidget");

    if (timeWidget) {
      timeWidget.addEventListener("mouseenter", () => {
        isClockHovered = true;
        if (typeof updateClockDisplay === "function") updateClockDisplay();
      });
      timeWidget.addEventListener("mouseleave", () => {
        isClockHovered = false;
        if (typeof updateClockDisplay === "function") updateClockDisplay();
      });
      timeWidget.addEventListener("click", () => {
        isClockHovered = !isClockHovered;
        if (typeof updateClockDisplay === "function") updateClockDisplay();
      });
    }

    updateClockDisplay = function update() {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;

      const lang = currentLang === "en" ? "en" : "hi";
      const days = langDays[lang] || langDays.hi;
      const months = langMonths[lang] || langMonths.hi;

      const timeEl = document.getElementById("currentTime") || document.getElementById("liveIstTime");
      const dateEl = document.getElementById("currentDate") || document.getElementById("liveIstDate");

      if (timeEl) {
        if (isClockHovered) {
          timeEl.textContent = `${hours}:${minutes}:${seconds} ${ampm}`;
        } else {
          timeEl.textContent = `${hours}:${minutes} ${ampm}`;
        }
      }
      if (dateEl) {
        dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
      }
      if (timeWidget && TRANSLATIONS[lang]) {
        timeWidget.title = TRANSLATIONS[lang].timeWidgetTitle || "Indian Standard Time (IST)";
      }
    };

    updateClockDisplay();
    setInterval(updateClockDisplay, 1000);
  }

  /* =========================================================
     4. CATEGORY FILTER NAVIGATION (BUTTONS)
     ========================================================= */
  function initCategoryFilters() {
    const buttons = document.querySelectorAll(".cat-btn");
    const cards = document.querySelectorAll(".category-card");

    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const targetCategory = btn.getAttribute("data-filter");
        if (!targetCategory) return;

        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeFilter = targetCategory;

        // Filter category cards with animation
        cards.forEach((card) => {
          const cardCat = card.getAttribute("data-category");
          if (targetCategory === "all" || cardCat === targetCategory) {
            card.style.display = "flex";
            setTimeout(() => {
              card.style.opacity = "1";
              card.style.transform = "translateY(0)";
            }, 30);
          } else {
            card.style.opacity = "0";
            card.style.transform = "translateY(15px)";
            setTimeout(() => {
              card.style.display = "none";
            }, 250);
          }
        });
      });
    });
  }

  /* =========================================================
     5. INSTANT AUDIO PREVIEWER DOCK
     ========================================================= */
  function initPreviewAudio() {
    const dock = document.getElementById("miniPlayerDock");
    const dockTitle = document.getElementById("dockTitle");
    const dockArtist = document.getElementById("dockArtist");
    const dockThumb = document.getElementById("dockThumb");
    const dockPlayBtn = document.getElementById("dockPlayBtn");
    const dockCloseBtn = document.getElementById("dockCloseBtn");
    const progressBar = document.getElementById("dockProgressBar");
    const progressWrap = document.getElementById("dockProgressWrap");

    if (!dock || !dockPlayBtn) return;

    // Attach click to preview buttons on category cards
    const previewButtons = document.querySelectorAll(".btn-preview-action");
    previewButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const catKey = btn.getAttribute("data-preview-cat");
        if (PREVIEW_SONGS[catKey]) {
          playTrack(PREVIEW_SONGS[catKey]);
        }
      });
    });

    // Attach click to trending songs
    const trendingCards = document.querySelectorAll(".trending-song-card");
    trendingCards.forEach((card) => {
      card.addEventListener("click", () => {
        const file = card.getAttribute("data-src");
        const title = card.querySelector(".song-title")?.textContent || "Song Preview";
        const artist = card.querySelector(".song-meta")?.textContent || "";
        const icon = card.querySelector(".trending-avatar")?.textContent || "🎵";

        if (file) {
          playTrack({ title, artist, file, icon });
        }
      });
    });

    function playTrack(track) {
      currentPlayingTrack = track;
      audioPlayer.src = track.file;
      audioPlayer.play().then(() => {
        isPlaying = true;
        dock.classList.add("active", "playing");
        updateDockUI();
        updateHomeMediaSession();
      }).catch(err => console.warn("Audio play prevented:", err));
    }

    function updateHomeMediaSession() {
      if (!("mediaSession" in navigator) || !currentPlayingTrack) return;
      try {
        const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentPlayingTrack.title,
          artist: currentPlayingTrack.artist || "PlayX Preview",
          album: "PlayX Music Hub",
          artwork: [
            { src: new URL("images/playx_icon.png", origin + window.location.pathname).href, sizes: "512x512", type: "image/png" },
            { src: new URL("favicon.io/android-chrome-512x512.png", origin + window.location.pathname).href, sizes: "512x512", type: "image/png" }
          ]
        });
        navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      } catch (e) {}
    }

    if ("mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", () => {
          if (!isPlaying) {
            audioPlayer.play();
            isPlaying = true;
            dock.classList.add("playing");
            updateDockUI();
            updateHomeMediaSession();
          }
        });
        navigator.mediaSession.setActionHandler("pause", () => {
          if (isPlaying) {
            audioPlayer.pause();
            isPlaying = false;
            dock.classList.remove("playing");
            updateDockUI();
            updateHomeMediaSession();
          }
        });
        navigator.mediaSession.setActionHandler("stop", () => {
          audioPlayer.pause();
          isPlaying = false;
          dock.classList.remove("active", "playing");
          try { navigator.mediaSession.playbackState = "none"; } catch (e) {}
        });
        navigator.mediaSession.setActionHandler("seekto", (details) => {
          if (details.seekTime !== undefined && isFinite(details.seekTime) && audioPlayer.duration) {
            audioPlayer.currentTime = details.seekTime;
          }
        });
      } catch (e) {}
    }

    const originalHomeTitle = document.title;

    function updateDockUI() {
      if (!currentPlayingTrack) {
        document.title = originalHomeTitle;
        return;
      }
      dockTitle.textContent = currentPlayingTrack.title;
      dockArtist.textContent = currentPlayingTrack.artist;
      dockThumb.textContent = currentPlayingTrack.icon || "🎵";
      dockPlayBtn.innerHTML = isPlaying
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      if (isPlaying) {
        document.title = "▶ " + currentPlayingTrack.title + " | PlayX";
      } else {
        document.title = originalHomeTitle;
      }
      if ("mediaSession" in navigator) {
        try { navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"; } catch (e) {}
      }
    }

    dockPlayBtn.addEventListener("click", () => {
      if (isPlaying) {
        audioPlayer.pause();
        isPlaying = false;
        dock.classList.remove("playing");
      } else {
        audioPlayer.play();
        isPlaying = true;
        dock.classList.add("playing");
      }
      updateDockUI();
      updateHomeMediaSession();
    });

    dockCloseBtn.addEventListener("click", () => {
      audioPlayer.pause();
      isPlaying = false;
      document.title = originalHomeTitle;
      dock.classList.remove("active", "playing");
      if ("mediaSession" in navigator) {
        try { navigator.mediaSession.playbackState = "none"; } catch (e) {}
      }
    });

    // Audio progress updates
    audioPlayer.addEventListener("timeupdate", () => {
      if (audioPlayer.duration) {
        const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        if (progressBar) progressBar.style.width = pct + "%";
        if ("mediaSession" in navigator && "setPositionState" in navigator.mediaSession && Math.floor(audioPlayer.currentTime) % 2 === 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: audioPlayer.duration,
              playbackRate: audioPlayer.playbackRate || 1.0,
              position: audioPlayer.currentTime
            });
          } catch (e) {}
        }
      }
    });

    audioPlayer.addEventListener("ended", () => {
      isPlaying = false;
      dock.classList.remove("playing");
      updateDockUI();
      if ("mediaSession" in navigator) {
        try { navigator.mediaSession.playbackState = "none"; } catch (e) {}
      }
    });

    if (progressWrap) {
      const handleSeek = (e) => {
        if (!audioPlayer.duration || !isFinite(audioPlayer.duration)) return;
        const rect = progressWrap.getBoundingClientRect();
        const clientX = (e.touches && e.touches[0] ? e.touches[0].clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : e.clientX));
        if (clientX === undefined) return;
        const clickX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const width = rect.width;
        if (width > 0) {
          audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
        }
      };

      progressWrap.addEventListener("click", handleSeek);
      progressWrap.addEventListener("touchend", handleSeek, { passive: true });
    }
  }

  // Register High-Performance Service Worker for instant offline app shell caching
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch((err) => {
        console.debug("ServiceWorker registration notice:", err);
      });
    });
  }

})();
