/* =========================================================
   REALISTIC HANGING LIGHT-BULB THEME TRANSITION CONTROLLER
   Integrated with PlayX Existing Theme System
   ========================================================= */

(function (window) {
  "use strict";

  let isAnimating = false;
  let overlayEl = null;

  // Reduced motion query check
  const prefersReducedMotion = () => {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  /**
   * Builds the DOM structure for the realistic incandescent bulb overlay
   */
  function ensureOverlayExists() {
    if (overlayEl && document.body.contains(overlayEl)) {
      return overlayEl;
    }

    let existing = document.getElementById("bulbTransitionOverlay");
    if (existing) {
      overlayEl = existing;
      return overlayEl;
    }

    const overlay = document.createElement("div");
    overlay.id = "bulbTransitionOverlay";
    overlay.className = "bulb-transition-overlay";
    overlay.setAttribute("aria-hidden", "true");

    overlay.innerHTML = `
      <div class="bulb-light-flash"></div>
      <div class="bulb-cable-wrap" id="bulbCableWrap">
        <div class="bulb-cable"></div>
        <div class="bulb-assembly">
          <!-- Rubber strain relief holder -->
          <div class="bulb-holder"></div>
          <!-- Metallic threaded screw cap -->
          <div class="bulb-cap">
            <div class="cap-thread"></div>
            <div class="cap-thread"></div>
            <div class="cap-thread"></div>
            <div class="cap-contact"></div>
          </div>
          <!-- Incandescent glass bulb -->
          <div class="glass-bulb">
            <div class="glass-reflection-left"></div>
            <div class="glass-reflection-right"></div>
            <div class="glass-reflection-dot"></div>
            <!-- Internal stem mount and tungsten filament -->
            <div class="bulb-stem">
              <div class="stem-mount"></div>
              <div class="support-wire wire-left"></div>
              <div class="support-wire wire-right"></div>
              <div class="bulb-filament">
                <div class="filament-loop"></div>
              </div>
            </div>
            <!-- Internal warm illumination -->
            <div class="bulb-internal-glow"></div>
          </div>
          <!-- Outer radial ambient radiance -->
          <div class="bulb-ambient-glow"></div>
          <div class="bulb-light-cone"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    overlayEl = overlay;
    return overlayEl;
  }

  /**
   * Resets all animation classes to a pristine state
   */
  function resetBulbState(overlay) {
    if (!overlay) return;
    overlay.classList.remove(
      "is-active",
      "anim-descend",
      "anim-retract",
      "bulb-is-lit",
      "flash-active"
    );
  }

  /**
   * Main transition trigger
   * @param {Object} options
   * @param {string} options.targetTheme - "light" or "dark"
   * @param {Function} options.onApplyTheme - Callback to execute the actual theme change at ignition/extinction
   * @param {HTMLElement} [options.toggleBtn] - The toggle button element to show busy state
   */
  function triggerBulbTransition(options) {
    const { targetTheme, onApplyTheme, toggleBtn } = options;

    // Multiple click protection
    if (isAnimating) {
      return false;
    }

    // Accessibility: instant theme toggle if user prefers reduced motion
    if (prefersReducedMotion()) {
      if (typeof onApplyTheme === "function") {
        onApplyTheme();
      }
      return true;
    }

    isAnimating = true;
    if (toggleBtn) {
      toggleBtn.classList.add("is-animating");
    }

    const overlay = ensureOverlayExists();
    resetBulbState(overlay);

    const isTurningOn = targetTheme === "light";

    // Prepare initial state:
    // If turning on (dark -> light), bulb arrives unlit, then ignites
    // If turning off (light -> dark), bulb arrives lit, then extinguishes
    if (!isTurningOn) {
      overlay.classList.add("bulb-is-lit");
    }

    overlay.classList.add("is-active", "anim-descend");

    if (isTurningOn) {
      // -----------------------------------------------------------
      // SEQUENCE A: DARK -> LIGHT (Bulb drops, ignites, switches theme)
      // -----------------------------------------------------------

      // 1. Bulb settles; ignite filament & illuminate glass
      setTimeout(() => {
        if (!isAnimating) return;
        overlay.classList.add("bulb-is-lit");
      }, 1020);

      // 2. Exact moment of peak illumination: switch theme & flash
      setTimeout(() => {
        if (!isAnimating) return;
        overlay.classList.add("flash-active");
        if (typeof onApplyTheme === "function") {
          onApplyTheme();
        }
      }, 1250);

      // 3. Fade flash layer
      setTimeout(() => {
        if (!isAnimating) return;
        overlay.classList.remove("flash-active");
      }, 1550);

      // 4. Retract bulb smoothly back into ceiling
      setTimeout(() => {
        if (!isAnimating) return;
        overlay.classList.remove("anim-descend");
        overlay.classList.add("anim-retract");
      }, 1800);

      // 5. Cleanup and reset lock
      setTimeout(() => {
        cleanup();
      }, 2650);

    } else {
      // -----------------------------------------------------------
      // SEQUENCE B: LIGHT -> DARK (Bulb drops lit, shuts off, switches theme)
      // -----------------------------------------------------------

      // 1. Bulb settles; filament snaps off, ambient light dies
      setTimeout(() => {
        if (!isAnimating) return;
        overlay.classList.remove("bulb-is-lit");
      }, 1050);

      // 2. Exact moment of extinction: switch theme
      setTimeout(() => {
        if (!isAnimating) return;
        if (typeof onApplyTheme === "function") {
          onApplyTheme();
        }
      }, 1150);

      // 3. Retract cold bulb upward into ceiling
      setTimeout(() => {
        if (!isAnimating) return;
        overlay.classList.remove("anim-descend");
        overlay.classList.add("anim-retract");
      }, 1550);

      // 4. Cleanup and reset lock
      setTimeout(() => {
        cleanup();
      }, 2400);
    }

    function cleanup() {
      resetBulbState(overlay);
      if (toggleBtn) {
        toggleBtn.classList.remove("is-animating");
      }
      isAnimating = false;
    }

    return true;
  }

  // Export to global scope for seamless integration
  window.BulbThemeTransition = {
    trigger: triggerBulbTransition,
    ensureOverlayExists: ensureOverlayExists,
    isAnimating: () => isAnimating
  };

  // Pre-initialize overlay on DOMContentLoaded for zero-latency first click
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensureOverlayExists);
  } else {
    ensureOverlayExists();
  }

})(window);
