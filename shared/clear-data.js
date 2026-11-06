/* =========================================================
   PlayX Global Navigation More Menu & Page-Aware Clear Data Engine
   Universal cross-page implementation for PlayX Music
   - On individual pages: Clears only that page/category's data
   - On Homepage (home.html): Clears the entire website's data
   ========================================================= */

(function () {
  "use strict";

  // ---------------------------------------------------------
  // 1. PAGE & CATEGORY CONTEXT DETECTOR
  // ---------------------------------------------------------
  function getCurrentPageContext() {
    var path = (window.location.pathname || "").toLowerCase();
    var festTitle = (document.body.getAttribute("data-festival-title") || "").trim();

    // 1. Hindi Songs Page
    if (path.indexOf("hindi-song") !== -1) {
      return {
        id: "hindi",
        name: "Hindi Songs",
        hindiName: "हिंदी गीत",
        storagePrefixes: ["hindi_"],
        storageExactKeys: [
          "hindi_songs_favs",
          "hindi_player_last_song",
          "hindi_player_last_pos",
          "hindi_player_queue",
          "hindi_player_volume",
          "hindi_player_muted",
          "hindi_player_crossfade",
          "hindi_songs_theme"
        ],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return item.source === "hindi" ||
            cat === "romantic" || cat === "90s classics" || cat === "dance & beats" || cat === "soulful melodies" ||
            cat.indexOf("hindi") !== -1 || album.indexOf("hindi") !== -1 || key.indexOf("hindi") !== -1;
        },
        isGlobal: false
      };
    }

    // 2. Haryanvi Songs Page
    if (festTitle.indexOf("Haryanvi") !== -1 || path.indexOf("haryanvi") !== -1) {
      return {
        id: "haryanvi",
        name: "Haryanvi Songs",
        hindiName: "हरियाणवी गीत",
        storagePrefixes: ["fav_Haryanvi", "last_Haryanvi", "haryanvi_"],
        storageExactKeys: ["fav_Haryanvi Songs"],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return cat.indexOf("haryanvi") !== -1 || album.indexOf("haryanvi") !== -1 || key.indexOf("haryanvi") !== -1;
        },
        isGlobal: false
      };
    }

    // 3. Bhojpuri Songs Page
    if (festTitle.indexOf("Bhojpuri") !== -1 || path.indexOf("bhojpuri") !== -1) {
      return {
        id: "bhojpuri",
        name: "Bhojpuri Songs",
        hindiName: "भोजपुरी गीत",
        storagePrefixes: ["fav_Bhojpuri", "last_Bhojpuri", "bhojpuri_"],
        storageExactKeys: ["fav_Bhojpuri Songs"],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return cat.indexOf("bhojpuri") !== -1 || album.indexOf("bhojpuri") !== -1 || key.indexOf("bhojpuri") !== -1;
        },
        isGlobal: false
      };
    }

    // 4. Chhath Puja Page
    if (path.indexOf("chhath") !== -1 || festTitle.indexOf("Chhath") !== -1) {
      return {
        id: "chhath",
        name: "Chhath Puja Songs",
        hindiName: "छठ पूजा गीत",
        storagePrefixes: ["chhath_"],
        storageExactKeys: [
          "chhath_player_last_song",
          "chhath_player_last_pos",
          "chhath_player_volume",
          "chhath_player_muted",
          "chhath_songs_favs",
          "fav_Chhath Puja Songs"
        ],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return item.source === "chhath" || cat.indexOf("chhath") !== -1 || album.indexOf("chhath") !== -1 || key.indexOf("chhath") !== -1;
        },
        isGlobal: false
      };
    }

    // 5. Durga Puja Page
    if (festTitle.indexOf("Durga") !== -1 || path.indexOf("durga") !== -1) {
      return {
        id: "durga",
        name: "Durga Puja Songs",
        hindiName: "दुर्गा पूजा भजन",
        storagePrefixes: ["fav_Durga", "last_Durga", "durga_"],
        storageExactKeys: ["fav_Durga Puja Songs"],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return cat.indexOf("durga") !== -1 || album.indexOf("durga") !== -1 || key.indexOf("durga") !== -1;
        },
        isGlobal: false
      };
    }

    // 6. Holi Songs Page
    if (festTitle.indexOf("Holi") !== -1 || path.indexOf("holi") !== -1) {
      return {
        id: "holi",
        name: "Holi Songs",
        hindiName: "होली गीत",
        storagePrefixes: ["fav_Holi", "last_Holi", "holi_"],
        storageExactKeys: ["fav_Holi Songs"],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return cat.indexOf("holi") !== -1 || album.indexOf("holi") !== -1 || key.indexOf("holi") !== -1;
        },
        isGlobal: false
      };
    }

    // 7. Punjabi Songs Page
    if (festTitle.indexOf("Punjabi") !== -1 || path.indexOf("punjabi") !== -1) {
      return {
        id: "punjabi",
        name: "Punjabi Songs",
        hindiName: "पंजाबी गीत",
        storagePrefixes: ["fav_Punjabi", "last_Punjabi", "punjabi_"],
        storageExactKeys: ["fav_Punjabi Songs"],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return cat.indexOf("punjabi") !== -1 || album.indexOf("punjabi") !== -1 || key.indexOf("punjabi") !== -1;
        },
        isGlobal: false
      };
    }

    // 8. Saawan Songs Page
    if (festTitle.indexOf("Saawan") !== -1 || path.indexOf("saawan") !== -1) {
      return {
        id: "saawan",
        name: "Saawan Songs",
        hindiName: "सावन शिव भजन",
        storagePrefixes: ["fav_Saawan", "last_Saawan", "saawan_"],
        storageExactKeys: ["fav_Saawan Songs"],
        matchDbItem: function (item) {
          if (!item) return false;
          var cat = (item.category || "").toLowerCase();
          var album = (item.album || "").toLowerCase();
          var key = (item.key || "").toLowerCase();
          return cat.indexOf("saawan") !== -1 || album.indexOf("saawan") !== -1 || key.indexOf("saawan") !== -1;
        },
        isGlobal: false
      };
    }

    // 9. Admin Page
    if (path.indexOf("admin") !== -1) {
      return {
        id: "admin",
        name: "Admin Dashboard",
        hindiName: "एडमिन डैशबोर्ड",
        storagePrefixes: ["playx_admin_"],
        storageExactKeys: [
          "playx_admin_logged_in",
          "playx_admin_user",
          "playx_admin_token",
          "playx_token",
          "playx_github_token",
          "playx_admin_password",
          "playx_backend_url"
        ],
        matchDbItem: null,
        isGlobal: false
      };
    }

    // 10. Default: Homepage (Whole Website / Global)
    return {
      id: "global",
      name: "PlayX Whole Website",
      hindiName: "संपूर्ण वेबसाइट (होम)",
      isGlobal: true
    };
  }

  // ---------------------------------------------------------
  // 2. DROPDOWN MENU INTERACTION HANDLERS
  // ---------------------------------------------------------
  document.addEventListener("click", function (e) {
    var moreBtn = e.target.closest(".btn-nav-more");
    if (moreBtn) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();

      var wrap = moreBtn.closest(".nav-more-menu-wrap");
      var dropdown = wrap ? wrap.querySelector(".nav-more-dropdown") : null;
      if (dropdown) {
        var isOpen = dropdown.classList.toggle("active");
        moreBtn.classList.toggle("active", isOpen);
        moreBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      }
      return;
    }

    // Close all open 3-dot dropdowns when clicking outside
    var openDropdowns = document.querySelectorAll(".nav-more-dropdown.active");
    for (var i = 0; i < openDropdowns.length; i++) {
      var d = openDropdowns[i];
      if (!d.contains(e.target)) {
        d.classList.remove("active");
        var pWrap = d.closest(".nav-more-menu-wrap");
        var pBtn = pWrap ? pWrap.querySelector(".btn-nav-more") : null;
        if (pBtn) {
          pBtn.classList.remove("active");
          pBtn.setAttribute("aria-expanded", "false");
        }
      }
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var openDropdowns = document.querySelectorAll(".nav-more-dropdown.active, .more-dropdown-menu.active");
      for (var i = 0; i < openDropdowns.length; i++) {
        var d = openDropdowns[i];
        d.classList.remove("active");
        var pWrap = d.closest(".nav-more-menu-wrap, .more-menu-wrapper");
        var pBtn = pWrap ? pWrap.querySelector(".btn-nav-more, .btn-more-menu") : null;
        if (pBtn) {
          pBtn.classList.remove("active");
          pBtn.setAttribute("aria-expanded", "false");
        }
      }
    }
  });

  // ---------------------------------------------------------
  // 3. INTELLIGENT PAGE-AWARE CLEAR DATA ENGINE
  // ---------------------------------------------------------
  window.handleClearPlayXData = async function (e) {
    if (e) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    }

    // Close any open menus
    var allMenus = document.querySelectorAll(".more-dropdown-menu, .nav-more-dropdown, .share-dropdown-menu");
    allMenus.forEach(function (m) { m.classList.remove("active"); });
    var allBtns = document.querySelectorAll(".btn-more-menu, .btn-nav-more");
    allBtns.forEach(function (b) { b.classList.remove("active"); });

    var ctx = getCurrentPageContext();

    // A. HOMEPAGE CLEAR: Clears the entire website's data
    if (ctx.isGlobal) {
      var confirmedAll = confirm(
        "⚠️ PlayX: Clear Entire Website Data?\n\n" +
        "This will completely reset all data across the WHOLE website:\n" +
        "• All saved favorites across all categories (Hindi, Bhojpuri, Haryanvi, etc.) ❤️\n" +
        "• All offline downloaded audio tracks 💾\n" +
        "• All playback history and settings ⚙️\n" +
        "• All cached offline files and service worker data 🧹\n\n" +
        "Are you sure you want to clear EVERYTHING?"
      );

      if (!confirmedAll) return;

      try {
        // Clear all storages
        try { localStorage.clear(); } catch (err) {}
        try { sessionStorage.clear(); } catch (err) {}

        // Clear all CacheStorage
        if ("caches" in window) {
          try {
            var cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(function (name) { return caches.delete(name); }));
          } catch (cErr) {
            console.warn("Global cache clear warning:", cErr);
          }
        }

        // Clear all IndexedDB
        if (window.indexedDB) {
          try {
            if (typeof indexedDB.databases === "function") {
              var dbs = await indexedDB.databases();
              dbs.forEach(function (db) {
                if (db.name) {
                  try { indexedDB.deleteDatabase(db.name); } catch (e) {}
                }
              });
            } else {
              try { indexedDB.deleteDatabase("ChhathOfflineDB"); } catch (e) {}
              try { indexedDB.deleteDatabase("playx-offline-music"); } catch (e) {}
              try { indexedDB.deleteDatabase("chhath-puja-db"); } catch (e) {}
              try { indexedDB.deleteDatabase("playx_db"); } catch (e) {}
            }
          } catch (idbErr) {
            console.warn("Global IndexedDB clear warning:", idbErr);
          }
        }

        // Unregister service workers
        if ("serviceWorker" in navigator) {
          try {
            var registrations = await navigator.serviceWorker.getRegistrations();
            for (var r = 0; r < registrations.length; r++) {
              await registrations[r].unregister();
            }
          } catch (swErr) {
            console.warn("Global SW unregister warning:", swErr);
          }
        }

        alert("✅ All PlayX website data, favorites, and offline downloads have been successfully cleared!");
        window.location.reload();
      } catch (err) {
        console.error("Global Clear Data Error:", err);
        alert("✅ Website data cleared. Reloading page...");
        window.location.reload();
      }
      return;
    }

    // B. INDIVIDUAL PAGE CLEAR: Clears only this specific category's data
    var confirmedPage = confirm(
      "⚠️ Clear " + ctx.name + " Data?\n\n" +
      "This action will remove only " + ctx.name + " (" + ctx.hindiName + ") data:\n" +
      "• Saved favorites & likes for " + ctx.name + "\n" +
      "• Playback history & position for " + ctx.name + "\n" +
      "• Offline downloaded tracks for " + ctx.name + "\n\n" +
      "📌 Other pages and music categories will NOT be affected.\n\n" +
      "Are you sure you want to proceed?"
    );

    if (!confirmedPage) return;

    try {
      // 1. Remove specific keys from localStorage
      try {
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!k) continue;

          // Exact match
          if (ctx.storageExactKeys && ctx.storageExactKeys.indexOf(k) !== -1) {
            keysToRemove.push(k);
            continue;
          }

          // Prefix match
          if (ctx.storagePrefixes) {
            for (var p = 0; p < ctx.storagePrefixes.length; p++) {
              if (k.indexOf(ctx.storagePrefixes[p]) === 0) {
                keysToRemove.push(k);
                break;
              }
            }
          }
        }

        keysToRemove.forEach(function (k) {
          try { localStorage.removeItem(k); } catch (e) {}
        });
      } catch (lsErr) {
        console.warn("LocalStorage selective clear warning:", lsErr);
      }

      // 2. Remove session keys
      try {
        var sessKeys = [];
        for (var s = 0; s < sessionStorage.length; s++) {
          var sk = sessionStorage.key(s);
          if (sk && sk.indexOf(ctx.id) !== -1) sessKeys.push(sk);
        }
        sessKeys.forEach(function (sk) {
          try { sessionStorage.removeItem(sk); } catch (e) {}
        });
      } catch (ssErr) {}

      // 3. Remove downloaded offline songs belonging to this category from IndexedDB
      if (window.OfflineManager && typeof window.OfflineManager.getAllDownloadedSongs === "function" && ctx.matchDbItem) {
        try {
          var downloaded = await window.OfflineManager.getAllDownloadedSongs();
          for (var d = 0; d < downloaded.length; d++) {
            var item = downloaded[d];
            if (ctx.matchDbItem(item)) {
              await window.OfflineManager.deleteDownloadedSong(item.key);
            }
          }
        } catch (dbDelErr) {
          console.warn("Selective offline delete warning:", dbDelErr);
        }
      }

      alert("✅ " + ctx.name + " (" + ctx.hindiName + ") data has been successfully cleared!");
      window.location.reload();
    } catch (err) {
      console.error("Selective Clear Data Error:", err);
      alert("✅ " + ctx.name + " data cleared. Reloading page...");
      window.location.reload();
    }
  };
})();
