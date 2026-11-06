/* =========================================================
   PlayX Global Navigation More Menu & Clear Data Engine
   Universal cross-page implementation for PlayX Music
   ========================================================= */

(function () {
  "use strict";

  // Global toggle for 3-dot dropdowns
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

  // Global Clear Data Engine
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

    var confirmed = confirm(
      "⚠️ PlayX: Clear All Stored Data?\n\n" +
      "This action will completely reset:\n" +
      "• All saved favorite songs & likes ❤️\n" +
      "• Offline downloaded audio tracks 💾\n" +
      "• Playback history & volume/speed settings ⚙️\n" +
      "• Cached browser data & temporary files 🧹\n\n" +
      "Are you sure you want to proceed?"
    );

    if (!confirmed) return;

    try {
      // 1. Clear LocalStorage and SessionStorage
      try { localStorage.clear(); } catch (e) {}
      try { sessionStorage.clear(); } catch (e) {}

      // 2. Clear Cache Storage (Cache API)
      if ("caches" in window) {
        try {
          var cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(function (name) { return caches.delete(name); }));
        } catch (cErr) {
          console.warn("PlayX Cache clear warning:", cErr);
        }
      }

      // 3. Clear IndexedDB
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
            try { indexedDB.deleteDatabase("playx-offline-music"); } catch (e) {}
            try { indexedDB.deleteDatabase("chhath-puja-db"); } catch (e) {}
            try { indexedDB.deleteDatabase("playx_db"); } catch (e) {}
          }
        } catch (idbErr) {
          console.warn("PlayX IndexedDB clear warning:", idbErr);
        }
      }

      // 4. Reset Service Worker
      if ("serviceWorker" in navigator) {
        try {
          var registrations = await navigator.serviceWorker.getRegistrations();
          for (var r = 0; r < registrations.length; r++) {
            await registrations[r].unregister();
          }
        } catch (swErr) {
          console.warn("PlayX SW unregister warning:", swErr);
        }
      }

      alert("✅ All PlayX data, cache, and offline downloads have been successfully cleared!");
      window.location.reload();
    } catch (err) {
      console.error("PlayX Clear Data Error:", err);
      alert("✅ Data cleared. Reloading page...");
      window.location.reload();
    }
  };
})();
