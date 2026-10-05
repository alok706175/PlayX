/* =========================================================
   सुर संगम | Chhath Ghat Mahaparv & Festival Music Hub
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
  let currentLang = localStorage.getItem("playx_lang") || "en";
  let activeFilter = "all";
  let currentPlayingTrack = null;
  let audioPlayer = new Audio();
  let isPlaying = false;

  const TRANSLATIONS = {
    hi: {
      btnText: "हिंदी",
      btnTitle: "वर्तमान भाषा: हिंदी (अंग्रेज़ी में बदलने के लिए क्लिक करें)",
      timeWidgetTitle: "भारतीय मानक समय (IST)",
      sectionTag: "POPULAR COLLECTIONS",
      sectionTitle: "त्यौहार व संगीत श्रेणियां",
      sectionSubtitle: "अपनी पसंदीदा श्रेणी चुनें और बेहतरीन गीतों के विशेष प्लेयर का आनंद लें।",
      chhathTitle: "छठ पूजा महापर्व गीत",
      chhathSub: "Chhath Puja Mahaparv Geet",
      chhathDesc: "उगी हे दीनानाथ, केलवा के पात पर, काँच ही बाँस के बहंगिया सहित शारदा सिन्हा, पवन सिंह, खेसारी लाल यादव और अनुराधा पौडवाल के पावन अर्घ्य गीत।",
      chhathPills: ["25+ पारंपरिक गीत", "320 Kbps HD", "ऑफलाइन प्लेयर"],
      hindiTitle: "हिंदी सुपरहिट बॉलीवुड गीत",
      hindiSub: "Superhit Hindi Songs (Bollywood)",
      hindiDesc: "90s के सदाबहार क्लासिक्स, रोमांटिक मेलोडीज, और डांस ट्रैक्स। अरिजीत सिंह, सोनू निगम, लता मंगेशकर, कुमार सानु, उदित नारायण और अलका याग्निक के बेहतरीन नगमे।",
      hindiPills: ["70 क्लासिक हिट्स", "320 Kbps HD", "डार्क मोड प्लेयर"],
      saawanTitle: "सावन शिव भजन व बोल बम",
      saawanSub: "Saawan Songs & Shiv Bhajan",
      saawanDesc: "सावन शिव भजन व बोल बम के पावन भक्ति गीत। इस श्रेणी के ओरिजिनल गाने जल्द ही जोड़े जाएंगे।",
      saawanPills: ["⏳ जल्द आ रहा है", "बोल बम भजन", "PlayX स्पेशल"],
      durgaTitle: "दुर्गा पूजा व नवरात्रि भक्ति गीत",
      durgaSub: "Durga Puja & Navratri Bhakti",
      durgaDesc: "माता रानी के पावन भजन, आरती और नवरात्रि की विशेष भेंटें। इस श्रेणी के ओरिजिनल गाने जल्द ही जोड़े जाएंगे।",
      durgaPills: ["⏳ जल्द आ रहा है", "नवरात्रि स्पेशल", "PlayX स्पेशल"],
      holiTitle: "होली के रंग-बिरंगे गाने व फाग",
      holiSub: "Holi Special Songs & Fagun Geet",
      holiDesc: "रंगों के महापर्व होली के सुपरहिट गाने और फाग। इस श्रेणी के ओरिजिनल गाने जल्द ही जोड़े जाएंगे।",
      holiPills: ["⏳ जल्द आ रहा है", "होली उत्सव", "PlayX स्पेशल"],
      bhojpuriTitle: "भोजपुरी सुपरहिट गाने",
      bhojpuriSub: "Bhojpuri Superhit Songs & Desi Hits",
      bhojpuriDesc: "भोजपुरी के सुपरहिट लोकगीत और संगीत संकलन। इस श्रेणी के ओरिजिनल गाने जल्द ही जोड़े जाएंगे।",
      bhojpuriPills: ["⏳ जल्द आ रहा है", "देसी हिट्स", "PlayX स्पेशल"],
      haryanviTitle: "हरियाणवी सुपरहिट गाने",
      haryanviSub: "Haryanvi Superhit Songs",
      haryanviDesc: "हरियाणवी सुपरहिट डीजे और फोक गाने। इस श्रेणी के ओरिजिनल गाने जल्द ही जोड़े जाएंगे।",
      haryanviPills: ["⏳ जल्द आ रहा है", "डीजे हिट्स", "PlayX स्पेशल"],
      punjabiTitle: "पंजाबी सुपरहिट गाने",
      punjabiSub: "Punjabi Superhit Songs & Bhangra Hits",
      punjabiDesc: "दिलजीत दोसांझ, सिद्धू मूसेवाला और गुरु रंधावा के सुपरहिट पंजाबी व भांगड़ा गाने। इस श्रेणी के ओरिजिनल गाने जल्द ही जोड़े जाएंगे।",
      punjabiPills: ["⏳ जल्द आ रहा है", "भांगड़ा बीट्स", "PlayX स्पेशल"],

      // Footer Translations
      footerBrandTagline: "A Largest Music Library Website.",
      footerCol1Title: "पर्व श्रेणियां",
      footerLinkChhath: "छठ पूजा महापर्व",
      footerLinkSaawan: "सावन शिव भजन",
      footerLinkDurga: "दुर्गा पूजा व नवरात्रि",
      footerLinkHoli: "होली के गाने व फाग",

      footerCol2Title: "संगीत संकलन",
      footerLinkHindi: "हिंदी सुपरहिट बॉलीवुड",
      footerLinkBhojpuri: "भोजपुरी सुपरहिट गाने",
      footerLinkHaryanvi: "हरियाणवी सुपरहिट गाने",
      footerLinkPunjabi: "पंजाबी सुपरहिट गाने",
      footerLinkMantra: "सूर्य गायत्री मंत्र",

      footerCol3Title: "सुविधाएं",
      footerLinkOffline: "ऑफ़लाइन डाउनलोड्स",
      footerLinkPwa: "PWA इंस्टॉल करें",
      footerLinkSitemap: "साइटमैप",
      footerCopyright: "Copyright © 2026 <strong>PlayX</strong> . All Rights Reserved."
    },
    en: {
      btnText: "English",
      btnTitle: "Current Language: English (Click to switch to Hindi)",
      timeWidgetTitle: "Indian Standard Time (IST)",
      sectionTag: "POPULAR COLLECTIONS",
      sectionTitle: "Festivals & Music Categories",
      sectionSubtitle: "Choose your favorite category and enjoy specialized HD music players.",
      chhathTitle: "Chhath Puja Mahaparv Songs",
      chhathSub: "Divine Sun God & Chhathi Maiya Songs",
      chhathDesc: "Sacred Chhath Puja bhajans including Ugi Hey Dinanath, Kelwa Ke Paat Par, and Kaanch Hi Baans Ke Bahangiya by legendary artists.",
      chhathPills: ["25+ Traditional Songs", "320 Kbps HD", "Offline Player"],
      hindiTitle: "Superhit Hindi Bollywood Songs",
      hindiSub: "Evergreen Classics & Romantic Melodies",
      hindiDesc: "Timeless 90s classics, romantic blockbusters, and energetic dance tracks from Arijit Singh, Sonu Nigam, Lata Mangeshkar, and Kumar Sanu.",
      hindiPills: ["70 Classic Hits", "320 Kbps HD", "Dark Mode Player"],
      saawanTitle: "Saawan Shiv Bhajans & Bol Bam",
      saawanSub: "Holy Kanwar Yatra & Lord Shiva Songs",
      saawanDesc: "Sacred Saawan and Kanwar Yatra bhajans. Original devotional songs for this category are coming soon.",
      saawanPills: ["⏳ Coming Soon", "Shiv Bhajans", "PlayX Special"],
      durgaTitle: "Durga Puja & Navratri Bhajans",
      durgaSub: "Maa Durga Aarti, Bhent & Garba-Dandiya",
      durgaDesc: "Maa Durga aarti, bhents and Navratri devotion. Original songs for this category are coming soon.",
      durgaPills: ["⏳ Coming Soon", "Navratri Special", "PlayX Special"],
      holiTitle: "Holi Special Hits & Fagun Songs",
      holiSub: "Festival of Colors & Folk Celebrations",
      holiDesc: "Celebration of colors, festive tracks and folk songs. Original songs for this category are coming soon.",
      holiPills: ["⏳ Coming Soon", "Holi Hits", "PlayX Special"],
      bhojpuriTitle: "Bhojpuri Superhit Songs",
      bhojpuriSub: "Desi Hits, Lokgeet & Dance Beats",
      bhojpuriDesc: "Top Bhojpuri folk and popular tracks. Original songs for this category are coming soon.",
      bhojpuriPills: ["⏳ Coming Soon", "Desi Folk", "PlayX Special"],
      haryanviTitle: "Haryanvi Superhit DJ Songs",
      haryanviSub: "Sapna Choudhary & DJ Bass Hits",
      haryanviDesc: "Haryanvi party hits and folk tunes. Original songs for this category are coming soon.",
      haryanviPills: ["⏳ Coming Soon", "Haryanvi Hits", "PlayX Special"],
      punjabiTitle: "Punjabi Superhit Songs",
      punjabiSub: "Diljit Dosanjh, Sidhu Moose Wala & Bhangra",
      punjabiDesc: "Top Punjabi party anthems and Bhangra beats. Original songs for this category are coming soon.",
      punjabiPills: ["⏳ Coming Soon", "Bhangra Beats", "PlayX Special"],

      // Footer Translations
      footerBrandTagline: "A Largest Music Library Website.",
      footerCol1Title: "Festival Categories",
      footerLinkChhath: "Chhath Puja Mahaparv",
      footerLinkSaawan: "Saawan Shiv Bhajans",
      footerLinkDurga: "Durga Puja & Navratri",
      footerLinkHoli: "Holi Songs & Fhag",

      footerCol2Title: "Music Collections",
      footerLinkHindi: "Superhit Hindi Bollywood",
      footerLinkBhojpuri: "Bhojpuri Superhit Songs",
      footerLinkHaryanvi: "Haryanvi Superhit DJ Songs",
      footerLinkPunjabi: "Punjabi Superhit Songs",
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
    initCanvas();
    initCategoryFilters();
    initSearch();
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
      const themeLabel = currentLang === "hi" ? "डार्क मोड" : "Dark Mode";
      themeBtn.innerHTML = `${SVG_MOON} <span id="themeBtnText">${themeLabel}</span>`;
      themeBtn.setAttribute("title", currentLang === "hi" ? "लाइट मोड में बदलें / Switch to Light Mode" : "Switch to Light Mode");
      themeBtn.setAttribute("aria-label", "Switch to Light Mode");
    } else {
      const themeLabel = currentLang === "hi" ? "लाइट मोड" : "Light Mode";
      themeBtn.innerHTML = `${SVG_SUN} <span id="themeBtnText">${themeLabel}</span>`;
      themeBtn.setAttribute("title", currentLang === "hi" ? "डार्क मोड में बदलें / Switch to Dark Mode" : "Switch to Dark Mode");
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
    langBtn.addEventListener("click", () => {
      currentLang = currentLang === "en" ? "hi" : "en";
      localStorage.setItem("playx_lang", currentLang);
      applyLanguage(currentLang);
    });
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
    hi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"],
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  };
  const langMonths = {
    hi: [
      "जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून",
      "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"
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
        timeWidget.title = TRANSLATIONS[lang].timeWidgetTitle || "भारतीय मानक समय (IST)";
      }
    };

    updateClockDisplay();
    setInterval(updateClockDisplay, 1000);
  }

  /* =========================================================
     4. FESTIVE PARTICLE CANVAS ANIMATION
     ========================================================= */
  function initCanvas() {
    const canvas = document.getElementById("particleCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = Math.min(width < 768 ? 35 : 75, 90);
    const colors = ["#ffb800", "#ff5722", "#e91e63", "#ffdd59", "#38bdf8"];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.6 - 0.2, // Upward drifting sparks
        alpha: Math.random() * 0.7 + 0.2
      });
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < 0) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.fill();
      });

      requestAnimationFrame(render);
    }

    render();
  }

  /* =========================================================
     5. CATEGORY FILTER NAVIGATION (BUTTONS)
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
     6. LIVE SEARCH ENGINE
     ========================================================= */
  function initSearch() {
    const searchInput = document.getElementById("heroSearchInput");
    const clearBtn = document.getElementById("searchClearBtn");
    const cards = document.querySelectorAll(".category-card");
    const trendingItems = document.querySelectorAll(".trending-song-card");

    if (!searchInput) return;

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = q ? "block" : "none";

      cards.forEach((card) => {
        const text = card.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          card.style.display = "flex";
          card.style.opacity = "1";
        } else {
          card.style.display = "none";
        }
      });

      trendingItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          item.style.display = "flex";
        } else {
          item.style.display = "none";
        }
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.style.display = "none";
        cards.forEach((c) => {
          c.style.display = "flex";
          c.style.opacity = "1";
        });
        trendingItems.forEach((t) => (t.style.display = "flex"));
      });
    }
  }

  /* =========================================================
     7. INSTANT AUDIO PREVIEWER DOCK
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
      }).catch(err => console.warn("Audio play prevented:", err));
    }

    function updateDockUI() {
      if (!currentPlayingTrack) return;
      dockTitle.textContent = currentPlayingTrack.title;
      dockArtist.textContent = currentPlayingTrack.artist;
      dockThumb.textContent = currentPlayingTrack.icon || "🎵";
      dockPlayBtn.innerHTML = isPlaying
        ? `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
        : `<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
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
    });

    dockCloseBtn.addEventListener("click", () => {
      audioPlayer.pause();
      isPlaying = false;
      dock.classList.remove("active", "playing");
    });

    // Audio progress updates
    audioPlayer.addEventListener("timeupdate", () => {
      if (audioPlayer.duration) {
        const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        if (progressBar) progressBar.style.width = pct + "%";
      }
    });

    audioPlayer.addEventListener("ended", () => {
      isPlaying = false;
      dock.classList.remove("playing");
      updateDockUI();
    });

    if (progressWrap) {
      progressWrap.addEventListener("click", (e) => {
        if (!audioPlayer.duration) return;
        const rect = progressWrap.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const width = rect.width;
        audioPlayer.currentTime = (clickX / width) * audioPlayer.duration;
      });
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
