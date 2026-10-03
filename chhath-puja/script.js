/* =========================================================
   छठ घाट (Chhath Ghat) - Audio Player & Interactive Script
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     0. BILINGUAL INTERNATIONALIZATION (HINDI / ENGLISH)
     ========================================================= */
  let currentLang = localStorage.getItem("playx_lang") || "en"; // Default English

  const i18n = {
    hi: {
      langBtnText: "हिंदी",
      langBtnTitle: "भाषा: हिंदी (अंग्रेज़ी में बदलने के लिए क्लिक करें)",
      langBtnAria: "अंग्रेज़ी भाषा में बदलें",
      timeWidgetTitle: "भारतीय मानक समय (IST)",
      navHomeText: "होम",
      navHomeTitle: "होम",
      navHomeAria: "होम पर जाएं",
      navAboutText: "परिचय",
      navAboutTitle: "छठ महापर्व के बारे में",
      navAboutAria: "छठ महापर्व के बारे में",
      navHindiSongText: "हिंदी गीत",
      navHindiSongTitle: "हिंदी गीत संग्रह पर जाएं",
      navHindiSongAria: "हिंदी गीत संग्रह पर जाएं",
      modeOfflineText: "ऑफलाइन",
      modeOfflineTitle: "ऑफलाइन मोड (ऑनलाइन वीडियो मोड चालू करने के लिए क्लिक करें)",
      modeOfflineAria: "ऑनलाइन वीडियो मोड पर जाएं",
      modeOnlineText: "ऑनलाइन",
      modeOnlineTitle: "ऑनलाइन मोड (ऑफलाइन ऑडियो मोड पर जाने के लिए क्लिक करें)",
      modeOnlineAria: "ऑफलाइन ऑडियो मोड पर जाएं",
      mainLogoText: "छठ घाट",
      taglineText: "॥ जय छठी मईया ॥",
      pillNum1: "१",
      pillText1: "नहाय-खाय",
      pillNum2: "२",
      pillText2: "खरना",
      pillNum3: "३",
      pillText3: "संध्या अर्घ्य",
      pillNum4: "४",
      pillText4: "उषा अर्घ्य",
      loadingSong: "Loading Chhath Geet...",
      playlistTitleOffline: "छठ गीत संग्रह (ऑफलाइन)",
      playlistTitleOnline: "छठ वीडियो संग्रह (ऑनलाइन)",
      playlistTitle: "छठ गीत संग्रह",
      playlistSubtitle: "पसंदीदा गीत चुनें और सुनें",
      playlistSearchPlaceholder: "गीत या गायक का नाम खोजें...",
      playlistSearchPlaceholderOffline: "गीत या गायक का नाम खोजें...",
      playlistSearchPlaceholderOnline: "वीडियो या गायक का नाम खोजें...",
      noSongsFound: "कोई गीत नहीं मिला",
      prevSongTitle: "पिछला गीत",
      playBtnTitle: "चलाएं / रोकें",
      nextSongTitle: "अगला गीत",
      playlistBtnTitle: "गीत सूची (Playlist)",
      playlistCloseTitle: "गीत सूची बंद करें",
      muteBtnTitle: "ध्वनि म्यूट / अनम्यूट",
      speedBtnTitle: "प्लेबैक स्पीड बदलें (Playback Speed)",
      speedMenuHeader: "स्पीड चुनें",
      speedMenuSlow: "धीमा",
      speedMenuSlowLight: "हल्का धीमा",
      speedMenuNormal: "सामान्य",
      speedMenuFastLight: "हल्का तेज़",
      speedMenuFast: "तेज़",
      speedMenuFastMore: "काफ़ी तेज़",
      volumeSliderTitle: "वॉल्यूम कम या ज्यादा करें",
      seekSliderTitle: "गीत को आगे या पीछे करें",
      ritualsBadge: "पवित्र परंपरा",
      ritualsHeading: "छठ महापर्व: चार दिवसीय अनुष्ठान",
      ritualsSubtitle: "लोक आस्था और प्रकृति की आराधना का पावन विधान",
      ritual1DayBadge: "प्रथम दिवस",
      ritual1Title: "नहाय-खाय",
      ritual1Desc: "छठ पर्व की शुरुआत पवित्र स्नान और शुद्ध सात्विक भोजन से होती है। इस दिन व्रती नदी या जलाशय में स्नान कर अरवा चावल, चने की दाल और कद्दू (लौकी) का प्रसाद ग्रहण करते हैं।",
      ritual1Highlight: "विशेष प्रसाद: कद्दू-भात एवं चना दाल",
      ritual2DayBadge: "द्वितीय दिवस",
      ritual2Title: "खरना (लोहंडा)",
      ritual2Desc: "इस दिन व्रती दिनभर निर्जला उपवास रखते हैं और शाम को मिट्टी के चूल्हे पर गुड़, अरवा चावल और गाय के दूध से बनी खीर तथा रोटी का भोग छठी मईया को अर्पित कर प्रसाद ग्रहण करते हैं।",
      ritual2Highlight: "विशेष प्रसाद: गुड़ की खीर और रोटी",
      ritual3DayBadge: "तृतीय दिवस",
      ritual3Title: "संध्या अर्घ्य (पहला अर्घ्य)",
      ritual3Desc: "कार्तिक शुक्ल षष्ठी की शाम को सूप, दउरा में ठेकुआ, मौसमी फल लेकर नदी/तालाब के घाट पर जाकर कमर तक जल में खड़े होकर अस्ताचलगामी (डूबते हुए) भगवान सूर्य को अर्घ्य दिया जाता है।",
      ritual3Highlight: "विशेष अर्घ्य: अस्ताचलगामी सूर्य देव को अर्घ्य",
      ritual4DayBadge: "चतुर्थ दिवस",
      ritual4Title: "उषा अर्घ्य (पारन)",
      ritual4Desc: "सप्तमी की भोर में उदीयमान (उगते हुए) सूर्य को अर्घ्य देकर 36 घंटे के कठिन निर्जला व्रत का समापन (पारन) होता है। छठी मईया से परिवार के सुख, स्वास्थ्य एवं दीर्घायु की प्रार्थना की जाती है।",
      ritual4Highlight: "विशेष अर्घ्य: उदीयमान सूर्य देव को अर्घ्य व पारन",
      mantraTitle: "॥ श्री सूर्य गायत्री मंत्र ॥",
      shareBtnLabel: "शेयर",
      shareBtnTitle: "छठ घाट शेयर करें",
      shareBtnAria: "शेयर विकल्प",
      whatsappLabel: "व्हाट्सएप",
      whatsappTitle: "व्हाट्सएप पर शेयर करें",
      whatsappAria: "व्हाट्सएप पर शेयर करें",
      facebookLabel: "फेसबुक",
      facebookTitle: "फेसबुक पर शेयर करें",
      facebookAria: "फेसबुक पर शेयर करें",
      instagramLabel: "इंस्टाग्राम",
      instagramTitle: "इंस्टाग्राम पर शेयर करें",
      instagramAria: "इंस्टाग्राम पर शेयर करें",
      copyMantraBtnText: "कॉपी",
      copyMantraTitle: "सूर्य गायत्री मंत्र कॉपी करें",
      shareMantraBtnText: "व्हाट्सएप पर शेयर करें",
      shareMantraTitle: "सूर्य गायत्री मंत्र व्हाट्सएप पर शेयर करें",
      toastOnline: "🌐 ऑनलाइन वीडियो मोड चालू (YouTube Background)",
      toastOffline: "📴 ऑफ़लाइन ऑडियो मोड चालू (MP3 Music)",
      toastLangSwitched: "भाषा बदलकर 'हिन्दी' कर दी गई है",
      toastMantraCopied: "✅ सूर्य गायत्री मंत्र कॉपी हो गया!",
      toastMuted: "🔇 म्यूट किया गया",
      toastUnmuted: "🔊 ध्वनि चालू",
      toastSpeed: "⚡ प्लेबैक गति: ",
      nowPlayingPrefix: "🎶 अब बज रहा है: ",
      downloadsTitle: "डाउनलोड्स",
      downloadsNavTitle: "डाउनलोड किए गए गीत देखें",
      allSongsTab: "सभी गीत",
      downloadedTab: "डाउनलोड्स",
      noDownloadsFound: "अभी कोई गीत डाउनलोड नहीं किया गया है। ऑफ़लाइन सुनने के लिए किसी भी गीत के पास ↓ बटन दबाएं।",
      storageLabel: "ऑफ़लाइन स्टोरेज:",
      clearStorageConfirm: "क्या आप सभी डाउनलोड किए गए गीतों को हटाना चाहते हैं?",
      clearStorageSuccess: "🗑 सभी डाउनलोड किए गए गीत हटा दिए गए हैं।",
      downloadingToast: "डाउनलोड हो रहा है: ",
      downloadCompleteToast: "ऑफ़लाइन सुनने के लिए डाउनलोड पूरा हुआ ✓",
      downloadFailedToast: "डाउनलोड विफल रहा। कृपया पुनः प्रयास करें।",
      songDeletedToast: "🗑 गीत स्टोरेज से हटा दिया गया।",
      offlineSongPlaying: "ऑफ़लाइन लोकल कॉपी चल रही है",
      installAppBtn: "ऐप इंस्टॉल करें",
      offlinePlaybackWarning: "📴 आप ऑफ़लाइन हैं। बिना इंटरनेट सुनने के लिए इस गीत को ऑनलाइन रहते हुए डाउनलोड करें।"
    },
    en: {
      langBtnText: "English",
      langBtnTitle: "Language: English (Click to switch to Hindi)",
      langBtnAria: "Switch language to Hindi",
      timeWidgetTitle: "Indian Standard Time (IST)",
      navHomeText: "Home",
      navHomeTitle: "Home",
      navHomeAria: "Go to Home",
      navAboutText: "About",
      navAboutTitle: "About Chhath Mahaparv",
      navAboutAria: "About Chhath Mahaparv",
      navHindiSongText: "Hindi Song",
      navHindiSongTitle: "Go to Hindi Songs",
      navHindiSongAria: "Go to Hindi Songs",
      modeOfflineText: "Offline",
      modeOfflineTitle: "Offline Mode (Click to switch to Online Video Mode)",
      modeOfflineAria: "Switch to Online Video Mode",
      modeOnlineText: "Online",
      modeOnlineTitle: "Online Mode (Click to switch to Offline Audio Mode)",
      modeOnlineAria: "Switch to Offline Audio Mode",
      mainLogoText: "Chhath Ghat",
      taglineText: "॥ Jai Chhathi Maiya ॥",
      pillNum1: "1",
      pillText1: "Nahay-Khay",
      pillNum2: "2",
      pillText2: "Kharna",
      pillNum3: "3",
      pillText3: "Sandhya Arghya",
      pillNum4: "4",
      pillText4: "Usha Arghya",
      loadingSong: "Loading Chhath Songs...",
      playlistTitleOffline: "Offline Chhath Songs",
      playlistTitleOnline: "Online Live Videos",
      playlistTitle: "Chhath Songs Collection",
      playlistSubtitle: "Select & listen to devotional songs",
      playlistSearchPlaceholder: "Search song or singer name...",
      playlistSearchPlaceholderOffline: "Search song or singer name...",
      playlistSearchPlaceholderOnline: "Search video or singer name...",
      noSongsFound: "No songs found",
      prevSongTitle: "Previous Track",
      playBtnTitle: "Play / Pause",
      nextSongTitle: "Next Track",
      playlistBtnTitle: "Playlist",
      playlistCloseTitle: "Close Playlist",
      muteBtnTitle: "Mute / Unmute Volume",
      speedBtnTitle: "Change Playback Speed",
      speedMenuHeader: "Select Speed",
      speedMenuSlow: "Very Slow",
      speedMenuSlowLight: "Slow",
      speedMenuNormal: "Normal",
      speedMenuFastLight: "Slightly Fast",
      speedMenuFast: "Fast",
      speedMenuFastMore: "Faster",
      volumeSliderTitle: "Adjust Volume",
      seekSliderTitle: "Seek Track",
      ritualsBadge: "Sacred Tradition",
      ritualsHeading: "Chhath Mahaparv : 4-Day Sacred Rituals",
      ritualsSubtitle: "The sacred celebration of cosmic solar energy, faith, and nature worship",
      ritual1DayBadge: "Day 1",
      ritual1Title: "Nahay-Khay",
      ritual1Desc: "The festival begins with a holy bath and pure satvik meal. Devotees take a sacred bath in holy water bodies and consume pumpkin-rice and chana dal prasad.",
      ritual1Highlight: "Special Prasad: Bottle Gourd Rice & Chana Dal",
      ritual2DayBadge: "Day 2",
      ritual2Title: "Kharna",
      ritual2Desc: "Devotees observe a strict day-long fast without water, and in the evening offer jaggery kheer made with cow milk and roti to Chhathi Maiya before breaking the fast.",
      ritual2Highlight: "Special Prasad: Jaggery Rice Kheer & Roti",
      ritual3DayBadge: "Day 3",
      ritual3Title: "Sandhya Arghya",
      ritual3Desc: "On the evening of Kartik Shukla Shashthi, devotees gather at river ghats with bamboo baskets filled with thekua and fruits, standing in water to offer Arghya to the setting Sun.",
      ritual3Highlight: "Special Offering: Arghya to the Setting Sun",
      ritual4DayBadge: "Day 4",
      ritual4Title: "Usha Arghya",
      ritual4Desc: "At dawn on Saptami, devotees offer the final Arghya to the rising Sun, concluding the 36-hour fast with prayers for peace, prosperity and family longevity.",
      ritual4Highlight: "Special Offering: Arghya to Rising Sun & Paran",
      mantraTitle: "॥ Shri Surya Gayatri Mantra ॥",
      shareBtnLabel: "Share",
      shareBtnTitle: "Share Chhath Ghat",
      shareBtnAria: "Share options",
      whatsappLabel: "WhatsApp",
      whatsappTitle: "Share on WhatsApp",
      whatsappAria: "Share on WhatsApp",
      facebookLabel: "Facebook",
      facebookTitle: "Share on Facebook",
      facebookAria: "Share on Facebook",
      instagramLabel: "Instagram",
      instagramTitle: "Share on Instagram",
      instagramAria: "Share on Instagram",
      copyMantraBtnText: "Copy",
      copyMantraTitle: "Copy Surya Gayatri Mantra",
      shareMantraBtnText: "Share on WhatsApp",
      shareMantraTitle: "Share Surya Gayatri Mantra on WhatsApp",
      toastOnline: "🌐 Online Video Mode Active (YouTube Background)",
      toastOffline: "📴 Offline Audio Mode Active (MP3 Music)",
      toastLangSwitched: "Language switched to English",
      toastMantraCopied: "✅ Surya Gayatri Mantra copied!",
      toastMuted: "🔇 Volume Muted",
      toastUnmuted: "🔊 Volume Unmuted",
      toastSpeed: "⚡ Playback Speed: ",
      nowPlayingPrefix: "🎶 Now Playing: ",
      downloadsTitle: "Downloads",
      downloadsNavTitle: "View Downloaded Songs",
      allSongsTab: "All Songs",
      downloadedTab: "Downloads",
      noDownloadsFound: "No downloaded songs yet. Click ↓ on any song to download for offline listening.",
      storageLabel: "Offline Storage:",
      clearStorageConfirm: "Do you want to delete all downloaded songs?",
      clearStorageSuccess: "🗑 All downloaded songs have been removed.",
      downloadingToast: "Downloading: ",
      downloadCompleteToast: "Downloaded for offline listening ✓",
      downloadFailedToast: "Download failed. Please try again.",
      songDeletedToast: "🗑 Song removed from storage.",
      offlineSongPlaying: "Playing local offline copy",
      installAppBtn: "Install App",
      offlinePlaybackWarning: "📴 You're offline. Download this song while online to listen offline!"
    }
  };

  /* =========================================================
     1. LIVE CLOCK (IST)
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

    const days = langDays[currentLang] || langDays.hi;
    const months = langMonths[currentLang] || langMonths.hi;

    const timeEl = document.getElementById("currentTime");
    const dateEl = document.getElementById("currentDate");

    if (timeEl) {
      if (isClockHovered) {
        timeEl.textContent = `${hours}:${minutes}:${seconds} ${suffix}`;
      } else {
        timeEl.textContent = `${hours}:${minutes} ${suffix}`;
      }
    }
    if (dateEl) {
      dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
    }
    if (timeWidget && i18n[currentLang]) {
      timeWidget.title = i18n[currentLang].timeWidgetTitle;
    }
  }

  setInterval(updateClock, 1000);

  /* =========================================================
     2. TOAST NOTIFICATION UTILITY
     ========================================================= */
  let toastTimeout = null;
  function showToast(message, position = "center") {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;

    toast.textContent = message;
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
    }, 3200);
  }

  /* =========================================================
     3. WEB AUDIO SPIRITUAL CHIME / BELL
     ========================================================= */
  function playSpiritualChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const freqs = [528, 792, 1056]; // Auspicious harmonic frequencies
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, ctx.currentTime);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.12 / (i + 1), ctx.currentTime + 0.05 + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2 + i * 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.04);
        osc.stop(ctx.currentTime + 2.8 + i * 0.3);
      });
    } catch (e) {
      console.debug("AudioContext error:", e);
    }
  }

  /* =========================================================
     4. WHATSAPP SHARING
     ========================================================= */
  const SHARE_URL = "https://www.mahaparvchhathpuja.me/";

  function shareOnWhatsApp(customHeading) {
    const title = customHeading || "🌅 छठ महापर्व की हार्दिक शुभकामनाएं! 🙏";
    const body =
      `${title}\n\n` +
      `सूर्य देव और छठी मईया की कृपा आप और आपके पूरे परिवार पर सदा बनी रहे।\n\n` +
      `🎶 *छठ पूजा के पावन एवं मधुर गीत यहां सुनें:* \n${SHARE_URL}\n\n` +
      `॥ जय छठी मईया • ॐ सूर्याय नमः ॥ ☀️`;

    const waLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`;
    window.open(waLink, "_blank", "noopener,noreferrer");
    showToast("✨ व्हाट्सएप पर साझा किया जा रहा है...");
  }

  /* Share Dropdown Trigger & Mobile Tap Support */
  const shareDropdown = document.getElementById("shareDropdown");
  const shareMainBtn = document.getElementById("shareMainBtn");
  if (shareMainBtn && shareDropdown) {
    shareMainBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = shareDropdown.classList.toggle("open");
      shareMainBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  document.addEventListener("click", (e) => {
    if (shareDropdown && !shareDropdown.contains(e.target)) {
      shareDropdown.classList.remove("open");
      if (shareMainBtn) shareMainBtn.setAttribute("aria-expanded", "false");
    }
  });

  const waShareBtn = document.getElementById("whatsappShareBtn");
  if (waShareBtn) {
    waShareBtn.addEventListener("click", () => {
      shareOnWhatsApp("🌅 छठ घाट — पावन छठ महापर्व के मधुर गीत 🙏");
    });
  }

  /* Facebook Share */
  const fbShareBtn = document.getElementById("facebookShareBtn");
  if (fbShareBtn) {
    fbShareBtn.addEventListener("click", () => {
      const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent("🌅 छठ महापर्व की हार्दिक शुभकामनाएं! 🙏 सुनिए पावन छठ पूजा के गीत")}`;
      window.open(fbUrl, "_blank", "noopener,noreferrer,width=600,height=500");
      showToast("✨ फेसबुक पर साझा किया जा रहा है...");
    });
  }

  /* Instagram Share */
  const instaShareBtn = document.getElementById("instagramShareBtn");
  if (instaShareBtn) {
    instaShareBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(SHARE_URL);
        showToast("✨ लिंक कॉपी हुआ! Instagram पर शेयर करें 📸");
      } catch (e) {
        showToast("✨ Instagram खोला जा रहा है...");
      }
      setTimeout(() => {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }, 500);
    });
  }

  const shareMantraBtn = document.getElementById("shareMantraBtn");
  if (shareMantraBtn) {
    shareMantraBtn.addEventListener("click", () => {
      const mantraMsg = currentLang === "en"
        ? `☀️ *Shri Surya Gayatri Mantra:*\n` +
        `Om Adityaaya Vidmahe Divakaraya Dhimahi\nTannah Suryaah Prachodayat\n\n` +
        `"Om, let me meditate on the Sun God, the maker of the day. Give me higher intellect, and let the Sun God illuminate my mind."\n\n` +
        `Listen to devotional Chhath songs on Chhath Ghat: ${SHARE_URL}`
        : `☀️ *श्री सूर्य गायत्री मंत्र:*\n` +
        `ॐ आदित्याय विद्महे दिवाकराय धीमहि।\nतन्नः सूर्यः प्रचोदयात् ॥\n\n` +
        `"हम समस्त संसार को प्रकाशित करने वाले परम तेजस्वी भगवान सूर्य देव का ध्यान करते हैं। वे भुवन भास्कर हमारी बुद्धि को ज्ञान और सन्मार्ग की ओर प्रेरित करें।"` +
        `\n\nछठ घाट पर सुनें भक्तिमय छठ गीत: ${SHARE_URL}`;
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mantraMsg)}`, "_blank");
    });
  }

  const copyMantraBtn = document.getElementById("copyMantraBtn");
  if (copyMantraBtn) {
    copyMantraBtn.addEventListener("click", async () => {
      const mantra = currentLang === "en"
        ? "Om Adityaaya Vidmahe Divakaraya Dhimahi Tannah Suryaah Prachodayat - \"Om, let me meditate on the Sun God, the maker of the day. Give me higher intellect, and let the Sun God illuminate my mind.\""
        : "ॐ आदित्याय विद्महे दिवाकराय धीमहि तन्नः सूर्यः प्रचोदयात् ॥ - \"हम समस्त संसार को प्रकाशित करने वाले परम तेजस्वी भगवान सूर्य देव का ध्यान करते हैं। वे भुवन भास्कर हमारी बुद्धि को ज्ञान और सन्मार्ग की ओर प्रेरित करें।\"";
      try {
        await navigator.clipboard.writeText(mantra);
        const originalText = copyMantraBtnText ? copyMantraBtnText.textContent : "Copy";
        if (copyMantraBtnText) copyMantraBtnText.textContent = currentLang === "en" ? "✓ Copied!" : "✓ कॉपी हुआ!";
        copyMantraBtn.style.background = "linear-gradient(135deg, #107C41 0%, #0B6A35 100%)";
        copyMantraBtn.style.borderColor = "#2ae772";
        showToast(currentLang === "en" ? "📋 Surya Gayatri Mantra copied!" : "📋 सूर्य गायत्री मंत्र भावार्थ सहित कॉपी हो गया!");
        setTimeout(() => {
          if (copyMantraBtnText) copyMantraBtnText.textContent = originalText;
          copyMantraBtn.style.background = "";
          copyMantraBtn.style.borderColor = "";
        }, 2200);
      } catch (err) {
        showToast((currentLang === "en" ? "📋 Copied: " : "📋 कॉपी हुआ: ") + mantra);
      }
    });
  }

  /* =========================================================
     5. FESTIVE FLOATING PARTICLES & GLOWING EMBERS CANVAS
     ========================================================= */
  const canvas = document.getElementById("festiveCanvas");
  let ctx = canvas && typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
  let particles = [];
  let sparks = [];
  let embers = [];

  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  class Petal {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * (canvas ? canvas.width : window.innerWidth);
      this.y = initial ? Math.random() * (canvas ? canvas.height : window.innerHeight) : -25;
      this.size = Math.random() * 6.5 + 4;
      this.speedY = Math.random() * 0.75 + 0.35;
      this.speedX = Math.sin(Math.random() * 4) * 0.6;
      this.angle = Math.random() * 360;
      this.spin = (Math.random() - 0.5) * 1.6;
      this.opacity = Math.random() * 0.45 + 0.35;
      this.color = Math.random() > 0.35 ? "#ffb84d" : "#ff7043";
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.015) * 0.5;
      this.angle += this.spin;
      if (canvas && this.y > canvas.height + 25) {
        this.reset();
      }
    }
    draw() {
      if (!ctx) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.angle * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size, this.size * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class GlowEmber {
    constructor() {
      this.reset(true);
    }
    reset(initial = false) {
      this.x = Math.random() * (canvas ? canvas.width : window.innerWidth);
      this.y = initial ? Math.random() * (canvas ? canvas.height : window.innerHeight) : (canvas ? canvas.height + 15 : window.innerHeight + 15);
      this.size = Math.random() * 2.5 + 1.2;
      this.speedY = -(Math.random() * 0.5 + 0.2);
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.6 + 0.2;
      this.pulse = Math.random() * Math.PI;
    }
    update() {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.y * 0.02) * 0.3;
      this.pulse += 0.04;
      if (canvas && this.y < -20) {
        this.reset();
      }
    }
    draw() {
      if (!ctx) return;
      const alpha = Math.max(0, this.opacity * (0.6 + 0.4 * Math.sin(this.pulse)));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffe082";
      ctx.shadowBlur = 8;
      ctx.shadowColor = "#ffb300";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  class Spark {
    constructor(x, y) {
      this.x = x || (canvas ? canvas.width / 2 : window.innerWidth / 2);
      this.y = y || (canvas ? canvas.height / 2 : window.innerHeight / 2);
      this.vx = (Math.random() - 0.5) * 4.5;
      this.vy = (Math.random() - 0.5) * 4.5 - 1.5;
      this.size = Math.random() * 3.5 + 1.5;
      this.life = 1;
      this.decay = Math.random() * 0.025 + 0.015;
      this.color = Math.random() > 0.3 ? "#ffe082" : "#ff9100";
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.05;
      this.life -= this.decay;
    }
    draw() {
      if (!ctx || this.life <= 0) return;
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#ffa000";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (canvas) {
    for (let i = 0; i < 24; i++) {
      particles.push(new Petal());
    }
    for (let i = 0; i < 20; i++) {
      embers.push(new GlowEmber());
    }

    // Interactive pointer trails
    window.addEventListener("pointermove", (e) => {
      if (Math.random() > 0.55 && sparks.length < 40) {
        sparks.push(new Spark(e.clientX, e.clientY));
      }
    }, { passive: true });
  }

  function spawnFestiveSparks(count) {
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.4;
    for (let i = 0; i < count; i++) {
      sparks.push(new Spark(centerX + (Math.random() - 0.5) * 100, centerY + (Math.random() - 0.5) * 50));
    }
  }

  function animateParticles() {
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      embers.forEach((emb) => {
        emb.update();
        emb.draw();
      });
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      sparks = sparks.filter((s) => s.life > 0);
      sparks.forEach((s) => {
        s.update();
        s.draw();
      });
    }
    requestAnimationFrame(animateParticles);
  }
  requestAnimationFrame(animateParticles);

  /* =========================================================
     7. MODERN & PROFESSIONAL AUDIO MEDIA PLAYBACK SYSTEM
     ========================================================= */

  // ---------------------------------------------------------
  // DOM ELEMENTS
  // ---------------------------------------------------------
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
  const playerElem = document.getElementById("offlinePlayer");

  const speedDropdown = document.getElementById("speedDropdown");
  const speedBtn = document.getElementById("speedBtn");
  const speedLabel = document.getElementById("speedLabel");
  const speedDropdownMenu = document.getElementById("speedDropdownMenu");
  const speedMenuItems = document.querySelectorAll(".speed-menu-item");

  const playlistToggleBtn = document.getElementById("playlistToggleBtn");
  const playlistCloseBtn = document.getElementById("playlistCloseBtn");
  const playlistModal = document.getElementById("playlistModal");
  const playlistList = document.getElementById("playlistList");
  const playlistTitle = document.getElementById("playlistTitle");
  const playlistTitleText = document.getElementById("playlistTitleText");
  const playlistSearch = document.getElementById("playlistSearch");
  const searchClearBtn = document.getElementById("searchClearBtn");

  const navDownloadsBtn = document.getElementById("navDownloadsBtn");
  const navDownloadsBadge = document.getElementById("navDownloadsBadge");
  const navDownloadsText = document.getElementById("navDownloadsText");
  const pwaInstallBtn = document.getElementById("pwaInstallBtn");
  const pwaInstallBtnText = document.getElementById("pwaInstallBtnText");

  const tabAllSongs = document.getElementById("tabAllSongs");
  const tabDownloadedSongs = document.getElementById("tabDownloadedSongs");
  const tabAllSongsText = document.getElementById("tabAllSongsText");
  const tabAllSongsCount = document.getElementById("tabAllSongsCount");
  const tabDownloadedText = document.getElementById("tabDownloadedText");
  const tabDownloadedCount = document.getElementById("tabDownloadedCount");

  const storageMgmtBar = document.getElementById("storageMgmtBar");
  const storageLabel = document.getElementById("storageLabel");
  const storageUsedVal = document.getElementById("storageUsedVal");
  const btnClearStorage = document.getElementById("btnClearStorage");

  let currentPlaylistTab = "all"; // "all" | "downloaded"

  const modeToggleBtn = document.getElementById("modeToggleBtn");
  const modeText = document.getElementById("modeText");
  const bgVideoContainer = document.getElementById("bgVideoContainer");

  const langToggleBtn = document.getElementById("langToggleBtn");
  const langText = document.getElementById("langText");
  const mainLogoText = document.getElementById("mainLogoText");
  const taglineText = document.getElementById("taglineText");

  const ritualsHeading = document.getElementById("ritualsHeading");
  const ritual1DayBadge = document.getElementById("ritual1DayBadge");
  const ritual1Title = document.getElementById("ritual1Title");
  const ritual1Desc = document.getElementById("ritual1Desc");
  const ritual1Highlight = document.getElementById("ritual1Highlight");
  const ritual2DayBadge = document.getElementById("ritual2DayBadge");
  const ritual2Title = document.getElementById("ritual2Title");
  const ritual2Desc = document.getElementById("ritual2Desc");
  const ritual2Highlight = document.getElementById("ritual2Highlight");
  const ritual3DayBadge = document.getElementById("ritual3DayBadge");
  const ritual3Title = document.getElementById("ritual3Title");
  const ritual3Desc = document.getElementById("ritual3Desc");
  const ritual3Highlight = document.getElementById("ritual3Highlight");
  const ritual4DayBadge = document.getElementById("ritual4DayBadge");
  const ritual4Title = document.getElementById("ritual4Title");
  const ritual4Desc = document.getElementById("ritual4Desc");
  const ritual4Highlight = document.getElementById("ritual4Highlight");

  const mantraTitle = document.getElementById("mantraTitle");
  const mantraText = document.getElementById("mantraText");
  const copyMantraBtnText = document.getElementById("copyMantraBtnText");
  const shareMantraBtnText = document.getElementById("shareMantraBtnText");

  // Speculative audio preloader for zero-latency gapless transitions
  const bgPreloadAudio = document.getElementById("bgPreloadAudio") || (function () {
    const a = document.createElement("audio");
    a.id = "bgPreloadAudio";
    a.preload = "none";
    a.style.display = "none";
    a.setAttribute("aria-hidden", "true");
    document.body.appendChild(a);
    return a;
  })();

  // ---------------------------------------------------------
  // STATE
  // ---------------------------------------------------------
  let songs = [];
  let currentSong = 0;
  let playbackState = "paused"; // "playing" | "paused" | "loading" | "ended" | "error"
  let isPlaying = false;
  let isSeeking = false;
  let isMuted = false;
  let lastVolume = 1.0; // 0.0 - 1.0
  let isOnlineMode = false; // Dual mode: Offline MP3 audio vs Online live video
  let ytPlayer = null;
  let isYtReady = false;
  let isSwitchingTrack = false;
  let isActionLocked = false; // Debounce rapid click duplicates
  let progressInterval = null;
  let seekDebounceTimeout = null;
  let lastSavedPosition = 0;
  let wakeLockSentinel = null;
  let lastPreloadedIdx = -1;

  // Cached DOM state to prevent unnecessary updates
  let lastRenderedCurrentTimeSec = -1;
  let lastRenderedDurationSec = -1;
  let lastRenderedProgressPct = -1;

  const PLAYBACK_SPEEDS = [
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1.0, label: "1.0x" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.50x" },
    { value: 1.75, label: "1.75x" },
    { value: 2.0, label: "2.0x" }
  ];
  let currentSpeedIndex = 2; // Default 1.0x

  // ---------------------------------------------------------
  // LOCAL STORAGE HELPERS
  // ---------------------------------------------------------
  const STORAGE_KEYS = {
    LAST_SONG: "chhath_player_last_song",
    LAST_POS: "chhath_player_last_pos",
    VOLUME: "chhath_player_volume",
    MUTED: "chhath_player_muted"
  };

  function safeStorageGet(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) { }
  }

  function savePlayerStatePeriodic(force = false) {
    const cur = getActiveCurrentTime();
    if (force || Math.abs(cur - lastSavedPosition) >= 3) {
      lastSavedPosition = cur;
      safeStorageSet(STORAGE_KEYS.LAST_SONG, currentSong.toString());
      if (cur > 0) {
        safeStorageSet(STORAGE_KEYS.LAST_POS, cur.toFixed(2));
      }
    }
  }

  // ---------------------------------------------------------
  // PLAYLIST (Dynamic JSON Fetching, Normalization & Caching)
  // ---------------------------------------------------------
  function normalizeSong(item, idx) {
    const title = item.title || item.name || `Chhath Geet ${idx + 1}`;
    const titleEn = item.titleEn || item.nameEn || title;
    const artist = item.artist || item.singer || (currentLang === "en" ? "Chhath Mahaparv" : "छठ महापर्व");
    const artistEn = item.artistEn || item.singerEn || artist;
    const album = item.album || (currentLang === "en" ? "Chhath Ghat" : "छठ घाट");
    const src = item.src || item.file || "";
    const cover = item.cover || item.artwork || "../favicon.io/android-chrome-512x512.png";
    const videoId = item.videoId || "";
    const embedUrl = item.embedUrl || "";

    return {
      id: item.id || (idx + 1),
      title: title,
      name: title,
      titleEn: titleEn,
      nameEn: titleEn,
      artist: artist,
      singer: artist,
      artistEn: artistEn,
      singerEn: artistEn,
      album: album,
      src: src,
      file: src,
      cover: cover,
      videoId: videoId,
      embedUrl: embedUrl,
      ytName: item.ytName || title,
      ytNameEn: item.ytNameEn || titleEn,
      ytSinger: item.ytSinger || artist,
      ytSingerEn: item.ytSingerEn || artistEn
    };
  }

  async function loadOfflineSongs() {
    try {
      let rawList = [];

      // 1. Try fetching songs.json directly
      try {
        const res = await fetch("songs.json", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            rawList = data;
          }
        }
      } catch (e) {
        console.warn("Primary songs.json fetch notice, trying fallback:", e);
      }

      // 2. Fallback to cloudinary_songs.json if needed
      if (!rawList || rawList.length === 0) {
        try {
          const res = await fetch("cloudinary_songs.json", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              rawList = data;
            }
          }
        } catch (e) {
          console.warn("Cloudinary fallback fetch error:", e);
        }
      }

      // 3. Fetch YouTube metadata for dual online video mode
      let ytList = [];
      try {
        const ytRes = await fetch("youtube_songs.json", { cache: "no-store" });
        if (ytRes.ok) ytList = await ytRes.json();
      } catch (e) { }

      // 4. Merge & Normalize
      const maxLen = Math.max(rawList.length, ytList.length);
      if (maxLen === 0) {
        throw new Error("Empty playlist received");
      }

      songs = [];
      for (let i = 0; i < maxLen; i++) {
        const r = rawList[i] || {};
        const y = ytList[i] || {};
        const merged = {
          ...r,
          videoId: y.videoId || r.videoId || "",
          embedUrl: y.embedUrl || r.embedUrl || "",
          ytName: y.name || r.title || r.name || "",
          ytNameEn: y.nameEn || r.titleEn || r.nameEn || "",
          ytSinger: y.singer || r.artist || r.singer || "",
          ytSingerEn: y.singerEn || r.artistEn || r.singerEn || ""
        };
        songs.push(normalizeSong(merged, i));
      }

      // Restore saved volume and mute preferences from localStorage
      restoreVolumeAndMuteState();

      // Restore last selected song and position (respecting browser autoplay rules)
      const savedSongIdx = parseInt(safeStorageGet(STORAGE_KEYS.LAST_SONG, "0"), 10);
      let targetIdx = (!isNaN(savedSongIdx) && savedSongIdx >= 0 && savedSongIdx < songs.length) ? savedSongIdx : 0;
      if (!isOnlineMode && (!songs[targetIdx] || (!songs[targetIdx].src && !songs[targetIdx].file))) {
        const firstPlayable = songs.findIndex(s => Boolean(s.src || s.file));
        targetIdx = firstPlayable >= 0 ? firstPlayable : 0;
      }
      currentSong = targetIdx;

      updatePlaylistHeaderUI();
      renderPlaylist();
      displaySongInfo(currentSong);

      // Load initial track without autoplaying
      loadSong(currentSong, false);

      const savedPos = parseFloat(safeStorageGet(STORAGE_KEYS.LAST_POS, "0"));
      if (!isNaN(savedPos) && savedPos > 0 && offlineAudio) {
        const onFirstMeta = () => {
          if (offlineAudio.duration && isFinite(offlineAudio.duration) && savedPos < offlineAudio.duration) {
            offlineAudio.currentTime = savedPos;
            updateLiveProgress();
          }
          offlineAudio.removeEventListener("loadedmetadata", onFirstMeta);
        };
        offlineAudio.addEventListener("loadedmetadata", onFirstMeta);
      }

      // Background speculative preloading
      preloadNextTrack();
    } catch (error) {
      console.error("Songs playlist initialization error:", error);
      handlePlaybackError({
        message: currentLang === "en" ? "Failed to load playlist. Please check your connection." : "गीत सूची लोड नहीं हो सकी। कृपया इंटरनेट जांचें।"
      });
    }
  }

  // ---------------------------------------------------------
  // AUDIO INITIALIZATION
  // ---------------------------------------------------------
  if (offlineAudio) {
    offlineAudio.preload = "auto";

    offlineAudio.addEventListener("loadstart", () => {
      if (isPlaying) setPlayerState("loading");
    });

    offlineAudio.addEventListener("waiting", () => {
      if (isPlaying) setPlayerState("loading");
    });

    offlineAudio.addEventListener("canplay", () => {
      if (isPlaying) setPlayerState("playing");
      updateLiveProgress();
    });

    offlineAudio.addEventListener("play", () => {
      if (!isOnlineMode) {
        setPlayerState("playing");
      }
      requestWakeLock();
    });

    offlineAudio.addEventListener("playing", () => {
      if (!isOnlineMode) {
        setPlayerState("playing");
      }
      updateLiveProgress();
    });

    offlineAudio.addEventListener("pause", () => {
      if (!isOnlineMode && !isSwitchingTrack) {
        setPlayerState("paused");
      }
      savePlayerStatePeriodic(true);
      releaseWakeLock();
    });

    offlineAudio.addEventListener("timeupdate", () => {
      updateLiveProgress();
      savePlayerStatePeriodic(false);

      if (offlineAudio.duration && isFinite(offlineAudio.duration)) {
        if (offlineAudio.currentTime / offlineAudio.duration > 0.65 || (offlineAudio.duration - offlineAudio.currentTime) < 25) {
          preloadNextTrack();
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

    offlineAudio.addEventListener("seeked", () => {
      updateLiveProgress();
      savePlayerStatePeriodic(true);
    });

    offlineAudio.addEventListener("ended", () => {
      setPlayerState("ended");
      playNext(true);
    });

    offlineAudio.addEventListener("error", (e) => {
      handlePlaybackError(e);
    });
  }

  // ---------------------------------------------------------
  // SONG LOADING (loadSong with Smart Offline Resolving)
  // ---------------------------------------------------------
  async function displaySongInfo(index) {
    if (!songs[index]) return;
    const s = songs[index];
    const isEn = currentLang === "en";

    let title = isEn ? (s.titleEn || s.title) : s.title;
    let singer = isEn ? (s.artistEn || s.artist) : s.artist;

    if (isOnlineMode) {
      title = isEn ? (s.ytNameEn || title) : (s.ytName || title);
      singer = isEn ? (s.ytSingerEn || singer) : (s.ytSinger || singer);
    }

    const fullSinger = singer || (isEn ? "Chhath Devotional" : "छठ भक्ति");

    let isOfflineReady = false;
    if (window.OfflineManager) {
      isOfflineReady = await window.OfflineManager.isSongDownloaded(s);
    }

    if (songName) {
      songName.innerHTML = `${escapeHTML(title)} ${
        isOfflineReady
          ? '<span class="offline-playback-badge" title="Offline Local Audio">💾 Offline</span>'
          : ""
      }`;
    }
    if (songSinger) songSinger.textContent = fullSinger;
  }

  async function loadSong(index, autoplay = false) {
    if (!songs || songs.length === 0) return;

    // 1. Validate index with wrap-around
    const validIndex = ((index % songs.length) + songs.length) % songs.length;
    currentSong = validIndex;
    const song = songs[validIndex];
    if (!song) return;

    // 2. Update song title, artist, and UI text with offline status
    await displaySongInfo(validIndex);

    // 3. Reset progress
    if (progress) progress.value = 0;
    if (progressFill) progressFill.style.width = "0%";
    if (currentTime) currentTime.textContent = "0:00";
    lastRenderedProgressPct = 0;
    lastRenderedCurrentTimeSec = 0;

    // 4. Update Media Session metadata
    updateMediaSessionMetadata();

    // 5. Update playlist highlight
    renderPlaylist(playlistSearch ? playlistSearch.value : "");

    // 6. Handle Online vs Offline mode source setting
    if (isOnlineMode) {
      if (offlineAudio) {
        offlineAudio.pause();
        offlineAudio.currentTime = 0;
      }
      if (autoplay) {
        playOnlineSong(validIndex);
      }
    } else {
      if (offlineAudio) {
        // Smart Playback Logic: Check IndexedDB offline copy first
        let playback = { isOffline: false, canPlay: true, src: song.src || song.file };
        if (window.OfflineManager) {
          playback = await window.OfflineManager.resolvePlaybackSource(song);
        }

        if (!playback.canPlay) {
          setPlayerState("paused");
          const msg = i18n[currentLang] && i18n[currentLang].offlinePlaybackWarning
            ? i18n[currentLang].offlinePlaybackWarning
            : "📴 You're offline. Download this song while online to listen offline!";
          showToast(msg);
          return;
        }

        const fileSrc = playback.src;
        if (!fileSrc) {
          handlePlaybackError({ message: "Audio URL is missing for this track." });
          return;
        }

        if (playback.isOffline) {
          showToast("💾 " + (i18n[currentLang].offlineSongPlaying || "Playing offline local copy"));
        }

        if (offlineAudio.src !== fileSrc) {
          offlineAudio.src = fileSrc;
          offlineAudio.load();
        }

        const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
        const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
        offlineAudio.volume = isMuted ? 0 : volNum / 100;
        offlineAudio.playbackRate = activeRate;

        if (autoplay) {
          setPlayerState("loading");
          const playPromise = offlineAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setPlayerState("playing");
                preloadNextTrack();
              })
              .catch((err) => {
                console.warn("Autoplay policy or playback blocked:", err);
                setPlayerState("paused");
              });
          }
        } else {
          setPlayerState("paused");
        }
      }
    }

    // Save selected song index in localStorage
    safeStorageSet(STORAGE_KEYS.LAST_SONG, validIndex.toString());
  }

  // ---------------------------------------------------------
  // PLAYBACK CONTROLS (togglePlay, playPrevious, playNext, setPlayerState)
  // ---------------------------------------------------------
  function setPlayerState(state) {
    playbackState = state;
    isPlaying = (state === "playing");

    if (playIcon) {
      if (state === "playing") {
        playIcon.textContent = "❚❚";
      } else if (state === "loading") {
        playIcon.textContent = "⏳";
      } else {
        playIcon.textContent = "▶";
      }
    }

    if (playButton) {
      playButton.setAttribute("aria-pressed", isPlaying ? "true" : "false");
      playButton.setAttribute("aria-label", isPlaying ? "Pause Audio" : "Play Audio");
      if (state === "loading") {
        playButton.classList.add("loading");
      } else {
        playButton.classList.remove("loading");
      }
    }

    if (albumCover) {
      if (state === "playing") {
        albumCover.classList.add("spinning");
        albumCover.classList.remove("loading");
      } else if (state === "loading") {
        albumCover.classList.add("loading");
      } else {
        albumCover.classList.remove("spinning", "loading");
      }
    }

    if (playerElem) {
      if (state === "playing") {
        playerElem.classList.add("playing");
      } else {
        playerElem.classList.remove("playing");
      }
    }

    if (MEDIA_SESSION_SUPPORTED) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? "playing" : (state === "ended" ? "none" : "paused");
      } catch (e) { }
    }

    if (isPlaying) {
      startProgressSync();
    } else {
      stopProgressSync();
    }

    renderPlaylist(playlistSearch ? playlistSearch.value : "");
  }

  function togglePlay() {
    if (isActionLocked) return;
    isActionLocked = true;
    setTimeout(() => { isActionLocked = false; }, 200);

    if (isPlaying) {
      // Pause
      if (isOnlineMode) {
        if (isYtReady && ytPlayer && typeof ytPlayer.pauseVideo === "function") {
          try { ytPlayer.pauseVideo(); } catch (e) { }
        }
      } else {
        if (offlineAudio && !offlineAudio.paused) {
          offlineAudio.pause();
        }
      }
      setPlayerState("paused");
      showToast("⏸️ " + (currentLang === "en" ? "Audio Paused" : "गीत पॉज़ किया गया"));
    } else {
      // Play
      if (isOnlineMode) {
        if (offlineAudio && !offlineAudio.paused) offlineAudio.pause();
        if (isYtReady && ytPlayer && typeof ytPlayer.playVideo === "function") {
          try {
            const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
            if (!isMuted) {
              ytPlayer.unMute();
              ytPlayer.setVolume(volNum);
            }
            ytPlayer.playVideo();
          } catch (e) { }
        } else {
          playOnlineSong(currentSong);
        }
        setPlayerState("playing");
      } else {
        if (offlineAudio) {
          const song = songs[currentSong];
          if (song && offlineAudio.src !== (song.src || song.file)) {
            offlineAudio.src = song.src || song.file;
          }
          const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
          const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;
          offlineAudio.volume = isMuted ? 0 : volNum / 100;
          offlineAudio.playbackRate = activeRate;

          setPlayerState("loading");
          const playPromise = offlineAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setPlayerState("playing");
                preloadNextTrack();
              })
              .catch((err) => {
                console.warn("Playback could not start:", err);
                setPlayerState("paused");
                showToast("⚠️ " + (currentLang === "en" ? "Click play to start" : "गीत शुरू करने के लिए प्ले दबाएं"));
              });
          }
        }
      }
      showToast("▶️ " + (currentLang === "en" ? "Playing Chhath Geet" : "छठ गीत शुरू हुआ!"));
    }
  }

  // Alias for backward compatibility
  const togglePlayback = togglePlay;

  function playPrevious() {
    if (isActionLocked || !songs || songs.length === 0) return;
    isActionLocked = true;
    setTimeout(() => { isActionLocked = false; }, 250);

    let prevIndex = (currentSong - 1 + songs.length) % songs.length;
    if (!isOnlineMode) {
      let count = 0;
      while ((!songs[prevIndex] || (!songs[prevIndex].src && !songs[prevIndex].file)) && count < songs.length) {
        prevIndex = (prevIndex - 1 + songs.length) % songs.length;
        count++;
      }
    } else {
      let count = 0;
      while ((!songs[prevIndex] || !songs[prevIndex].videoId) && count < songs.length) {
        prevIndex = (prevIndex - 1 + songs.length) % songs.length;
        count++;
      }
    }
    loadSong(prevIndex, true);
  }

  function playNext(autoEnded = false) {
    if (!songs || songs.length === 0) return;
    if (!autoEnded && isActionLocked) return;
    isActionLocked = true;
    setTimeout(() => { isActionLocked = false; }, 250);

    let nextIndex = (currentSong + 1) % songs.length;
    if (!isOnlineMode) {
      let count = 0;
      while ((!songs[nextIndex] || (!songs[nextIndex].src && !songs[nextIndex].file)) && count < songs.length) {
        nextIndex = (nextIndex + 1) % songs.length;
        count++;
      }
    } else {
      let count = 0;
      while ((!songs[nextIndex] || !songs[nextIndex].videoId) && count < songs.length) {
        nextIndex = (nextIndex + 1) % songs.length;
        count++;
      }
    }
    loadSong(nextIndex, true);
  }

  // ---------------------------------------------------------
  // PROGRESS / SEEKING
  // ---------------------------------------------------------
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

  function getActiveDuration() {
    let dur = 0;
    if (isOnlineMode && isYtReady && ytPlayer && typeof ytPlayer.getDuration === "function") {
      try { dur = ytPlayer.getDuration() || 0; } catch (e) { }
    }
    if (!dur && offlineAudio && offlineAudio.duration && isFinite(offlineAudio.duration)) {
      dur = offlineAudio.duration || 0;
    }
    return dur > 0 && isFinite(dur) ? dur : 0;
  }

  function getActiveCurrentTime() {
    let cur = 0;
    if (isOnlineMode && isYtReady && ytPlayer && typeof ytPlayer.getCurrentTime === "function") {
      try { cur = ytPlayer.getCurrentTime() || 0; } catch (e) { }
    } else if (offlineAudio && offlineAudio.currentTime && isFinite(offlineAudio.currentTime)) {
      cur = offlineAudio.currentTime || 0;
    }
    return cur > 0 && isFinite(cur) ? cur : 0;
  }

  function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const totalSec = Math.floor(seconds);
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const secStr = secs.toString().padStart(2, "0");

    if (hrs > 0) {
      const minStr = mins.toString().padStart(2, "0");
      return `${hrs}:${minStr}:${secStr}`;
    }
    return `${mins}:${secStr}`;
  }

  function updateLiveProgress() {
    if (isSeeking) return;

    const cur = getActiveCurrentTime();
    const dur = getActiveDuration();

    // Optimize DOM rendering to avoid unnecessary layout thrashing
    const curSecRounded = Math.floor(cur);
    if (curSecRounded !== lastRenderedCurrentTimeSec) {
      lastRenderedCurrentTimeSec = curSecRounded;
      if (currentTime) currentTime.textContent = formatTime(cur);
    }

    const durSecRounded = Math.floor(dur);
    if (durSecRounded !== lastRenderedDurationSec && dur > 0) {
      lastRenderedDurationSec = durSecRounded;
      if (totalTime) totalTime.textContent = formatTime(dur);
    }

    if (dur > 0) {
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      if (Math.abs(pct - lastRenderedProgressPct) > 0.1) {
        lastRenderedProgressPct = pct;
        if (progress) progress.value = pct;
        if (progressFill) progressFill.style.width = `${pct}%`;
      }
    }

    updateMediaSessionPosition(cur, dur);
  }

  function seekToTime(targetSec, fast = false) {
    const dur = getActiveDuration();
    if (!isFinite(dur) || dur <= 0) return;

    const safeSec = Math.max(0, Math.min(dur, targetSec));

    if (isOnlineMode && isYtReady && ytPlayer && typeof ytPlayer.seekTo === "function") {
      try {
        ytPlayer.seekTo(safeSec, true);
        if (isPlaying && typeof ytPlayer.playVideo === "function") {
          ytPlayer.playVideo();
        }
      } catch (e) { }
    } else if (offlineAudio && offlineAudio.duration && isFinite(offlineAudio.duration)) {
      try {
        if (fast && "fastSeek" in offlineAudio) {
          offlineAudio.fastSeek(safeSec);
        } else {
          offlineAudio.currentTime = safeSec;
        }
      } catch (e) {
        offlineAudio.currentTime = safeSec;
      }
    }

    // Immediately update UI
    const pct = (safeSec / dur) * 100;
    if (progress) progress.value = pct;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (currentTime) currentTime.textContent = formatTime(safeSec);

    isSeeking = true;
    if (seekDebounceTimeout) clearTimeout(seekDebounceTimeout);
    seekDebounceTimeout = setTimeout(() => {
      isSeeking = false;
      updateLiveProgress();
      savePlayerStatePeriodic(true);
    }, 200);
  }

  function seekRelative(deltaSec) {
    const cur = getActiveCurrentTime();
    const dur = getActiveDuration();
    if (!isFinite(dur) || dur <= 0) return;

    const target = Math.max(0, Math.min(dur, cur + deltaSec));
    seekToTime(target);
    showToast(deltaSec > 0 ? `⏩ +${deltaSec}s` : `⏪ ${deltaSec}s`);
  }

  // Smooth progress bar click-and-drag seek handler
  if (progress) {
    const handleProgressInput = () => {
      isSeeking = true;
      if (seekDebounceTimeout) clearTimeout(seekDebounceTimeout);
      const dur = getActiveDuration();
      const pct = parseFloat(progress.value) || 0;
      if (progressFill) progressFill.style.width = `${pct}%`;
      if (currentTime && dur > 0) {
        currentTime.textContent = formatTime((pct / 100) * dur);
      }
    };

    const handleProgressCommit = () => {
      const dur = getActiveDuration();
      const pct = parseFloat(progress.value) || 0;
      if (dur > 0) {
        const targetSec = (pct / 100) * dur;
        seekToTime(targetSec, false);
      } else {
        isSeeking = false;
      }
    };

    progress.addEventListener("mousedown", () => { isSeeking = true; });
    progress.addEventListener("touchstart", () => { isSeeking = true; }, { passive: true });
    progress.addEventListener("input", handleProgressInput);
    progress.addEventListener("change", handleProgressCommit);
    progress.addEventListener("mouseup", handleProgressCommit);
    progress.addEventListener("touchend", handleProgressCommit);
  }

  // ---------------------------------------------------------
  // VOLUME & MUTE SYSTEM
  // ---------------------------------------------------------
  const VOL_HIGH_ICON = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
      <path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M13.5 9.5C14.3 10.3 14.8 11.1 14.8 12s-.5 1.7-1.3 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16.5 7.5C17.9 8.9 18.7 10.4 18.7 12s-.8 3.1-2.2 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M19.5 5.5C21.5 7.5 22.6 9.7 22.6 12s-1.1 4.5-3.1 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  const VOL_MED_ICON = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
      <path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M13.5 9.5C14.3 10.3 14.8 11.1 14.8 12s-.5 1.7-1.3 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <path d="M16.5 7.5C17.9 8.9 18.7 10.4 18.7 12s-.8 3.1-2.2 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  const VOL_LOW_ICON = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
      <path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M13.5 9.5C14.3 10.3 14.8 11.1 14.8 12s-.5 1.7-1.3 2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  const VOL_MUTE_ICON = `
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor">
      <path d="M10 5L5 9H2v6h3l5 4V5z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
      <line x1="22" y1="9" x2="16" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
      <line x1="16" y1="9" x2="22" y2="15" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
    </svg>
  `;

  function updateVolumeIcon(volFraction) {
    if (!muteBtn) return;
    if (isMuted || volFraction <= 0) {
      muteBtn.innerHTML = VOL_MUTE_ICON;
      muteBtn.setAttribute("aria-label", "Unmute Volume");
    } else if (volFraction <= 0.33) {
      muteBtn.innerHTML = VOL_LOW_ICON;
      muteBtn.setAttribute("aria-label", "Mute Volume");
    } else if (volFraction <= 0.66) {
      muteBtn.innerHTML = VOL_MED_ICON;
      muteBtn.setAttribute("aria-label", "Mute Volume");
    } else {
      muteBtn.innerHTML = VOL_HIGH_ICON;
      muteBtn.setAttribute("aria-label", "Mute Volume");
    }
  }

  function updateVolumeTrack(volNum) {
    if (volumeSlider) {
      volumeSlider.style.setProperty("--vol-percent", `${volNum}%`);
    }
  }

  function setVolume(volNum, updateSlider = true, store = true) {
    const clamped = Math.max(0, Math.min(100, Math.round(volNum)));
    const fraction = clamped / 100;

    if (clamped > 0) {
      lastVolume = fraction;
      isMuted = false;
    } else {
      isMuted = true;
    }

    if (offlineAudio) {
      offlineAudio.volume = isMuted ? 0 : fraction;
    }

    if (isYtReady && ytPlayer && typeof ytPlayer.setVolume === "function") {
      try {
        if (isMuted) {
          ytPlayer.mute();
        } else {
          ytPlayer.unMute();
          ytPlayer.setVolume(clamped);
        }
      } catch (e) { }
    }

    if (updateSlider && volumeSlider) {
      volumeSlider.value = clamped;
    }
    updateVolumeTrack(clamped);
    updateVolumeIcon(fraction);

    if (store) {
      safeStorageSet(STORAGE_KEYS.VOLUME, clamped.toString());
      safeStorageSet(STORAGE_KEYS.MUTED, isMuted ? "1" : "0");
    }
  }

  function toggleMute() {
    if (isMuted || (volumeSlider && parseInt(volumeSlider.value, 10) === 0)) {
      // Unmute: restore last non-zero volume or 100%
      const restoreVol = lastVolume > 0 ? Math.round(lastVolume * 100) : 100;
      setVolume(restoreVol, true, true);
      showToast((i18n[currentLang] && i18n[currentLang].toastUnmuted) || "🔊 Volume Unmuted");
    } else {
      // Mute
      const cur = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
      if (cur > 0) lastVolume = cur / 100;
      setVolume(0, true, true);
      showToast((i18n[currentLang] && i18n[currentLang].toastMuted) || "🔇 Volume Muted");
    }
  }

  function restoreVolumeAndMuteState() {
    const savedVol = parseInt(safeStorageGet(STORAGE_KEYS.VOLUME, "100"), 10);
    const savedMuted = safeStorageGet(STORAGE_KEYS.MUTED, "0") === "1";
    const volNum = (!isNaN(savedVol) && savedVol >= 0 && savedVol <= 100) ? savedVol : 100;

    if (volNum > 0) lastVolume = volNum / 100;
    if (savedMuted) {
      setVolume(0, true, false);
    } else {
      setVolume(volNum, true, false);
    }
  }

  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10) || 0;
      setVolume(val, false, true);
    });
  }

  if (muteBtn) {
    muteBtn.addEventListener("click", toggleMute);
  }

  // ---------------------------------------------------------
  // PLAYBACK SPEED DROPDOWN CONTROLLER
  // ---------------------------------------------------------
  function setPlaybackRate(speedObj) {
    const rateItem = (typeof speedObj === "object" && speedObj !== null)
      ? speedObj
      : (PLAYBACK_SPEEDS.find((s) => Math.abs(s.value - parseFloat(speedObj)) < 0.01) || { value: parseFloat(speedObj) || 1.0, label: `${speedObj}x` });

    const r = parseFloat(rateItem.value) || 1.0;
    const label = rateItem.label || `${r}x`;

    const foundIdx = PLAYBACK_SPEEDS.findIndex((s) => Math.abs(s.value - r) < 0.01);
    if (foundIdx !== -1) currentSpeedIndex = foundIdx;

    if (offlineAudio) {
      offlineAudio.playbackRate = r;
    }
    if (isOnlineMode && isYtReady && ytPlayer && typeof ytPlayer.setPlaybackRate === "function") {
      try { ytPlayer.setPlaybackRate(r); } catch (e) { }
    }

    if (speedLabel) speedLabel.textContent = label;
    if (speedBtn) {
      if (Math.abs(r - 1.0) > 0.01) {
        speedBtn.classList.add("custom-speed");
      } else {
        speedBtn.classList.remove("custom-speed");
      }
    }

    if (speedMenuItems && speedMenuItems.length > 0) {
      speedMenuItems.forEach((item) => {
        const itemSpeed = parseFloat(item.getAttribute("data-speed"));
        if (Math.abs(itemSpeed - r) < 0.01) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }

    const t = i18n[currentLang] || i18n.hi;
    showToast((t.toastSpeed || "⚡ प्लेबैक स्पीड: ") + label);
  }

  function cyclePlaybackSpeed() {
    currentSpeedIndex = (currentSpeedIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackRate(PLAYBACK_SPEEDS[currentSpeedIndex]);
  }

  function openSpeedDropdown() {
    if (!speedDropdown) return;
    speedDropdown.classList.add("open");
    if (speedBtn) speedBtn.setAttribute("aria-expanded", "true");
  }

  function closeSpeedDropdown() {
    if (!speedDropdown) return;
    speedDropdown.classList.remove("open");
    if (speedBtn) speedBtn.setAttribute("aria-expanded", "false");
  }

  function toggleSpeedDropdown() {
    if (!speedDropdown) return;
    if (speedDropdown.classList.contains("open")) {
      closeSpeedDropdown();
    } else {
      openSpeedDropdown();
    }
  }

  if (speedBtn) {
    speedBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleSpeedDropdown();
    });
  }

  if (speedMenuItems && speedMenuItems.length > 0) {
    speedMenuItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const sp = parseFloat(item.getAttribute("data-speed"));
        if (!isNaN(sp)) setPlaybackRate(sp);
        closeSpeedDropdown();
      });
    });
  }

  document.addEventListener("click", (e) => {
    if (speedDropdown && !speedDropdown.contains(e.target)) {
      closeSpeedDropdown();
    }
  });

  // ---------------------------------------------------------
  // PLAYLIST UI & OFFLINE DOWNLOADS SYSTEM
  // ---------------------------------------------------------
  async function refreshOfflineBadgesAndStorage() {
    if (!window.OfflineManager) return;
    try {
      const allDownloaded = await window.OfflineManager.getAllDownloadedSongs();
      const count = allDownloaded.length;

      if (navDownloadsBadge) navDownloadsBadge.textContent = count.toString();
      if (tabDownloadedCount) tabDownloadedCount.textContent = count.toString();
      if (tabAllSongsCount) tabAllSongsCount.textContent = songs.length.toString();

      const storageInfo = await window.OfflineManager.getStorageInfo();
      if (storageUsedVal) {
        storageUsedVal.textContent = storageInfo.formattedUsed;
      }
    } catch (e) {
      console.warn("Storage refresh notice:", e);
    }
  }

  async function renderPlaylist(filterQuery = "") {
    if (!playlistList) return;
    const query = filterQuery.toLowerCase().trim();
    const t = i18n[currentLang] || i18n.en;

    // Refresh badge counts in background
    refreshOfflineBadgesAndStorage();

    // ---------------------------------------------------------
    // VIEW A: OFFLINE DOWNLOADS TAB
    // ---------------------------------------------------------
    if (currentPlaylistTab === "downloaded") {
      let downloadedList = [];
      if (window.OfflineManager) {
        downloadedList = await window.OfflineManager.getAllDownloadedSongs();
      }

      const filteredDownloaded = downloadedList.filter((s) => {
        if (!query) return true;
        const title = (s.title || "").toLowerCase();
        const titleEn = (s.titleEn || "").toLowerCase();
        const artist = (s.artist || "").toLowerCase();
        const artistEn = (s.artistEn || "").toLowerCase();
        return (
          title.includes(query) ||
          titleEn.includes(query) ||
          artist.includes(query) ||
          artistEn.includes(query)
        );
      });

      if (filteredDownloaded.length === 0) {
        playlistList.innerHTML = `
          <li class="no-songs-found" role="alert">
            <span style="font-size: 24px;">📥</span>
            <span class="no-songs-text">${escapeHTML(
              t.noDownloadsFound || "No downloaded songs yet. Click ↓ on any song to listen offline."
            )}</span>
          </li>
        `;
        return;
      }

      playlistList.innerHTML = filteredDownloaded
        .map((s, idx) => {
          const isEn = currentLang === "en";
          const title = isEn ? (s.titleEn || s.title) : s.title;
          const singer = isEn ? (s.artistEn || s.artist) : s.artist;
          const formattedSize = window.OfflineManager ? window.OfflineManager.formatBytes(s.size) : "";

          // Check if this downloaded track is currently playing
          const isActive = offlineAudio && (offlineAudio.src.includes(s.key) || (songs[currentSong] && (songs[currentSong].src === s.src)));

          return `
            <li class="playlist-item ${isActive ? "active" : ""}" data-key="${escapeHTML(s.key)}" role="button" tabindex="0">
              <span class="playlist-item-num">${idx + 1}</span>
              <div class="playlist-item-details">
                <div class="playlist-item-name">${escapeHTML(title)}</div>
                <div class="playlist-item-singer">${escapeHTML(singer)} • <span style="color:var(--marigold-bright);font-weight:600;">${formattedSize}</span></div>
              </div>
              <div class="playlist-item-actions">
                <button class="btn-song-action btn-play-downloaded" type="button" title="Play track" aria-label="Play ${escapeHTML(title)}">▶</button>
                <button class="btn-song-action btn-delete-song" type="button" title="Delete offline copy" aria-label="Delete ${escapeHTML(title)}">🗑</button>
              </div>
            </li>
          `;
        })
        .join("");

      // Attach handlers for downloaded list items
      playlistList.querySelectorAll(".playlist-item").forEach((item) => {
        const key = item.getAttribute("data-key");
        const songRecord = filteredDownloaded.find((x) => x.key === key);

        const playTrack = async (e) => {
          if (e) e.stopPropagation();
          if (!songRecord) return;

          // Find matching song in songs array if available
          const foundIdx = songs.findIndex((x) => (x.src === songRecord.src || x.file === songRecord.file));
          if (foundIdx >= 0) {
            await loadSong(foundIdx, true);
          } else {
            // Play directly from offline blob
            if (offlineAudio) {
              const playback = await window.OfflineManager.resolvePlaybackSource(songRecord);
              if (playback && playback.src) {
                offlineAudio.src = playback.src;
                offlineAudio.load();
                offlineAudio.play().then(() => setPlayerState("playing")).catch(() => setPlayerState("paused"));
                if (songName) songName.innerHTML = `${escapeHTML(songRecord.title)} <span class="offline-playback-badge">💾 Offline</span>`;
                if (songSinger) songSinger.textContent = songRecord.artist;
                showToast("💾 " + (t.offlineSongPlaying || "Playing offline local copy"));
              }
            }
          }
          if (playlistModal) playlistModal.classList.remove("open");
        };

        item.addEventListener("click", playTrack);

        const playBtn = item.querySelector(".btn-play-downloaded");
        if (playBtn) playBtn.addEventListener("click", playTrack);

        const delBtn = item.querySelector(".btn-delete-song");
        if (delBtn) {
          delBtn.addEventListener("click", async (e) => {
            e.stopPropagation();
            if (window.OfflineManager) {
              await window.OfflineManager.deleteDownloadedSong(key);
              showToast(t.songDeletedToast || "🗑 Song removed from storage.");
              await refreshOfflineBadgesAndStorage();
              renderPlaylist(playlistSearch ? playlistSearch.value : "");
            }
          });
        }
      });

      return;
    }

    // ---------------------------------------------------------
    // VIEW B: ALL SONGS PLAYLIST TAB
    // ---------------------------------------------------------
    const sourceSongs = isOnlineMode
      ? songs.filter((s) => Boolean(s.videoId))
      : songs.filter((s) => Boolean(s.src || s.file));

    const pool = sourceSongs.length > 0 ? sourceSongs : songs;

    const filtered = pool
      .map((s, idx) => ({ ...s, originalIndex: songs.indexOf(s), displayIndex: idx }))
      .filter((s) => {
        if (!query) return true;
        const name = isOnlineMode
          ? (currentLang === "en" ? (s.ytNameEn || s.nameEn || s.title) : (s.ytName || s.title))
          : (currentLang === "en" ? (s.nameEn || s.titleEn || s.title) : s.title);
        const singer = isOnlineMode
          ? (currentLang === "en" ? (s.ytSingerEn || s.singerEn || s.artist) : (s.ytSinger || s.artist || ""))
          : (currentLang === "en" ? (s.singerEn || s.artistEn || s.artist) : (s.artist || ""));
        return (
          name.toLowerCase().includes(query) ||
          singer.toLowerCase().includes(query) ||
          (s.title && s.title.toLowerCase().includes(query)) ||
          (s.artist && s.artist.toLowerCase().includes(query))
        );
      });

    // Empty state handling
    if (filtered.length === 0) {
      playlistList.innerHTML = `
        <li class="no-songs-found" role="alert">
          <svg class="no-songs-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <span class="no-songs-text">${escapeHTML(t.noSongsFound || "No songs available")}</span>
        </li>
      `;
      return;
    }

    // Pre-check downloaded status in bulk
    const downloadedMap = new Map();
    if (window.OfflineManager) {
      const allD = await window.OfflineManager.getAllDownloadedSongs();
      allD.forEach((d) => downloadedMap.set(d.key, true));
    }

    playlistList.innerHTML = filtered
      .map((s) => {
        const idx = s.originalIndex;
        const displayNum = (s.displayIndex !== undefined ? s.displayIndex : idx) + 1;
        const isActive = idx === currentSong;
        const isEn = currentLang === "en";
        const songTitle = isOnlineMode
          ? (isEn ? (s.ytNameEn || s.titleEn || s.title) : (s.ytName || s.title))
          : (isEn ? (s.titleEn || s.title) : s.title);
        const songSingerName = isOnlineMode
          ? (isEn ? (s.ytSingerEn || s.artistEn || s.artist) : (s.ytSinger || s.artist || (isEn ? "Devotional Song" : "भक्ति गीत")))
          : (isEn ? (s.artistEn || s.artist) : (s.artist || (isEn ? "Devotional Song" : "भक्ति गीत")));

        const songKey = window.OfflineManager ? window.OfflineManager.getSongKey(s) : (s.src || s.file);
        const isDownloaded = downloadedMap.has(songKey);
        const isDownloading = window.OfflineManager && window.OfflineManager.isDownloading(songKey);

        let actionBtnHtml = "";
        if (!isOnlineMode) {
          if (isDownloaded) {
            actionBtnHtml = `<button class="btn-song-action downloaded" type="button" title="Downloaded offline ✓" aria-label="Downloaded">✓</button>`;
          } else if (isDownloading) {
            actionBtnHtml = `<button class="btn-song-action downloading" type="button">⏳</button>`;
          } else {
            actionBtnHtml = `<button class="btn-song-action btn-download-track" type="button" title="Download for offline listening" aria-label="Download ${escapeHTML(songTitle)}">↓</button>`;
          }
        }

        return `
          <li class="playlist-item ${isActive ? "active" : ""}" data-index="${idx}" role="button" tabindex="0" aria-label="Play ${escapeHTML(songTitle)}">
            <span class="playlist-item-num">${displayNum}</span>
            <div class="playlist-item-details">
              <div class="playlist-item-name">${escapeHTML(songTitle)}</div>
              <div class="playlist-item-singer">${escapeHTML(songSingerName)}</div>
            </div>
            ${isActive && isPlaying
              ? `
                <div class="equalizer playing" aria-hidden="true">
                  <span class="equalizer-bar"></span>
                  <span class="equalizer-bar"></span>
                  <span class="equalizer-bar"></span>
                </div>
              `
              : ""
            }
            <div class="playlist-item-actions">
              ${actionBtnHtml}
            </div>
          </li>
        `;
      })
      .join("");

    // Event listeners for playlist items and download buttons
    playlistList.querySelectorAll(".playlist-item").forEach((item) => {
      const playHandler = (e) => {
        // If click was on download button, don't trigger play
        if (e.target.closest(".btn-song-action")) return;
        e.stopPropagation();
        const songIdx = parseInt(item.getAttribute("data-index"), 10);
        if (!isNaN(songIdx)) {
          loadSong(songIdx, true);
          if (playlistModal) playlistModal.classList.remove("open");
        }
      };

      item.addEventListener("click", playHandler);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          playHandler(e);
        }
      });

      // Download button click listener
      const dlBtn = item.querySelector(".btn-download-track");
      if (dlBtn) {
        dlBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const songIdx = parseInt(item.getAttribute("data-index"), 10);
          const songToDownload = songs[songIdx];
          if (!songToDownload || !window.OfflineManager) return;

          dlBtn.className = "btn-song-action downloading";
          dlBtn.textContent = "0%";
          const t = i18n[currentLang] || i18n.hi;
          showToast((t.downloadingToast || "Downloading: ") + (songToDownload.title || "Track"));

          try {
            await window.OfflineManager.downloadSong(songToDownload, (prog) => {
              if (prog.percent >= 0) {
                dlBtn.textContent = `${prog.percent}%`;
              } else {
                dlBtn.textContent = "⏳";
              }
            });

            dlBtn.className = "btn-song-action downloaded";
            dlBtn.textContent = "✓";
            dlBtn.title = "Downloaded offline ✓";
            showToast(t.downloadCompleteToast || "Downloaded for offline listening ✓");
            await refreshOfflineBadgesAndStorage();
          } catch (err) {
            console.error("Download failed:", err);
            dlBtn.className = "btn-song-action btn-download-track";
            dlBtn.textContent = "↓";
            dlBtn.title = "Download for offline listening";
            showToast(t.downloadFailedToast || "Download failed. Please try again.");
          }
        });
      }
    });
  }

  function updatePlaylistHeaderUI() {
    const t = i18n[currentLang] || i18n.hi;
    const count = songs.length;
    const titleText = isOnlineMode
      ? (t.playlistTitleOnline || "छठ वीडियो संग्रह (ऑनलाइन)")
      : (t.playlistTitleOffline || "छठ गीत संग्रह (ऑफलाइन)");
    const placeholderText = isOnlineMode
      ? (t.playlistSearchPlaceholderOnline || "वीडियो या गायक का नाम खोजें...")
      : (t.playlistSearchPlaceholderOffline || "गीत या गायक का नाम खोजें...");

    if (playlistTitleText) {
      playlistTitleText.textContent = `${titleText} (${count})`;
    } else if (playlistTitle) {
      playlistTitle.textContent = `${titleText} (${count})`;
    }
    if (playlistSearch) {
      playlistSearch.placeholder = placeholderText;
    }
  }

  function scrollActivePlaylistItemIntoView() {
    if (!playlistList) return;
    const activeItem = playlistList.querySelector(".playlist-item.active");
    if (activeItem) {
      activeItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  if (playlistSearch) {
    playlistSearch.addEventListener("input", (e) => {
      const q = e.target.value;
      if (searchClearBtn) searchClearBtn.style.display = q ? "block" : "none";
      renderPlaylist(q);
    });
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
      if (playlistSearch) {
        playlistSearch.value = "";
        searchClearBtn.style.display = "none";
        renderPlaylist("");
      }
    });
  }

  if (playlistToggleBtn && playlistModal) {
    playlistToggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = playlistModal.classList.toggle("open");
      if (isOpen) {
        scrollActivePlaylistItemIntoView();
        if (playlistSearch) setTimeout(() => playlistSearch.focus(), 150);
      }
    });
  }

  if (playlistCloseBtn && playlistModal) {
    playlistCloseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playlistModal.classList.remove("open");
    });
  }

  if (playlistModal) {
    playlistModal.addEventListener("click", (e) => e.stopPropagation());
  }

  document.addEventListener("click", (e) => {
    if (
      playlistModal &&
      playlistModal.classList.contains("open") &&
      !playlistModal.contains(e.target) &&
      e.target !== playlistToggleBtn &&
      !playlistToggleBtn.contains(e.target) &&
      e.target !== navDownloadsBtn &&
      !(navDownloadsBtn && navDownloadsBtn.contains(e.target))
    ) {
      playlistModal.classList.remove("open");
    }
  });

  // ---------------------------------------------------------
  // OFFLINE TABS & STORAGE ACTIONS WIRING
  // ---------------------------------------------------------
  if (tabAllSongs) {
    tabAllSongs.addEventListener("click", () => {
      currentPlaylistTab = "all";
      tabAllSongs.classList.add("active");
      if (tabDownloadedSongs) tabDownloadedSongs.classList.remove("active");
      if (storageMgmtBar) storageMgmtBar.style.display = "none";
      renderPlaylist(playlistSearch ? playlistSearch.value : "");
    });
  }

  if (tabDownloadedSongs) {
    tabDownloadedSongs.addEventListener("click", () => {
      currentPlaylistTab = "downloaded";
      tabDownloadedSongs.classList.add("active");
      if (tabAllSongs) tabAllSongs.classList.remove("active");
      if (storageMgmtBar) storageMgmtBar.style.display = "flex";
      renderPlaylist(playlistSearch ? playlistSearch.value : "");
    });
  }

  if (navDownloadsBtn) {
    navDownloadsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (playlistModal) playlistModal.classList.add("open");
      currentPlaylistTab = "downloaded";
      if (tabDownloadedSongs) tabDownloadedSongs.classList.add("active");
      if (tabAllSongs) tabAllSongs.classList.remove("active");
      if (storageMgmtBar) storageMgmtBar.style.display = "flex";
      renderPlaylist();
    });
  }

  if (btnClearStorage) {
    btnClearStorage.addEventListener("click", async () => {
      const t = i18n[currentLang] || i18n.hi;
      if (confirm(t.clearStorageConfirm || "Delete all downloaded songs?")) {
        if (window.OfflineManager) {
          await window.OfflineManager.clearAllDownloadedSongs();
          await refreshOfflineBadgesAndStorage();
          renderPlaylist(playlistSearch ? playlistSearch.value : "");
          showToast(t.clearStorageSuccess || "🗑 All downloaded songs have been removed.");
        }
      }
    });
  }

  // ---------------------------------------------------------
  // PWA INSTALLATION PROMPT HANDLER
  // ---------------------------------------------------------
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

  // Subscribe to OfflineManager global events
  if (window.OfflineManager) {
    window.OfflineManager.subscribe((type) => {
      if (type === "installable" && pwaInstallBtn) {
        pwaInstallBtn.classList.add("visible");
      } else if (type === "installed" && pwaInstallBtn) {
        pwaInstallBtn.classList.remove("visible");
      } else if (type === "download-complete" || type === "delete" || type === "clear") {
        refreshOfflineBadgesAndStorage();
        if (playlistModal && playlistModal.classList.contains("open")) {
          renderPlaylist(playlistSearch ? playlistSearch.value : "");
        }
      }
    });
    refreshOfflineBadgesAndStorage();
  }

  // ---------------------------------------------------------
  // MEDIA SESSION API INTEGRATION
  // ---------------------------------------------------------
  const MEDIA_SESSION_SUPPORTED = ("mediaSession" in navigator && typeof MediaMetadata !== "undefined");

  function updateMediaSessionMetadata() {
    if (!MEDIA_SESSION_SUPPORTED || !songs[currentSong]) return;
    try {
      const s = songs[currentSong];
      const isEn = currentLang === "en";
      const songTitle = isEn ? (s.titleEn || s.title) : s.title;
      const songArtist = isEn ? (s.artistEn || s.artist) : s.artist;
      const albumName = isEn ? (s.album || "Chhath Ghat") : (s.album || "छठ घाट");

      const origin = window.location.origin || (window.location.protocol + "//" + window.location.host);
      const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
      const makeUrl = (rel) => new URL(rel, origin + basePath).href;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: songTitle,
        artist: songArtist || (isEn ? "Chhath Mahaparv" : "छठ महापर्व"),
        album: albumName,
        artwork: [
          { src: makeUrl("../favicon.io/favicon-32x32.png"), sizes: "96x96", type: "image/png" },
          { src: makeUrl("../favicon.io/apple-touch-icon.png"), sizes: "128x128", type: "image/png" },
          { src: makeUrl("../favicon.io/android-chrome-192x192.png"), sizes: "192x192", type: "image/png" },
          { src: makeUrl("../favicon.io/android-chrome-512x512.png"), sizes: "256x256", type: "image/png" },
          { src: makeUrl("../favicon.io/android-chrome-512x512.png"), sizes: "512x512", type: "image/png" }
        ]
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    } catch (e) { }
  }

  function updateMediaSessionPosition(pos = 0, dur = 0) {
    if (!MEDIA_SESSION_SUPPORTED || !("setPositionState" in navigator.mediaSession)) return;
    if (!isFinite(dur) || dur <= 0 || !isFinite(pos) || pos < 0 || pos > dur) return;

    try {
      const activeRate = (offlineAudio && offlineAudio.playbackRate) || 1.0;
      navigator.mediaSession.setPositionState({
        duration: dur,
        playbackRate: activeRate,
        position: Math.min(pos, dur)
      });
    } catch (e) { }
  }

  if (MEDIA_SESSION_SUPPORTED) {
    const actionHandlers = [
      ["play", () => togglePlay()],
      ["pause", () => togglePlay()],
      ["previoustrack", () => playPrevious()],
      ["nexttrack", () => playNext()],
      ["seekto", (details) => {
        if (details.seekTime !== undefined && isFinite(details.seekTime)) {
          seekToTime(details.seekTime, Boolean(details.fastSeek));
        }
      }],
      ["seekbackward", (details) => {
        const skip = details.seekOffset || 10;
        seekRelative(-skip);
      }],
      ["seekforward", (details) => {
        const skip = details.seekOffset || 10;
        seekRelative(skip);
      }]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) { }
    }
  }

  // ---------------------------------------------------------
  // SCREEN WAKE LOCK & BACKGROUND PRELOAD
  // ---------------------------------------------------------
  async function requestWakeLock() {
    if ("wakeLock" in navigator && !wakeLockSentinel && document.visibilityState === "visible") {
      try {
        wakeLockSentinel = await navigator.wakeLock.request("screen");
        wakeLockSentinel.addEventListener("release", () => {
          wakeLockSentinel = null;
        });
      } catch (err) { }
    }
  }

  function releaseWakeLock() {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => { });
      wakeLockSentinel = null;
    }
  }

  function preloadNextTrack() {
    if (!songs || songs.length <= 1) return;
    const nextIdx = (currentSong + 1) % songs.length;

    if (nextIdx >= 0 && nextIdx !== lastPreloadedIdx && songs[nextIdx] && (songs[nextIdx].src || songs[nextIdx].file)) {
      lastPreloadedIdx = nextIdx;
      const nextFile = songs[nextIdx].src || songs[nextIdx].file;
      try {
        bgPreloadAudio.src = nextFile;
        bgPreloadAudio.preload = "auto";
        bgPreloadAudio.load();
      } catch (e) { }

      if ("caches" in window) {
        caches.open("chhath-media-cache-v2").then((cache) => {
          cache.match(nextFile).then((matched) => {
            if (!matched) {
              fetch(nextFile, { mode: "cors" }).then((res) => {
                if (res.ok) cache.put(nextFile, res);
              }).catch(() => { });
            }
          });
        }).catch(() => { });
      }
    }
  }

  // ---------------------------------------------------------
  // ERROR HANDLING
  // ---------------------------------------------------------
  let playbackRetryCount = 0;
  const MAX_PLAYBACK_RETRIES = 2;

  function handlePlaybackError(err) {
    console.warn("Audio playback/network error:", err);
    setPlayerState("error");

    const t = i18n[currentLang] || i18n.en;
    const msg = (err && err.message) || (t.toastPlaybackError || "⚠️ Audio loading error. Retrying next song...");
    showToast(msg);

    if (isPlaying && !isOnlineMode && playbackRetryCount < MAX_PLAYBACK_RETRIES) {
      playbackRetryCount++;
      setTimeout(() => {
        if (offlineAudio && songs[currentSong]) {
          const fileSrc = songs[currentSong].src || songs[currentSong].file;
          if (fileSrc) {
            offlineAudio.src = fileSrc;
            offlineAudio.load();
            offlineAudio.play().then(() => {
              playbackRetryCount = 0;
              setPlayerState("playing");
            }).catch(() => { });
          }
        }
      }, 1000 * playbackRetryCount);
    } else {
      playbackRetryCount = 0;
      // Keep playlist completely interactive, let user choose another song
    }
  }

  // ---------------------------------------------------------
  // DUAL MODE & YOUTUBE STREAMING INTEGRATION
  // ---------------------------------------------------------
  function setMode(online, showNotification = true) {
    isOnlineMode = Boolean(online);
    updateModeButtonUI();

    if (isOnlineMode) {
      ensureYouTubeAPI();
      document.body.classList.add("live-video-active");
      if (bgVideoContainer) {
        bgVideoContainer.classList.add("active");
        bgVideoContainer.setAttribute("aria-hidden", "false");
      }
      if (offlineAudio) {
        offlineAudio.pause();
        offlineAudio.currentTime = 0;
      }
      playOnlineSong(currentSong);
      if (showNotification) {
        showToast((i18n[currentLang] && i18n[currentLang].toastOnline) || "🌐 Online Video Mode Active");
      }
    } else {
      document.body.classList.remove("live-video-active", "video-paused", "video-buffering");
      if (bgVideoContainer) {
        bgVideoContainer.classList.remove("active");
        bgVideoContainer.setAttribute("aria-hidden", "true");
      }
      if (isYtReady && ytPlayer) {
        try {
          if (typeof ytPlayer.pauseVideo === "function") ytPlayer.pauseVideo();
          if (typeof ytPlayer.stopVideo === "function") ytPlayer.stopVideo();
        } catch (e) { }
      }
      loadSong(currentSong, isPlaying);
      if (showNotification) {
        showToast((i18n[currentLang] && i18n[currentLang].toastOffline) || "📴 Offline Audio Mode Active");
      }
    }

    displaySongInfo(currentSong);
    updatePlaylistHeaderUI();
    renderPlaylist(playlistSearch ? playlistSearch.value : "");
  }

  function playOnlineSong(index) {
    const s = songs[index];
    if (!s) return;
    displaySongInfo(index);

    if (offlineAudio) {
      offlineAudio.pause();
      offlineAudio.currentTime = 0;
    }

    document.body.classList.add("live-video-active");
    if (bgVideoContainer) {
      bgVideoContainer.classList.add("active");
      bgVideoContainer.setAttribute("aria-hidden", "false");
    }

    const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
    const activeRate = PLAYBACK_SPEEDS[currentSpeedIndex] ? PLAYBACK_SPEEDS[currentSpeedIndex].value : 1.0;

    if (isYtReady && ytPlayer && typeof ytPlayer.loadVideoById === "function") {
      try {
        if (s.videoId) {
          ytPlayer.loadVideoById({
            videoId: s.videoId,
            startSeconds: 0
          });
          if (isMuted) {
            ytPlayer.mute();
          } else {
            ytPlayer.unMute();
            ytPlayer.setVolume(volNum);
          }
          ytPlayer.playVideo();
          if (typeof ytPlayer.setPlaybackRate === "function") {
            ytPlayer.setPlaybackRate(activeRate);
          }
        }
      } catch (e) {
        console.warn("YouTube video load error:", e);
      }
    } else {
      ensureYouTubeAPI();
    }
  }

  let isYtScriptLoading = false;
  function ensureYouTubeAPI() {
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
    if (ytPlayer || !window.YT || !window.YT.Player) return;
    try {
      const initialVideoId = (songs[currentSong] && songs[currentSong].videoId) || "T_YXL_blE3A";
      ytPlayer = new YT.Player("ytBgPlayer", {
        height: "100%",
        width: "100%",
        videoId: initialVideoId,
        playerVars: {
          autoplay: 0,
          mute: 0,
          controls: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          disablekb: 1,
          fs: 0,
          origin: window.location.origin || (window.location.protocol + "//" + window.location.host)
        },
        events: {
          onReady: (event) => {
            isYtReady = true;
            const volNum = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
            if (isOnlineMode) {
              if (isMuted) event.target.mute();
              else {
                event.target.unMute();
                event.target.setVolume(volNum);
              }
              if (isPlaying) event.target.playVideo();
            } else {
              event.target.mute();
              event.target.pauseVideo();
            }
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            if (event.data === YT.PlayerState.PLAYING) {
              if (isOnlineMode) {
                setPlayerState("playing");
                displaySongInfo(currentSong);
              }
            } else if (event.data === YT.PlayerState.PAUSED) {
              if (isOnlineMode && !isActionLocked) {
                setPlayerState("paused");
              }
            } else if (event.data === YT.PlayerState.ENDED) {
              if (isOnlineMode) {
                playNext(true);
              }
            }
          },
          onError: (e) => {
            console.warn("YouTube streaming error, falling back to audio:", e);
            if (isOnlineMode) {
              setMode(false, false);
            }
          }
        }
      });
    } catch (e) {
      console.warn("YouTube player init error:", e);
    }
  }

  // ---------------------------------------------------------
  // EVENT LISTENERS (Buttons, Keyboard & Page Lifecycle)
  // ---------------------------------------------------------
  if (playButton) {
    playButton.addEventListener("click", togglePlay);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", playPrevious);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => playNext(false));
  }

  // Dual mode toggle button
  if (modeToggleBtn) {
    modeToggleBtn.addEventListener("click", () => {
      setMode(!isOnlineMode, true);
    });
  }

  // Bilingual language toggle button
  if (langToggleBtn) {
    langToggleBtn.addEventListener("click", () => {
      const nextLang = currentLang === "en" ? "hi" : "en";
      setLanguage(nextLang, true);
    });
  }

  const navHomeBtn = document.getElementById("navHomeBtn");
  if (navHomeBtn && navHomeBtn.tagName === "BUTTON") {
    navHomeBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const navAboutBtn = document.getElementById("navAboutBtn");
  if (navAboutBtn) {
    navAboutBtn.addEventListener("click", () => {
      const footer = document.getElementById("appFooter") || document.querySelector(".app-footer") || document.querySelector("footer");
      if (footer) {
        footer.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }
    });
  }

  function updateModeButtonUI() {
    const t = i18n[currentLang] || i18n.en;
    if (modeToggleBtn) {
      modeToggleBtn.setAttribute("data-mode", isOnlineMode ? "online" : "offline");
      modeToggleBtn.title = isOnlineMode ? t.modeOnlineTitle : t.modeOfflineTitle;
      modeToggleBtn.setAttribute("aria-label", isOnlineMode ? t.modeOnlineAria : t.modeOfflineAria);
    }
    if (modeText) {
      modeText.textContent = isOnlineMode ? t.modeOnlineText : t.modeOfflineText;
    }
  }

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

    updateModeButtonUI();

    const homeBtn = document.getElementById("navHomeBtn");
    const homeTxt = document.getElementById("navHomeText");
    if (homeBtn) {
      homeBtn.title = t.navHomeTitle;
      homeBtn.setAttribute("aria-label", t.navHomeAria);
    }
    if (homeTxt) homeTxt.textContent = t.navHomeText;

    const aboutBtn = document.getElementById("navAboutBtn");
    const aboutTxt = document.getElementById("navAboutText");
    if (aboutBtn) {
      aboutBtn.title = t.navAboutTitle;
      aboutBtn.setAttribute("aria-label", t.navAboutAria);
    }
    if (aboutTxt) aboutTxt.textContent = t.navAboutText;

    const hindiSongBtn = document.getElementById("navHindiSongBtn");
    const hindiSongTxt = document.getElementById("navHindiSongText");
    if (hindiSongBtn) {
      hindiSongBtn.title = t.navHindiSongTitle;
      hindiSongBtn.setAttribute("aria-label", t.navHindiSongAria);
    }
    if (hindiSongTxt) hindiSongTxt.textContent = t.navHindiSongText;

    if (navDownloadsText) navDownloadsText.textContent = t.downloadsTitle || "Downloads";
    if (navDownloadsBtn) navDownloadsBtn.title = t.downloadsNavTitle || "Offline Downloads";
    if (tabAllSongsText) tabAllSongsText.textContent = t.allSongsTab || "All Songs";
    if (tabDownloadedText) tabDownloadedText.textContent = t.downloadedTab || "Downloads";
    if (storageLabel) storageLabel.textContent = t.storageLabel || "Offline Storage:";
    if (pwaInstallBtnText) pwaInstallBtnText.textContent = t.installAppBtn || "Install App";

    if (prevBtn) prevBtn.title = t.prevSongTitle;
    if (playButton) playButton.title = t.playBtnTitle;
    if (nextBtn) nextBtn.title = t.nextSongTitle;
    if (playlistToggleBtn) playlistToggleBtn.title = t.playlistBtnTitle;
    if (muteBtn) muteBtn.title = t.muteBtnTitle;
    if (speedBtn) speedBtn.title = t.speedBtnTitle;
    if (playlistCloseBtn) playlistCloseBtn.title = t.playlistCloseTitle;
    if (volumeSlider) volumeSlider.title = t.volumeSliderTitle;
    if (progress) progress.title = t.seekSliderTitle;

    if (mainLogoText) mainLogoText.textContent = t.mainLogoText;
    if (taglineText) taglineText.textContent = t.taglineText;

    updatePlaylistHeaderUI();

    if (ritualsHeading) ritualsHeading.textContent = t.ritualsHeading;
    if (ritual1DayBadge) ritual1DayBadge.textContent = t.ritual1DayBadge;
    if (ritual1Title) ritual1Title.textContent = t.ritual1Title;
    if (ritual1Desc) ritual1Desc.textContent = t.ritual1Desc;
    if (ritual1Highlight) ritual1Highlight.textContent = t.ritual1Highlight;

    if (ritual2DayBadge) ritual2DayBadge.textContent = t.ritual2DayBadge;
    if (ritual2Title) ritual2Title.textContent = t.ritual2Title;
    if (ritual2Desc) ritual2Desc.textContent = t.ritual2Desc;
    if (ritual2Highlight) ritual2Highlight.textContent = t.ritual2Highlight;

    if (ritual3DayBadge) ritual3DayBadge.textContent = t.ritual3DayBadge;
    if (ritual3Title) ritual3Title.textContent = t.ritual3Title;
    if (ritual3Desc) ritual3Desc.textContent = t.ritual3Desc;
    if (ritual3Highlight) ritual3Highlight.textContent = t.ritual3Highlight;

    if (ritual4DayBadge) ritual4DayBadge.textContent = t.ritual4DayBadge;
    if (ritual4Title) ritual4Title.textContent = t.ritual4Title;
    if (ritual4Desc) ritual4Desc.textContent = t.ritual4Desc;
    if (ritual4Highlight) ritual4Highlight.textContent = t.ritual4Highlight;

    if (mantraTitle) mantraTitle.textContent = t.mantraTitle;
    if (mantraText) {
      if (currentLang === "en") {
        mantraText.innerHTML = `
          Om Adityaaya Vidmahe Divakaraya Dhimahi <br>
          Tannah Suryaah Prachodayat
          <span class="mantra-translation">"Om, let me meditate on the Sun God, the maker of the day. Give me higher intellect, and let the Sun God illuminate my mind."</span>
        `;
      } else {
        mantraText.innerHTML = `
          ॐ आदित्याय विद्महे दिवाकराय धीमहि <br>
          तन्नः सूर्यः प्रचोदयात् ॥
          <span class="mantra-translation">"हम समस्त संसार को प्रकाशित करने वाले परम तेजस्वी भगवान सूर्य देव का ध्यान करते हैं। वे भुवन भास्कर हमारी बुद्धि को ज्ञान और सन्मार्ग की ओर प्रेरित करें।"</span>
        `;
      }
    }

    if (copyMantraBtn) copyMantraBtn.title = t.copyMantraTitle;
    if (copyMantraBtnText) copyMantraBtnText.textContent = t.copyMantraBtnText;
    if (shareMantraBtn) shareMantraBtn.title = t.shareMantraTitle;
    if (shareMantraBtnText) shareMantraBtnText.textContent = t.shareMantraBtnText;

    displaySongInfo(currentSong);
    renderSEOContent();
    updateClock();
    renderPlaylist(playlistSearch ? playlistSearch.value : "");
    updateMediaSessionMetadata();

    if (showToastMsg) {
      showToast(t.toastLangSwitched);
    }
  }

  function renderSEOContent() {
    const seoContainer = document.getElementById("seoContentDynamic");
    if (!seoContainer) return;

    if (currentLang === "en") {
      seoContainer.innerHTML = `
        <h2 id="seoHeading">Chhath Puja Geet, Devotional Songs & Mahaparv Significance</h2>
        <p>
          Welcome to <strong>Chhath Ghat (छठ घाट)</strong>, a dedicated spiritual platform to listen to traditional Chhath Puja Geet, Bhojpuri Chhath songs, Chhathi Maiya Bhajan, and Lord Surya Dev devotional music online. Our high-definition music player brings you soul-stirring melodies by legends like Sharda Sinha, Anuradha Paudwal, Pawan Singh, Kalpana Patowary, Devi, and Neelkamal Singh.
        </p>
        <h2>Mythological & Cultural Significance of Chhath Mahaparv</h2>
        <p>
          Chhath Mahaparv is one of the most sacred, ancient, and austere Vedic festivals in Hindu culture, dedicated to the visible cosmic deity Lord Surya (the Sun God) and His sister Shashthi Devi (Chhathi Maiya). Celebrated on the Shashthi of Kartik Shukla Paksha, this four-day festival represents unwavering faith, deep spiritual purity, and intimate communion with nature. It is enthusiastically celebrated in Bihar, Jharkhand, Uttar Pradesh, the Terai of Nepal, and across the globe by millions of devotees.
        </p>
        <h2>Popular Chhath Devotional Songs Collection</h2>
        <ul class="seo-song-list">
          <li><strong>Ugi Hey Dinanath</strong> — Kalpana Patowary</li>
          <li><strong>Kelwa Ke Paat Par</strong> — Sharda Sinha</li>
          <li><strong>Jal Beech Khada Hoyi</strong> — Pawan Singh</li>
          <li><strong>Uga Ho Surujdev Bhel Bhinsarwa</strong> — Anuradha Paudwal</li>
          <li><strong>Kerwa Ke Patwa Pe Newta</strong> — Pawan Singh</li>
          <li><strong>Dihi Darshan Suruj Gosaiya</strong> — Devi</li>
          <li><strong>Kaanch Hi Baans Ke Bahangiya</strong> — Sharda Sinha</li>
          <li><strong>Koshiya Bharaye Lagal</strong> — Neelkamal Singh & Priyanka Singh</li>
        </ul>
      `;
    } else {
      seoContainer.innerHTML = `
        <h2 id="seoHeading">छठ पूजा के मधुर गीत एवं महापर्व का महत्व</h2>
        <p>
          <strong>छठ घाट (Chhath Ghat)</strong> पर आपका हार्दिक स्वागत है। यह पारंपरिक छठ पूजा के मधुर गीत, भोजपुरी छठ गीत, छठी मईया के भजन और प्रत्यक्ष देव भगवान सूर्य की उपासना का एक पावन भक्ति मंच है। हमारे आधुनिक प्लेयर पर आप शारदा सिन्हा, अनुराधा पौडवाल, पवन सिंह, कल्पना पटवारी, देवी और नीलकमल सिंह जैसे महान कलाकारों के पावन भजन सुन सकते हैं।
        </p>
        <h2>छठ पर्व का पौराणिक एवं सांस्कृतिक महत्व</h2>
        <p>
          छठ पर्व सनातन धर्म का अत्यंत पवित्र, कठिन और लोक-आस्था का महापर्व है जिसमें प्रत्यक्ष देव भगवान भास्कर (सूर्य) तथा उनकी बहन षष्ठी देवी (छठी मईया) की आराधना की जाती है। यह पर्व कार्तिक मास के शुक्ल पक्ष की षष्ठी को श्रद्धाभाव से मनाया जाता है।
        </p>
        <h2>लोकप्रिय छठ पूजा गीत संग्रह (Popular Chhath Geet Collection)</h2>
        <ul class="seo-song-list">
          <li><strong>उगी हे दीनानाथ</strong> — कल्पना पटवारी</li>
          <li><strong>केलवा के पात पर</strong> — शारदा सिन्हा</li>
          <li><strong>जल बीच खड़ा होई जोड़े जोड़े फलवा</strong> — पवन सिंह</li>
          <li><strong>उगा हो सुरुजदेव भेल भिनसरवा</strong> — अनुराधा पौडवाल</li>
          <li><strong>केरवा के पातवा पे नेवता</strong> — पवन सिंह</li>
          <li><strong>दिही दर्शन सुरुज गोसइया</strong> — देवी</li>
          <li><strong>काँच ही बाँस के बहंगिया</strong> — शारदा सिन्हा</li>
          <li><strong>कोशिया भराये लागल</strong> — नीलकमल सिंह व प्रियंका सिंह</li>
        </ul>
      `;
    }
  }

  function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text || "";
    return div.innerHTML;
  }

  // Page Visibility & Lifecycle
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      updateLiveProgress();
      if (isPlaying) {
        requestWakeLock();
      }
    } else {
      if (MEDIA_SESSION_SUPPORTED) {
        try {
          navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
          const cur = getActiveCurrentTime();
          const dur = getActiveDuration();
          updateMediaSessionPosition(cur, dur);
        } catch (e) { }
      }
    }
  });

  window.addEventListener("beforeunload", () => {
    savePlayerStatePeriodic(true);
    releaseWakeLock();
  });

  window.addEventListener("pagehide", () => {
    savePlayerStatePeriodic(true);
    releaseWakeLock();
  });

  window.addEventListener("pageshow", () => {
    if (isPlaying) {
      requestWakeLock();
      updateLiveProgress();
    }
  });

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
    if (activeTag === "input" || activeTag === "textarea" || (document.activeElement && document.activeElement.isContentEditable)) {
      if (e.key === "Escape" && playlistModal && playlistModal.classList.contains("open")) {
        playlistModal.classList.remove("open");
        if (playlistSearch) playlistSearch.blur();
      }
      return;
    }

    // Space -> Toggle Play / Pause
    if (e.code === "Space" || e.key === " ") {
      e.preventDefault();
      togglePlay();
      return;
    }

    // 'M' or 'm' -> Toggle Mute / Unmute
    if (e.key === "m" || e.key === "M") {
      e.preventDefault();
      toggleMute();
      return;
    }

    // 'N' or 'n' -> Next Song
    if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      playNext();
      return;
    }

    // 'P' or 'p' -> Previous Song
    if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      playPrevious();
      return;
    }

    // Arrow Right -> Seek Forward (+5s)
    if (e.key === "ArrowRight") {
      e.preventDefault();
      seekRelative(5);
      return;
    }

    // Arrow Left -> Seek Backward (-5s)
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      seekRelative(-5);
      return;
    }

    // Arrow Up -> Volume Up (+5%)
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const curVol = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
      const newVol = Math.min(100, curVol + 5);
      setVolume(newVol, true, true);
      showToast(`🔊 ${newVol}%`);
      return;
    }

    // Arrow Down -> Volume Down (-5%)
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const curVol = volumeSlider ? parseInt(volumeSlider.value, 10) : 100;
      const newVol = Math.max(0, curVol - 5);
      setVolume(newVol, true, true);
      showToast(newVol === 0 ? "🔇 Muted" : `🔉 ${newVol}%`);
      return;
    }

    // Shift + '>' -> Cycle Speed
    if ((e.shiftKey && e.key === ">") || (e.shiftKey && e.key === ".")) {
      e.preventDefault();
      cyclePlaybackSpeed();
      return;
    }

    // Shift + '<' -> Decrease Speed
    if ((e.shiftKey && e.key === "<") || (e.shiftKey && e.key === ",")) {
      e.preventDefault();
      currentSpeedIndex = (currentSpeedIndex - 1 + PLAYBACK_SPEEDS.length) % PLAYBACK_SPEEDS.length;
      setPlaybackRate(PLAYBACK_SPEEDS[currentSpeedIndex]);
      return;
    }

    // Escape -> Close Playlist Modal / Dropdowns
    if (e.key === "Escape") {
      if (playlistModal && playlistModal.classList.contains("open")) {
        e.preventDefault();
        playlistModal.classList.remove("open");
      }
      closeSpeedDropdown();
    }
  });

  // ---------------------------------------------------------
  // STARTUP INITIALIZATION
  // ---------------------------------------------------------
  setLanguage("en", false);
  loadOfflineSongs();

  // Register High-Performance Service Worker for instant offline audio caching
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("../sw.js").catch((err) => {
        console.debug("ServiceWorker registration notice:", err);
      });
    });
  }

  // Unlock audio pipeline on first user gesture across touch/click/pointer
  function unlockAudioPipeline() {
    ensureAudioContext();
    ensureYouTubeAPI();
    if (offlineAudio && !offlineAudio.src && songs && songs[0] && (songs[0].src || songs[0].file)) {
      offlineAudio.src = songs[0].src || songs[0].file;
      offlineAudio.load();
    }
  }

  ["touchstart", "touchend", "pointerdown", "click", "keydown"].forEach((evt) => {
    document.addEventListener(evt, unlockAudioPipeline, { passive: true, once: true });
  });
})();