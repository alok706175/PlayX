/* =========================================================
   PlayX Universal Modern Dialog Engine (Alert & Confirm)
   Replaces native browser alert & confirm with aesthetic
   glassmorphism popups across all pages.
   ========================================================= */

(function () {
  "use strict";

  // Prevent multiple initializations
  if (window.playxDialogInitialized) return;
  window.playxDialogInitialized = true;

  // DOM Elements holder
  var overlayEl = null;
  var cardEl = null;
  var iconEl = null;
  var titleEl = null;
  var msgEl = null;
  var actionsEl = null;
  var activeResolve = null;

  function ensureDialogDom() {
    if (overlayEl && document.body.contains(overlayEl)) return;

    overlayEl = document.createElement("div");
    overlayEl.className = "playx-dialog-overlay";
    overlayEl.id = "playxDialogOverlay";
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");

    overlayEl.innerHTML =
      '<div class="playx-dialog-card" id="playxDialogCard">' +
        '<div class="playx-dialog-icon-box" id="playxDialogIcon">⚠️</div>' +
        '<h3 class="playx-dialog-title" id="playxDialogTitle">Notice</h3>' +
        '<div class="playx-dialog-message" id="playxDialogMsg"></div>' +
        '<div class="playx-dialog-actions" id="playxDialogActions"></div>' +
      '</div>';

    document.body.appendChild(overlayEl);

    cardEl = document.getElementById("playxDialogCard");
    iconEl = document.getElementById("playxDialogIcon");
    titleEl = document.getElementById("playxDialogTitle");
    msgEl = document.getElementById("playxDialogMsg");
    actionsEl = document.getElementById("playxDialogActions");

    // Close when clicking directly on overlay background
    overlayEl.addEventListener("click", function (e) {
      if (e.target === overlayEl) {
        closeDialog(false);
      }
    });

    // Keyboard support: Enter / Escape
    document.addEventListener("keydown", function (e) {
      if (!overlayEl || !overlayEl.classList.contains("active")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeDialog(false);
      } else if (e.key === "Enter") {
        var activeBtn = actionsEl ? actionsEl.querySelector(".btn-primary, .btn-danger, .btn-success") : null;
        if (activeBtn) {
          e.preventDefault();
          activeBtn.click();
        }
      }
    });
  }

  function closeDialog(result) {
    if (!overlayEl) return;
    overlayEl.classList.remove("active");
    if (activeResolve) {
      var cb = activeResolve;
      activeResolve = null;
      setTimeout(function () {
        cb(result);
      }, 150);
    }
  }

  function detectTypeFromContent(text) {
    var str = String(text || "");
    if (str.indexOf("✅") !== -1 || str.indexOf("success") !== -1 || str.indexOf("सफलता") !== -1) {
      return { type: "success", icon: "✅", title: "Success" };
    }
    if (str.indexOf("🔒") !== -1 || str.indexOf("Admin") !== -1 || str.indexOf("Login") !== -1) {
      return { type: "amber", icon: "🔒", title: "Security Notice" };
    }
    if (str.indexOf("⚠️") !== -1 || str.indexOf("Delete") !== -1 || str.indexOf("Clear") !== -1 || str.indexOf("हटाएं") !== -1) {
      return { type: "danger", icon: "⚠️", title: "Confirm Action" };
    }
    if (str.indexOf("❌") !== -1 || str.indexOf("Error") !== -1 || str.indexOf("गलती") !== -1) {
      return { type: "danger", icon: "❌", title: "Alert" };
    }
    return { type: "info", icon: "✨", title: "Notice" };
  }

  // ---------------------------------------------------------
  // 1. MODERN CONFIRM DIALOG
  // ---------------------------------------------------------
  window.playxConfirm = function (message, options) {
    ensureDialogDom();
    options = options || {};

    var auto = detectTypeFromContent(message);
    var type = options.type || auto.type;
    var icon = options.icon || auto.icon;
    var title = options.title || auto.title;
    var confirmText = options.confirmText || (type === "danger" ? "Confirm" : "Yes, Proceed");
    var cancelText = options.cancelText || "Cancel";

    iconEl.className = "playx-dialog-icon-box type-" + type;
    iconEl.textContent = icon;
    titleEl.textContent = title;

    // Clean formatting for message
    var cleanMsg = String(message || "")
      .replace(/^[⚠️✅🔒❌✨💡ℹ️]\s*/g, "")
      .replace(/^PlayX:\s*/gi, "");

    msgEl.textContent = cleanMsg;
    if (cleanMsg.length < 80 && cleanMsg.indexOf("\n") === -1) {
      msgEl.classList.add("center-text");
    } else {
      msgEl.classList.remove("center-text");
    }

    var primaryClass = type === "danger" ? "btn-danger" : (type === "success" ? "btn-success" : "btn-primary");

    actionsEl.className = "playx-dialog-actions full-width";
    actionsEl.innerHTML =
      '<button type="button" class="playx-dialog-btn ' + primaryClass + '" id="playxDialogBtnConfirm">' + confirmText + '</button>' +
      '<button type="button" class="playx-dialog-btn btn-cancel" id="playxDialogBtnCancel">' + cancelText + '</button>';

    var confirmBtn = document.getElementById("playxDialogBtnConfirm");
    var cancelBtn = document.getElementById("playxDialogBtnCancel");

    confirmBtn.onclick = function () { closeDialog(true); };
    cancelBtn.onclick = function () { closeDialog(false); };

    overlayEl.classList.add("active");
    confirmBtn.focus();

    return new Promise(function (resolve) {
      activeResolve = resolve;
    });
  };

  // ---------------------------------------------------------
  // 2. MODERN ALERT DIALOG
  // ---------------------------------------------------------
  window.playxAlert = function (message, options) {
    ensureDialogDom();
    options = options || {};

    var auto = detectTypeFromContent(message);
    var type = options.type || auto.type;
    var icon = options.icon || auto.icon;
    var title = options.title || auto.title;
    var okText = options.okText || "Got It";

    iconEl.className = "playx-dialog-icon-box type-" + type;
    iconEl.textContent = icon;
    titleEl.textContent = title;

    var cleanMsg = String(message || "")
      .replace(/^[⚠️✅🔒❌✨💡ℹ️]\s*/g, "")
      .replace(/^PlayX:\s*/gi, "");

    msgEl.textContent = cleanMsg;
    if (cleanMsg.length < 80 && cleanMsg.indexOf("\n") === -1) {
      msgEl.classList.add("center-text");
    } else {
      msgEl.classList.remove("center-text");
    }

    var primaryClass = type === "danger" ? "btn-danger" : (type === "success" ? "btn-success" : "btn-primary");

    actionsEl.className = "playx-dialog-actions";
    actionsEl.innerHTML =
      '<button type="button" class="playx-dialog-btn ' + primaryClass + '" id="playxDialogBtnOk" style="width:100%;">' + okText + '</button>';

    var okBtn = document.getElementById("playxDialogBtnOk");
    okBtn.onclick = function () { closeDialog(true); };

    overlayEl.classList.add("active");
    okBtn.focus();

    return new Promise(function (resolve) {
      activeResolve = resolve;
    });
  };

  // Store original native alert & confirm
  window.nativeAlert = window.alert;
  window.nativeConfirm = window.confirm;

  // Intercept window.alert to automatically use modern popup
  window.alert = function (msg) {
    try {
      window.playxAlert(msg);
    } catch (e) {
      if (window.nativeAlert) window.nativeAlert(msg);
    }
  };

  // Provide namespace helper
  window.PlayXModal = {
    alert: window.playxAlert,
    confirm: window.playxConfirm
  };

  // Preload on DOM Ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureDialogDom);
  } else {
    ensureDialogDom();
  }
})();

