/**
 * PlayX Auto Added Songs - Admin Song Importer Controller (v2.0 Redesign)
 * 
 * Provides a high-end administrative modal for analyzing YouTube / YouTube Music links,
 * previewing rich metadata, auto-cleaning titles, visual category selection,
 * real-time server & GitHub auto-sync status, and import history logs.
 */

(function () {
  'use strict';

  // Base API configuration (Local server or production fallback)
  const LOCAL_BACKEND_PORT = 3000;
  const RENDER_BACKEND_URL = 'https://playx-backend.onrender.com';

  const API_BASE = (() => {
    const origin = window.location.origin;
    if (origin && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      return 'http://localhost:3000';
    }
    const custom = localStorage.getItem('playx_backend_url');
    if (custom) return custom;
    return RENDER_BACKEND_URL;
  })();

  let modalEl = null;
  let activeAnalysis = null;
  let isSubmitting = false;
  let currentActiveTab = 'import'; // 'import' | 'history' | 'settings'

  const CATEGORY_OPTIONS = [
    { id: 'hindi', name: 'Hindi Songs', hindi: 'हिंदी गीत', icon: '🎵', page: 'hindi-songs/hindi-songs.html', file: 'hindi-songs/hindi_songs.json' },
    { id: 'chhath', name: 'Chhath Puja Songs', hindi: 'छठ पूजा', icon: '☀️', page: 'chhath-puja/chhath-puja.html', file: 'chhath-puja/youtube_songs.json' },
    { id: 'saawan', name: 'Saawan Songs', hindi: 'सावन शिव भजन', icon: '🔱', page: 'saawan-songs/saawan-songs.html', file: 'saawan-songs/saawan_songs.json' },
    { id: 'durga', name: 'Durga Puja Songs', hindi: 'दुर्गा पूजा', icon: '🌸', page: 'durga-puja-songs/durga-puja-songs.html', file: 'durga-puja-songs/durga_puja_songs.json' },
    { id: 'bhojpuri', name: 'Bhojpuri Songs', hindi: 'भोजपुरी हिट्स', icon: '🌾', page: 'bhojpuri-songs/bhojpuri-songs.html', file: 'bhojpuri-songs/bhojpuri_songs.json' },
    { id: 'holi', name: 'Holi Songs', hindi: 'होली स्पेशल', icon: '🎨', page: 'holi-songs/holi-songs.html', file: 'holi-songs/holi_songs.json' },
    { id: 'haryanvi', name: 'Haryanvi Songs', hindi: 'हरियाणवी', icon: '🚜', page: 'haryanvi-songs/haryanvi-songs.html', file: 'haryanvi-songs/haryanvi_songs.json' },
    { id: 'punjabi', name: 'Punjabi Songs', hindi: 'पंजाबी भांगड़ा', icon: '🥁', page: 'punjabi-songs/punjabi-songs.html', file: 'punjabi-songs/punjabi_songs.json' }
  ];

  /**
   * Cleans YouTube noise from titles (e.g. "Official Video", "4K", channel watermarks)
   */
  function cleanTitleString(title) {
    if (!title) return '';
    let cleaned = title;
    // Remove common bracketed noise
    cleaned = cleaned.replace(/\s*[([{\-—]\s*(official\s*(music\s*)?(video|audio|lyric(s)?|track|hd|4k|remastered|full\s*song|version|promo)?|4k\s*ultra\s*hd|1080p|hd|audio\s*song|video\s*song|exclusive|full\s*video|lyrical\s*video|new\s*song\s*\d{4})\s*[)\]}]\s*/gi, ' ');
    // Remove trailing studio or channel watermarks
    cleaned = cleaned.replace(/\s*\|\s*(t-series|zee\s*music\s*company|sony\s*music\s*india|tips\s*official|yrf|speed\s*records|white\s*hill\s*music|wave\s*music|worldwide\s*records).*/gi, '');
    // Clean orphan pipes or hyphens at the end
    cleaned = cleaned.replace(/[\s|—\-]+$/, '');
    cleaned = cleaned.replace(/^[\s|—\-]+/, '');
    // Condense double spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    return cleaned || title;
  }

  /**
   * Injects modal DOM structure into the page
   */
  function initImporterUI() {
    if (document.getElementById('playxSongImporterOverlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'playxSongImporterOverlay';
    overlay.className = 'song-importer-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'importerModalTitle');

    overlay.innerHTML = `
      <div class="song-importer-modal" id="importerModalCard">
        <!-- Header -->
        <div class="importer-header">
          <div class="importer-title-group">
            <div class="importer-icon-badge">🎵</div>
            <div>
              <h2 id="importerModalTitle">
                <span>PlayX Song Importer</span>
                <span class="badge-v2">v2.0 Pro</span>
              </h2>
              <p>Instant YouTube & YouTube Music Multi-Category Auto Importer</p>
            </div>
          </div>
          <button class="importer-close-btn" id="importerCloseBtn" type="button" title="Close Importer (Esc)" aria-label="Close">✕</button>
        </div>

        <!-- Navigation Tabs -->
        <div class="importer-tabs-nav">
          <button type="button" class="importer-tab-btn active" data-tab="import" id="tabBtnImport">
            <span>📥</span> <span>Import Song</span>
          </button>
          <button type="button" class="importer-tab-btn" data-tab="history" id="tabBtnHistory">
            <span>🕒</span> <span>Recent History</span>
            <span class="tab-badge" id="historyCountBadge">0</span>
          </button>
          <button type="button" class="importer-tab-btn" data-tab="settings" id="tabBtnSettings">
            <span>⚙️</span> <span>Sync Engine & Token</span>
          </button>
        </div>

        <!-- Body Container -->
        <div class="importer-body" id="importerBody">
          <!-- Notification / Share Banner -->
          <div id="importerBanner" style="display: none;"></div>

          <!-- TAB 1: IMPORT SONG -->
          <div class="importer-tab-content active" id="tabContentImport">
            <!-- Live Sync Status Capsule -->
            <div class="importer-sync-bar" id="importerSyncBar">
              <div class="importer-sync-indicator" id="importerSyncIndicator">
                <span class="pulse-dot amber"></span>
                <span>Connecting to Sync Engine...</span>
              </div>
              <div class="importer-sync-actions">
                <button type="button" id="importerQuickTokenBtn" class="importer-mini-btn" title="Configure GitHub Token">
                  <span>⚙️ Token</span>
                </button>
                <button type="button" id="importerRefreshSyncBtn" class="importer-mini-btn" title="Re-check Server Status">
                  <span>🔄 Refresh</span>
                </button>
              </div>
            </div>

            <!-- URL Input Card -->
            <div class="importer-input-card">
              <div class="importer-input-header">
                <label for="importerUrlInput">
                  <span>🎵 Paste YouTube Link</span>
                </label>
                <span class="supported-tag">Watch • Music • Shorts • Share URLs</span>
              </div>

              <div class="importer-search-group">
                <span class="importer-icon-lead">▶</span>
                <input type="text" id="importerUrlInput" class="importer-url-input"
                  placeholder="Paste YouTube or YouTube Music link (e.g. https://youtu.be/...)" autocomplete="off" spellcheck="false">
                <button type="button" class="btn-clear-input" id="importerClearInputBtn" title="Clear input">✕</button>
                <button type="button" class="btn-paste" id="importerPasteBtn" title="Paste from clipboard">
                  <span>📋</span> <span>Paste</span>
                </button>
                <button type="button" class="btn-analyze" id="importerAnalyzeBtn">
                  <span id="analyzeBtnIcon">⚡</span>
                  <span id="analyzeBtnText">Analyze Link</span>
                </button>
              </div>

              <!-- Format Guidance Pills -->
              <div class="importer-format-pills">
                <span class="format-pill">📺 youtube.com/watch?v=...</span>
                <span class="format-pill">⚡ youtu.be/...</span>
                <span class="format-pill">🎵 music.youtube.com/...</span>
                <span class="format-pill">📱 youtube.com/shorts/...</span>
              </div>
            </div>

            <!-- Dynamic Container for Interactive Preview Card & Results -->
            <div id="importerDynamicArea"></div>
          </div>

          <!-- TAB 2: RECENT HISTORY -->
          <div class="importer-tab-content" id="tabContentHistory">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
              <h3 style="margin: 0; font-size: 1.05rem; color: var(--importer-text);">Recently Auto-Added Songs</h3>
              <button type="button" id="refreshHistoryBtn" class="importer-mini-btn">🔄 Refresh History</button>
            </div>
            <div id="importerHistoryContainer" class="importer-history-list">
              <div style="text-align: center; padding: 2.5rem 1rem; color: var(--importer-text-muted);">
                <div class="spinner" style="margin: 0 auto 0.8rem;"></div>
                Loading recent imports history...
              </div>
            </div>
          </div>

          <!-- TAB 3: SYNC SETTINGS & TOKEN -->
          <div class="importer-tab-content" id="tabContentSettings">
            <div class="importer-settings-grid">
              <!-- Strategy 1: Local Server -->
              <div class="settings-card">
                <div class="settings-card-header">
                  <h4><span>🖥️ Strategy 1: Local Backend Server</span></h4>
                  <span id="settingsServerBadge" class="format-pill">Checking...</span>
                </div>
                <p class="settings-desc">
                  When running locally, PlayX automatically stages updated JSON files, auto-syncs dataset bundles, creates git commits, and executes <code>git push origin main</code> directly through Git CLI.
                </p>
                <div style="font-size: 0.82rem; background: rgba(0,0,0,0.3); padding: 0.6rem 0.85rem; border-radius: 8px; font-family: monospace; color: var(--importer-accent);">
                  Terminal command: node "backend/server.js"
                </div>
              </div>

              <!-- Strategy 2: GitHub API Direct Push -->
              <div class="settings-card">
                <div class="settings-card-header">
                  <h4><span>🐙 Strategy 2: GitHub API Direct Push (PLAYX_TOKEN)</span></h4>
                  <span id="settingsTokenBadge" class="format-pill">Not Configured</span>
                </div>
                <p class="settings-desc">
                  Allows instant, direct commits to <b>alok706175/PlayX (main branch)</b> right from this web browser without requiring a terminal server. Safe UTF-8 Base64 encoding prevents file corruption.
                </p>

                <div class="token-input-row">
                  <div class="token-input-wrapper">
                    <input type="password" id="importerGhTokenInput" placeholder="Enter GitHub Personal Access Token (ghp_...)" class="importer-token-input">
                    <button type="button" class="btn-toggle-token-vis" id="importerToggleTokenVis" title="Toggle visibility">👁️</button>
                  </div>
                  <button type="button" id="importerSaveTokenBtn" class="importer-mini-btn primary">
                    <span>💾 Save Token</span>
                  </button>
                  <button type="button" id="importerClearTokenBtn" class="importer-mini-btn danger">
                    <span>🗑️ Clear</span>
                  </button>
                </div>

                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.4rem;">
                  <a href="https://github.com/settings/tokens/new?scopes=repo&description=PlayX-Song-Importer" target="_blank" rel="noopener noreferrer" class="importer-mini-btn" style="text-decoration:none;">
                    🔑 Generate New Token (repo scope)
                  </a>
                  <a href="https://github.com/alok706175/PlayX/actions/workflows/auto-add-song.yml" target="_blank" rel="noopener noreferrer" class="importer-mini-btn" style="text-decoration:none;">
                    ⚡ GitHub Actions Runner
                  </a>
                  <a href="https://github.com/alok706175/PlayX/settings/secrets/actions" target="_blank" rel="noopener noreferrer" class="importer-mini-btn" style="text-decoration:none;">
                    🔐 Repo Secrets
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    modalEl = overlay;

    // Attach core modal event listeners
    attachModalListeners();
  }

  /**
   * Attaches interactive event handlers to the modal elements
   */
  function attachModalListeners() {
    // Close modal triggers
    document.getElementById('importerCloseBtn').addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    // Tab switching
    const tabBtns = modalEl.querySelectorAll('.importer-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Quick Token button in sync bar jumps to Settings tab
    const quickTokenBtn = document.getElementById('importerQuickTokenBtn');
    if (quickTokenBtn) {
      quickTokenBtn.addEventListener('click', () => switchTab('settings'));
    }

    // Refresh sync status button
    const refreshSyncBtn = document.getElementById('importerRefreshSyncBtn');
    if (refreshSyncBtn) {
      refreshSyncBtn.addEventListener('click', () => {
        updateSyncBar();
        showBanner('info', '🔄 Sync engine status refreshed.');
      });
    }

    // Refresh history button
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    if (refreshHistoryBtn) {
      refreshHistoryBtn.addEventListener('click', loadHistoryList);
    }

    // URL Input clear button
    const urlInput = document.getElementById('importerUrlInput');
    const clearInputBtn = document.getElementById('importerClearInputBtn');
    if (urlInput && clearInputBtn) {
      urlInput.addEventListener('input', () => {
        clearInputBtn.style.display = urlInput.value.trim() ? 'flex' : 'none';
      });
      clearInputBtn.addEventListener('click', () => {
        urlInput.value = '';
        clearInputBtn.style.display = 'none';
        urlInput.focus();
      });
    }

    // Token save button
    const saveTokenBtn = document.getElementById('importerSaveTokenBtn');
    if (saveTokenBtn) {
      saveTokenBtn.addEventListener('click', () => {
        const val = (document.getElementById('importerGhTokenInput')?.value || '').trim();
        if (val) {
          localStorage.setItem('playx_token', val);
          localStorage.setItem('playx_github_token', val);
          showBanner('info', '✅ PLAYX_TOKEN saved securely in browser!');
          updateSyncBar();
          setTimeout(() => switchTab('import'), 600);
        } else {
          showBanner('warning', 'Please enter a valid GitHub Personal Access Token (starts with ghp_ or github_pat_).');
        }
      });
    }

    // Token clear button
    const clearTokenBtn = document.getElementById('importerClearTokenBtn');
    if (clearTokenBtn) {
      clearTokenBtn.addEventListener('click', () => {
        localStorage.removeItem('playx_token');
        localStorage.removeItem('playx_github_token');
        const tokenInput = document.getElementById('importerGhTokenInput');
        if (tokenInput) tokenInput.value = '';
        showBanner('info', 'PLAYX_TOKEN cleared.');
        updateSyncBar();
      });
    }

    // Token visibility toggle
    const toggleTokenBtn = document.getElementById('importerToggleTokenVis');
    if (toggleTokenBtn) {
      toggleTokenBtn.addEventListener('click', () => {
        const input = document.getElementById('importerGhTokenInput');
        if (input) {
          const isPass = input.type === 'password';
          input.type = isPass ? 'text' : 'password';
          toggleTokenBtn.textContent = isPass ? '🙈' : '👁️';
        }
      });
    }

    // Clipboard Paste button
    const pasteBtn = document.getElementById('importerPasteBtn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text) {
              const input = document.getElementById('importerUrlInput');
              input.value = text.trim();
              if (clearInputBtn) clearInputBtn.style.display = 'flex';
              analyzeUrl(text.trim());
            }
          } else {
            urlInput.focus();
          }
        } catch (err) {
          urlInput.focus();
        }
      });
    }

    // Analyze button
    const analyzeBtn = document.getElementById('importerAnalyzeBtn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        const val = document.getElementById('importerUrlInput').value.trim();
        if (!val) {
          showBanner('warning', 'Please enter a valid YouTube or YouTube Music link.');
          return;
        }
        analyzeUrl(val);
      });
    }

    // Enter key triggers analysis
    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const val = e.target.value.trim();
          if (val) analyzeUrl(val);
        }
      });
    }
  }

  /**
   * Switches modal tabs with smooth animation
   */
  function switchTab(tabId) {
    currentActiveTab = tabId;
    const tabBtns = modalEl.querySelectorAll('.importer-tab-btn');
    const tabContents = modalEl.querySelectorAll('.importer-tab-content');

    tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `tabContent${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
    });

    if (tabId === 'history') {
      loadHistoryList();
    } else if (tabId === 'settings') {
      updateSyncBar();
    }
  }

  /**
   * Updates sync status bar and settings badges
   */
  async function updateSyncBar() {
    const indicator = document.getElementById('importerSyncIndicator');
    const tokenInput = document.getElementById('importerGhTokenInput');
    const serverBadge = document.getElementById('settingsServerBadge');
    const tokenBadge = document.getElementById('settingsTokenBadge');

    const savedToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
    if (tokenInput && savedToken) {
      tokenInput.value = savedToken;
    }

    if (tokenBadge) {
      if (savedToken) {
        tokenBadge.textContent = 'Token Active ✓';
        tokenBadge.style.color = '#10b981';
        tokenBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      } else {
        tokenBadge.textContent = 'Not Configured';
        tokenBadge.style.color = 'var(--importer-text-muted)';
        tokenBadge.style.borderColor = 'var(--importer-border-subtle)';
      }
    }

    let isLocalServerOnline = false;

    // Check backend server status
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1400);

      const res = await fetch(`${API_BASE}/api/categories?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json().catch(() => null);
        if (data && data.success && Array.isArray(data.categories)) {
          isLocalServerOnline = true;
        }
      }
    } catch (e) {
      isLocalServerOnline = false;
    }

    if (serverBadge) {
      if (isLocalServerOnline) {
        serverBadge.textContent = 'Connected (Port 3000) ✓';
        serverBadge.style.color = '#10b981';
        serverBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
      } else {
        serverBadge.textContent = 'Offline';
        serverBadge.style.color = '#f59e0b';
        serverBadge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      }
    }

    if (!indicator) return;

    if (isLocalServerOnline) {
      indicator.innerHTML = `
        <span class="pulse-dot green"></span>
        <span>Local Backend Online (Auto Git Push <code>origin/main</code> Active)</span>
      `;
    } else if (savedToken) {
      indicator.innerHTML = `
        <span class="pulse-dot cyan"></span>
        <span>GitHub Direct Push Active (<code>alok706175/PlayX:main</code>)</span>
      `;
    } else {
      indicator.innerHTML = `
        <span class="pulse-dot amber"></span>
        <span>Offline Mode (Click ⚙️ Token to enable Direct GitHub Push)</span>
      `;
    }
  }

  /**
   * Fetches and renders recent imports history
   */
  async function loadHistoryList() {
    const container = document.getElementById('importerHistoryContainer');
    const badge = document.getElementById('historyCountBadge');
    if (!container) return;

    container.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--importer-text-muted);">
        <div class="spinner" style="margin: 0 auto 0.6rem;"></div>
        Refreshing history...
      </div>
    `;

    let historyList = [];

    // Try backend API first
    try {
      const res = await fetch(`${API_BASE}/api/recent-imports?_t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.history)) {
          historyList = data.history;
        }
      }
    } catch (e) {
      // Fallback: Try static auto_added_history.json
      try {
        const staticRes = await fetch(`backend/auto_added_history.json?_t=${Date.now()}`);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (Array.isArray(staticData)) historyList = staticData;
        }
      } catch (err) {}
    }

    if (badge) {
      badge.textContent = historyList.length;
    }

    if (!historyList || historyList.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem; color: var(--importer-text-muted); background: var(--importer-surface); border-radius: 12px; border: 1px dashed var(--importer-border-subtle);">
          <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🎶</div>
          <div style="font-weight: 700; color: var(--importer-text); margin-bottom: 0.3rem;">No Imported Songs Recorded Yet</div>
          <p style="font-size: 0.82rem; margin: 0;">Songs you import will automatically show up here with playback links and commit history.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = historyList.slice(0, 30).map(s => {
      const catObj = CATEGORY_OPTIONS.find(c => c.id === s.categoryKey || c.name === s.categoryName) || {
        name: s.categoryName || 'PlayX',
        icon: '🎵',
        page: 'home.html'
      };

      const dateStr = s.addedAt ? new Date(s.addedAt).toLocaleString(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Recently';

      const thumbUrl = s.thumbnail || (s.videoId ? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg` : 'images/playx_icon.png');
      const playUrl = `${catObj.page}?song=${encodeURIComponent(s.id || s.videoId || '')}`;

      return `
        <div class="history-item-card">
          <div class="history-left">
            <img src="${escapeHtml(thumbUrl)}" class="history-thumb" alt="${escapeHtml(s.name)}" loading="lazy" onerror="this.src='images/playx_icon.png'">
            <div class="history-info">
              <div class="history-title" title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</div>
              <div class="history-meta">
                <span>🎤 ${escapeHtml(s.singer || 'Artist')}</span>
                <span>•</span>
                <span>${catObj.icon} ${escapeHtml(catObj.name)}</span>
                <span>•</span>
                <span>🕒 ${dateStr}</span>
              </div>
            </div>
          </div>
          <div class="history-right">
            <a href="${playUrl}" class="history-play-btn" title="Open and listen in ${escapeHtml(catObj.name)}">
              <span>▶ Play</span>
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  function showBanner(type, message) {
    const banner = document.getElementById('importerBanner');
    if (!banner) return;
    banner.className = `importer-banner ${type}`;
    banner.style.display = 'flex';
    banner.innerHTML = `<span>${type === 'warning' ? '⚠️' : type === 'danger' ? '❌' : 'ℹ️'}</span> <span>${message}</span>`;
  }

  function hideBanner() {
    const banner = document.getElementById('importerBanner');
    if (banner) banner.style.display = 'none';
  }

  function setAnalyzeLoading(loading) {
    const btn = document.getElementById('importerAnalyzeBtn');
    const icon = document.getElementById('analyzeBtnIcon');
    const text = document.getElementById('analyzeBtnText');
    if (!btn) return;

    btn.disabled = loading;
    if (loading) {
      icon.innerHTML = `<div class="spinner"></div>`;
      text.textContent = 'Fetching Metadata...';
    } else {
      icon.innerHTML = `⚡`;
      text.textContent = 'Analyze Link';
    }
  }

  /**
   * Analyzes YouTube URL (via backend API or client-side fallback)
   */
  async function analyzeUrl(inputUrl) {
    hideBanner();
    setAnalyzeLoading(true);
    const container = document.getElementById('importerDynamicArea');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem 1rem; color: var(--importer-text-muted); background: var(--importer-surface); border-radius: 16px; border: 1px dashed var(--importer-border);">
          <div class="spinner" style="margin: 0 auto 0.8rem;"></div>
          <div>Analyzing YouTube link and detecting best playlist category...</div>
        </div>
      `;
    }

    try {
      let data = null;

      // 1. Try Backend API
      try {
        const res = await fetch(`${API_BASE}/api/parse-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: inputUrl })
        });
        if (res.ok) {
          data = await res.json();
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with status ${res.status}`);
        }
      } catch (backendErr) {
        console.warn('Backend link analysis note, using client-side fallback:', backendErr.message);

        // 2. Client-side Fallback
        if (window.PlayXUrlParser) {
          const parsed = window.PlayXUrlParser.parseYouTubeUrl(inputUrl);
          if (!parsed.isValid) throw new Error(parsed.error);

          // Client-side oEmbed call
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}&format=json`);
          if (!oembedRes.ok) throw new Error('Video not found on YouTube or embedding is disabled.');
          const oembedData = await oembedRes.json();

          // Client-side category detector
          let catSug = null;
          if (window.PlayXCategoryDetector) {
            catSug = window.PlayXCategoryDetector.detectCategory({
              title: oembedData.title,
              artist: oembedData.author_name
            });
          }

          data = {
            success: true,
            metadata: {
              videoId: parsed.videoId,
              platform: parsed.platform,
              originalUrl: parsed.originalUrl,
              canonicalUrl: parsed.canonicalUrl,
              embedUrl: parsed.embedUrl,
              cleanTitle: oembedData.title,
              rawTitle: oembedData.title,
              singer: oembedData.author_name,
              channelTitle: oembedData.author_name,
              duration: '--:--',
              thumbnail: oembedData.thumbnail_url || parsed.defaultThumbnail,
              embeddable: true,
              warnings: []
            },
            categorySuggestion: catSug,
            duplicateCheck: { exists: false }
          };
        } else {
          throw backendErr;
        }
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to process video link.');
      }

      activeAnalysis = data;
      renderPreview(data);
    } catch (err) {
      if (container) container.innerHTML = '';
      showBanner('danger', err.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }

  /**
   * Renders the interactive preview card with dual-column layout,
   * visual category selector, and clean title assistant.
   */
  function renderPreview(data) {
    const container = document.getElementById('importerDynamicArea');
    if (!container) return;

    const meta = data.metadata;
    const catSug = data.categorySuggestion || { suggestedCategory: 'hindi', confidence: 'medium', reason: 'Default category' };
    const dup = data.duplicateCheck || { exists: false };

    const suggestedCatId = catSug.suggestedCategory || 'hindi';
    const thumbUrl = meta.thumbnail || `https://i.ytimg.com/vi/${meta.videoId}/hqdefault.jpg`;
    const cleanedInitialTitle = cleanTitleString(meta.cleanTitle || meta.rawTitle);

    // Duplicate detection alert
    let duplicateHtml = '';
    if (dup.exists) {
      duplicateHtml = `
        <div class="importer-warning-box danger-dup">
          <div style="font-weight: 750; display: flex; align-items: center; gap: 0.4rem;">
            <span>⚠️ Duplicate Song Detected</span>
          </div>
          <div>This song already exists in <strong>${dup.categoryName || dup.foundInCategory}</strong> (${dup.foundInFile}). Adding it again is usually not needed unless you wish to duplicate it.</div>
        </div>
      `;
    }

    // Warnings from YouTube
    let warningHtml = '';
    if (meta.warnings && meta.warnings.length > 0) {
      warningHtml = `
        <div class="importer-warning-box">
          ${meta.warnings.map(w => `<div>${w}</div>`).join('')}
        </div>
      `;
    }

    // Interactive Visual Category Chips
    const categoryChipsHtml = CATEGORY_OPTIONS.map(c => {
      const isSuggested = c.id === suggestedCatId;
      return `
        <div class="category-card-chip ${isSuggested ? 'selected suggested' : ''}" data-cat-id="${c.id}" role="button" tabindex="0">
          <div class="cat-icon">${c.icon}</div>
          <div class="cat-name">${c.name}</div>
          <div class="cat-hindi">${c.hindi}</div>
        </div>
      `;
    }).join('');

    // Native select options for form parity
    const optionsHtml = CATEGORY_OPTIONS.map(c => `
      <option value="${c.id}" ${c.id === suggestedCatId ? 'selected' : ''}>
        ${c.icon} ${c.name} (${c.hindi})
      </option>
    `).join('');

    container.innerHTML = `
      <div class="importer-preview-card" id="importerPreviewCard">
        <!-- Top Badge Row -->
        <div class="preview-header-bar">
          <span class="platform-pill">
            <span>📺</span> <span>${meta.platform || 'YouTube'}</span>
          </span>
          <span class="category-suggested-pill" title="${escapeHtml(catSug.reason || '')}">
            <span>✨ Auto-Detected:</span>
            <span>${catSug.categoryDetails?.name || suggestedCatId} (${(catSug.confidence || 'HIGH').toUpperCase()})</span>
          </span>
        </div>

        ${duplicateHtml}
        ${warningHtml}

        <!-- Dual Column Grid -->
        <div class="preview-dual-grid">
          <!-- Left Column: Media Stage -->
          <div class="preview-media-stage">
            <div class="media-thumbnail-box" id="mediaThumbnailBox" title="Click to load live player">
              <img src="${escapeHtml(thumbUrl)}" class="media-thumbnail-img" alt="${escapeHtml(meta.cleanTitle)}" onerror="this.src='https://i.ytimg.com/vi/${meta.videoId}/hqdefault.jpg'">
              <div class="media-play-overlay">
                <div class="play-circle-icon">▶</div>
              </div>
              <span class="media-duration-tag">⏱️ ${meta.duration || '03:45'}</span>
            </div>

            <!-- Embedded Player (Hidden until requested) -->
            <div class="preview-embed-frame" id="previewEmbedFrame">
              <iframe
                id="previewPlayerIframe"
                src=""
                data-src="${meta.embedUrl}?enablejsapi=1&autoplay=1&origin=${encodeURIComponent(window.location.origin)}"
                title="${escapeHtml(meta.cleanTitle)}"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
              </iframe>
            </div>

            <button type="button" class="btn-toggle-player" id="btnToggleLivePlayer">
              <span>▶</span> <span>Test Play Live Stream</span>
            </button>

            <!-- Metadata info chips -->
            <div class="meta-chips-row">
              <div class="meta-chip"><span>ID:</span> <strong>${meta.videoId}</strong></div>
              <div class="meta-chip"><span>HD:</span> <strong>320 Kbps</strong></div>
              <div class="meta-chip"><span>Channel:</span> <strong>${escapeHtml(meta.channelTitle || meta.singer || 'Artist')}</strong></div>
            </div>
          </div>

          <!-- Right Column: Metadata Form & Category Selector -->
          <div class="preview-details-stage">
            <!-- Visual Category Picker -->
            <div class="category-picker-section">
              <div class="category-picker-label">
                <span>🎯 Select Playlist Category</span>
                <span style="font-weight: normal; font-size: 0.74rem;">(Click to change)</span>
              </div>
              <div class="category-cards-grid" id="categoryCardsGrid">
                ${categoryChipsHtml}
              </div>
              <!-- Hidden select for form value binding -->
              <select id="selectSongCategory" class="category-select-fallback">
                ${optionsHtml}
              </select>
            </div>

            <!-- Editable Fields -->
            <div class="preview-form-grid">
              <div class="form-field full-width">
                <div class="form-field-header">
                  <label for="editSongTitle">Song Title</label>
                  <button type="button" class="btn-clean-title" id="btnCleanTitle" title="Strip YouTube video noise & boilerplate">
                    <span>✨ Clean Title</span>
                  </button>
                </div>
                <input type="text" id="editSongTitle" value="${escapeHtml(cleanedInitialTitle)}" required>
              </div>

              <div class="form-field">
                <label for="editSongSinger">Singer / Artist / Channel</label>
                <input type="text" id="editSongSinger" value="${escapeHtml(meta.singer || meta.channelTitle || 'Artist')}" required>
              </div>

              <div class="form-field">
                <label for="editSongTag">Tag / Mood</label>
                <input type="text" id="editSongTag" value="${escapeHtml(catSug.categoryDetails?.defaultTag || 'Special')}">
              </div>

              <div class="form-field">
                <label for="editSongDuration">Duration</label>
                <input type="text" id="editSongDuration" value="${escapeHtml(meta.duration && meta.duration !== '--:--' ? meta.duration : '03:45')}">
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="importer-actions">
          <button type="button" class="btn-secondary" id="importerCancelBtn">Cancel</button>
          <button type="button" class="btn-approve" id="importerApproveBtn" ${dup.exists ? 'style="background: linear-gradient(135deg, #f59e0b, #d97706);"' : ''}>
            <span>${dup.exists ? '⚠️ Import Duplicate Anyway' : '✅ Approve & Add to Playlist'}</span>
          </button>
        </div>
      </div>
    `;

    // Interactive Category Card Selection
    const catChips = container.querySelectorAll('.category-card-chip');
    const catSelect = document.getElementById('selectSongCategory');

    catChips.forEach(chip => {
      chip.addEventListener('click', () => {
        catChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        const selectedId = chip.getAttribute('data-cat-id');
        if (catSelect) catSelect.value = selectedId;
      });
    });

    // Clean Title Assistant
    const titleInput = document.getElementById('editSongTitle');
    const cleanBtn = document.getElementById('btnCleanTitle');
    if (cleanBtn && titleInput) {
      let originalRaw = meta.cleanTitle || meta.rawTitle;
      cleanBtn.addEventListener('click', () => {
        const cleaned = cleanTitleString(titleInput.value || originalRaw);
        titleInput.value = cleaned;
        showBanner('info', '✨ Cleaned YouTube title tags!');
      });
    }

    // Toggle Live Player Iframe
    const thumbBox = document.getElementById('mediaThumbnailBox');
    const embedFrame = document.getElementById('previewEmbedFrame');
    const toggleBtn = document.getElementById('btnToggleLivePlayer');
    const iframe = document.getElementById('previewPlayerIframe');

    const activatePlayer = () => {
      if (thumbBox && embedFrame && iframe) {
        thumbBox.style.display = 'none';
        embedFrame.classList.add('active');
        if (!iframe.src && iframe.getAttribute('data-src')) {
          iframe.src = iframe.getAttribute('data-src');
        }
        if (toggleBtn) {
          toggleBtn.innerHTML = `<span>⏹</span> <span>Close Live Player</span>`;
          toggleBtn.onclick = deactivatePlayer;
        }
      }
    };

    const deactivatePlayer = () => {
      if (thumbBox && embedFrame && iframe) {
        embedFrame.classList.remove('active');
        thumbBox.style.display = 'block';
        iframe.src = '';
        if (toggleBtn) {
          toggleBtn.innerHTML = `<span>▶</span> <span>Test Play Live Stream</span>`;
          toggleBtn.onclick = activatePlayer;
        }
      }
    };

    if (thumbBox) thumbBox.addEventListener('click', activatePlayer);
    if (toggleBtn) toggleBtn.addEventListener('click', activatePlayer);

    // Cancel Button
    document.getElementById('importerCancelBtn').addEventListener('click', () => {
      container.innerHTML = '';
      activeAnalysis = null;
      hideBanner();
    });

    // Approve Button
    document.getElementById('importerApproveBtn').addEventListener('click', () => {
      approveAndSaveSong();
    });
  }

  /**
   * Approves and saves the song to JSON databases and synchronizes bundles
   */
  async function approveAndSaveSong() {
    if (!activeAnalysis || isSubmitting) return;

    // Admin authentication verification
    const isAdmin = localStorage.getItem('playx_admin_logged_in') === 'true';
    if (!isAdmin) {
      alert('🔒 Admin Login Required!\nPlease log in to the admin portal before adding songs.');
      if (window.openAdminModal) {
        closeModal();
        window.openAdminModal();
      }
      return;
    }

    const title = (document.getElementById('editSongTitle')?.value || '').trim();
    const singer = (document.getElementById('editSongSinger')?.value || '').trim();
    const category = document.getElementById('selectSongCategory')?.value || 'hindi';
    const tag = (document.getElementById('editSongTag')?.value || '').trim();
    const duration = (document.getElementById('editSongDuration')?.value || '').trim();

    if (!title || !singer) {
      alert('Please enter both song title and artist/channel name.');
      return;
    }

    const adminToken = localStorage.getItem('playx_admin_token') || sessionStorage.getItem('playx_admin_secret') || '';
    const isLoggedIn = localStorage.getItem('playx_admin_logged_in') === 'true';

    if (!isLoggedIn && !adminToken) {
      alert('🔒 Admin Authorization: Only verified administrators can save songs. Please log in first.');
      if (window.openAdminModal) window.openAdminModal();
      return;
    }

    const approveBtn = document.getElementById('importerApproveBtn');
    if (approveBtn) {
      approveBtn.disabled = true;
      approveBtn.innerHTML = `<div class="spinner"></div> <span>Saving & Syncing...</span>`;
    }
    isSubmitting = true;

    const payload = {
      adminSecret: adminToken,
      category: category,
      allowDuplicate: Boolean(activeAnalysis.duplicateCheck?.exists),
      songData: {
        videoId: activeAnalysis.metadata.videoId,
        title: title,
        cleanTitle: title,
        singer: singer,
        tag: tag,
        duration: duration,
        thumbnail: activeAnalysis.metadata.thumbnail,
        originalUrl: activeAnalysis.metadata.originalUrl,
        embedUrl: activeAnalysis.metadata.embedUrl,
        category: category
      }
    };

    try {
      let savedData = null;
      let backendError = null;

      // 1. Try Local Backend Server (which commits & pushes automatically via Git CLI)
      try {
        const reqHeaders = { 'Content-Type': 'application/json' };
        if (adminToken) {
          reqHeaders['Authorization'] = `Bearer ${adminToken}`;
          reqHeaders['x-admin-secret'] = adminToken;
        }

        const res = await fetch(`${API_BASE}/api/import-song`, {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          savedData = await res.json();
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with status ${res.status}`);
        }
      } catch (err) {
        backendError = err;
        console.warn('Local backend import note, attempting GitHub direct commit:', err.message);
      }

      // 2. Direct GitHub REST API Commit Fallback
      if (!savedData) {
        const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token');
        if (ghToken) {
          try {
            if (approveBtn) {
              approveBtn.innerHTML = `<div class="spinner"></div> <span>Pushing to GitHub origin/main...</span>`;
            }
            savedData = await saveSongDirectlyToGitHub(category, payload.songData, ghToken);
          } catch (ghErr) {
            throw new Error(`GitHub Direct Push Error: ${ghErr.message}`);
          }
        } else {
          throw new Error(
            `Unable to connect to backend server (${backendError ? backendError.message : 'Server offline'}).\n\n` +
            `To enable automatic GitHub pushes:\n` +
            `1. Start local server: node "backend/server.js"\n` +
            `2. Or open '⚙️ Sync Engine & Token' tab and save your PLAYX_TOKEN.`
          );
        }
      }

      renderSuccess(savedData);
    } catch (err) {
      alert(`Error saving song:\n${err.message}`);
      if (approveBtn) {
        approveBtn.disabled = false;
        approveBtn.innerHTML = `<span>Approve & Add to Playlist</span>`;
      }
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * Commits new song directly to GitHub repository via GitHub REST API
   * with UTF-8 safe TextEncoder/TextDecoder and Hindi bundle auto-sync.
   */
  async function saveSongDirectlyToGitHub(categoryKey, songData, githubToken) {
    const catObj = CATEGORY_OPTIONS.find(c => c.id === categoryKey);
    if (!catObj) throw new Error(`Invalid category: ${categoryKey}`);

    const repo = 'alok706175/PlayX';
    const branch = 'main';
    const filePath = catObj.file;
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&_nocache=${Date.now()}`;

    // Multi-byte UTF-8 Base64 Helpers
    function decodeUtf8Base64(b64) {
      const cleanB64 = (b64 || '').replace(/\s/g, '');
      const bin = atob(cleanB64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    }

    function encodeUtf8Base64(str) {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) {
        bin += String.fromCharCode(bytes[i]);
      }
      return btoa(bin);
    }

    // 1. Fetch current file content with cache-busting
    const getRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!getRes.ok) {
      if (getRes.status === 401 || getRes.status === 403) {
        throw new Error('Invalid GitHub Token! Please provide a valid token with repo scope.');
      }
      throw new Error(`GitHub file fetch failed (${getRes.status})`);
    }

    const fileMeta = await getRes.json();
    let currentSongs = [];
    try {
      const decodedStr = decodeUtf8Base64(fileMeta.content);
      currentSongs = JSON.parse(decodedStr);
      if (!Array.isArray(currentSongs)) {
        throw new Error('Playlist in repository is not an array.');
      }
    } catch (parseErr) {
      throw new Error(`Failed to parse existing songs from repository (${filePath}): ${parseErr.message}. Aborting commit to prevent data loss!`);
    }

    // 2. Format record
    let maxId = 0;
    currentSongs.forEach(s => {
      const nid = parseInt(s.id, 10);
      if (!isNaN(nid) && nid > maxId) maxId = nid;
    });

    const nowIso = new Date().toISOString();
    const newRecord = {
      id: maxId + 1,
      name: songData.title || songData.cleanTitle || 'Untitled Song',
      nameEn: songData.titleEn || songData.title || 'Untitled Song',
      singer: songData.singer || 'Artist',
      singerEn: songData.singerEn || songData.singer || 'Artist',
      category: categoryKey === 'hindi' ? (songData.subCategory || 'Romantic') : catObj.name,
      tag: songData.tag || 'New Song',
      videoId: songData.videoId,
      youtubeId: songData.videoId,
      embedUrl: songData.embedUrl || `https://www.youtube.com/embed/${songData.videoId}`,
      originalUrl: songData.originalUrl || `https://www.youtube.com/watch?v=${songData.videoId}`,
      duration: songData.duration || '03:45',
      thumbnail: songData.thumbnail || `https://i.ytimg.com/vi/${songData.videoId}/hqdefault.jpg`,
      addedAt: nowIso,
      status: 'approved',
      source: 'youtube'
    };

    currentSongs.push(newRecord);

    // 3. UTF-8 safe base64 encode
    const updatedJsonStr = JSON.stringify(currentSongs, null, 2) + '\n';
    const encodedContent = encodeUtf8Base64(updatedJsonStr);
    const commitMsg = `Add '${newRecord.name.replace(/['"]/g, '')}' to ${catObj.name} playlist [PlayX Auto-Import]`;

    // 4. PUT commit to GitHub
    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify({
        message: commitMsg,
        content: encodedContent,
        sha: fileMeta.sha,
        branch: branch
      })
    });

    if (!putRes.ok) {
      const putErr = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub Commit Error (${putRes.status}): ${putErr.message || 'Unknown error'}`);
    }

    const putData = await putRes.json();

    // 5. If Hindi songs, keep preloaded bundle hindi_songs_data.js in sync on GitHub
    if (categoryKey === 'hindi') {
      try {
        const bundlePath = 'hindi-songs/hindi_songs_data.js';
        const bundleGetRes = await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}?ref=${branch}&_nocache=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Cache-Control': 'no-cache'
          }
        });
        let bundleSha = null;
        if (bundleGetRes.ok) {
          const bundleMeta = await bundleGetRes.json();
          bundleSha = bundleMeta.sha;
        }
        const bundleStr = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(currentSongs, null, 2) + ';\n';
        await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            message: `Sync hindi_songs_data.js bundle with new song '${newRecord.name.replace(/['"]/g, '')}'`,
            content: encodeUtf8Base64(bundleStr),
            sha: bundleSha,
            branch: branch
          })
        });
      } catch (bundleErr) {
        console.warn('Direct GitHub bundle sync warning:', bundleErr.message);
      }
    }

    return {
      success: true,
      song: newRecord,
      targetFile: catObj.file,
      categoryName: catObj.name,
      pageUrl: catObj.page,
      totalSongs: currentSongs.length,
      githubSync: {
        success: true,
        committed: true,
        method: 'github-api-browser',
        repo: repo,
        branch: branch,
        commitMessage: commitMsg,
        url: putData.commit?.html_url,
        message: 'Code and playlist committed directly to GitHub repository (origin/main) via GitHub API!'
      }
    };
  }

  /**
   * Displays the final success card with playback and direct links
   */
  function renderSuccess(savedData) {
    const container = document.getElementById('importerDynamicArea');
    if (!container) return;

    const s = savedData.song || {};
    const pageUrl = savedData.pageUrl || 'home.html';
    const catName = savedData.categoryName || 'PlayX';
    const thumbUrl = s.thumbnail || (s.videoId ? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg` : 'images/playx_icon.png');
    const playNowUrl = `${pageUrl}?song=${encodeURIComponent(s.id || s.videoId || '')}`;

    container.innerHTML = `
      <div class="importer-success-card">
        <div class="success-icon-badge">🎉</div>
        <h3 style="margin: 0; font-size: 1.45rem; color: #10b981; font-weight: 800;">Song Successfully Imported!</h3>
        
        <div style="display: flex; align-items: center; gap: 0.85rem; background: var(--importer-surface); border: 1px solid var(--importer-border); padding: 0.85rem 1.25rem; border-radius: 14px; max-width: 520px; text-align: left;">
          <img src="${escapeHtml(thumbUrl)}" style="width: 64px; height: 48px; border-radius: 8px; object-fit: cover; background: #000;" onerror="this.src='images/playx_icon.png'">
          <div>
            <div style="font-weight: 750; color: var(--importer-text); font-size: 0.95rem;">${escapeHtml(s.name)}</div>
            <div style="font-size: 0.8rem; color: var(--importer-text-muted);">🎤 ${escapeHtml(s.singer)} • 📁 ${catName} #${s.id || savedData.totalSongs || ''}</div>
          </div>
        </div>

        ${savedData.githubSync?.committed ? `
          <div style="font-size: 0.86rem; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 0.65rem 1rem; border-radius: 10px; max-width: 520px; display: flex; align-items: center; gap: 0.6rem; text-align: left;">
            <span style="font-size: 1.25rem;">🚀</span>
            <div>
              <strong>GitHub Auto-Push Complete:</strong> ${savedData.githubSync.message}
              ${savedData.githubSync.url ? `<br><a href="${savedData.githubSync.url}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 600;">View Commit on GitHub</a>` : ''}
            </div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.85rem; flex-wrap: wrap; justify-content: center; margin-top: 0.6rem;">
          <a href="${playNowUrl}" class="success-link-btn">
            <span>▶️</span> <span>Play "${escapeHtml(s.name.slice(0, 24))}" Now</span>
          </a>
          <button type="button" class="btn-secondary" id="importAnotherBtn">
            <span>+ Import Another Song</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('importAnotherBtn').addEventListener('click', () => {
      document.getElementById('importerUrlInput').value = '';
      const clearBtn = document.getElementById('importerClearInputBtn');
      if (clearBtn) clearBtn.style.display = 'none';
      container.innerHTML = '';
      activeAnalysis = null;
      hideBanner();
    });
  }

  function openModal(prefillUrl = '') {
    initImporterUI();
    if (modalEl) {
      modalEl.classList.add('active');
      document.body.style.overflow = 'hidden';

      updateSyncBar();

      const input = document.getElementById('importerUrlInput');
      const clearBtn = document.getElementById('importerClearInputBtn');
      if (input) {
        if (prefillUrl) {
          input.value = prefillUrl;
          if (clearBtn) clearBtn.style.display = 'flex';
          analyzeUrl(prefillUrl);
        } else {
          input.focus();
        }
      }
    }
  }

  function closeModal() {
    if (modalEl) {
      modalEl.classList.remove('active');
      document.body.style.overflow = '';
      const iframe = document.getElementById('previewPlayerIframe');
      if (iframe) iframe.src = '';
    }
  }

  function checkShareTargetOnLoad() {
    const params = new URLSearchParams(window.location.search);
    const sharedUrl = params.get('share_url') || params.get('url') || params.get('text');
    if (sharedUrl) {
      let cleanUrl = sharedUrl;
      if (window.PlayXUrlParser) {
        cleanUrl = window.PlayXUrlParser.extractUrlFromText(sharedUrl);
      }
      setTimeout(() => {
        openModal(cleanUrl);
        showBanner('info', '📱 Link received via Mobile Share Target! Verifying metadata...');
      }, 350);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initImporterUI();
    checkShareTargetOnLoad();
  });

  // Expose API on window
  window.PlayXSongImporter = {
    openModal,
    closeModal,
    analyzeUrl,
    cleanTitleString
  };
})();
