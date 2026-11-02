/**
 * PlayX Auto Added Songs - Admin Song Importer Controller (v2.5 Ultra-Modern)
 * 
 * Provides an ultra-modern administrative modal for analyzing YouTube / YouTube Music links,
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
    // Remove common bracketed video noise
    cleaned = cleaned.replace(/\s*[([{\-—]\s*(official\s*(music\s*)?(video|audio|lyric(s)?|track|hd|4k|remastered|full\s*song|version|promo)?|4k\s*ultra\s*hd|1080p|hd|audio\s*song|video\s*song|exclusive|full\s*video|lyrical\s*video|new\s*song\s*\d{4})\s*[)\]}]\s*/gi, ' ');
    // Remove trailing studio or channel watermarks
    cleaned = cleaned.replace(/\s*\|\s*(t-series|zee\s*music\s*company|sony\s*music\s*india|tips\s*official|yrf|speed\s*records|white\s*hill\s*music|wave\s*music|worldwide\s*records).*/gi, '');
    // Clean orphan pipes or hyphens at ends
    cleaned = cleaned.replace(/[\s|—\-]+$/, '');
    cleaned = cleaned.replace(/^[\s|—\-]+/, '');
    // Condense double spaces
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    return cleaned || title;
  }

  /**
   * Builds and injects the modal DOM structure into the page
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
            <div class="importer-header-text">
              <h2 id="importerModalTitle">
                <span>PlayX Song Importer</span>
              </h2>
            </div>
          </div>
          <div class="importer-header-actions">
            <button class="importer-close-btn" id="importerCloseBtn" type="button" title="Close Importer (Esc)" aria-label="Close">✕</button>
          </div>
        </div>

        <!-- Body Container -->
        <div class="importer-body" id="importerBody">
          <!-- Notification / Share Banner -->
          <div id="importerBanner" style="display: none;"></div>

          <!-- Live Sync Status Bar Capsule -->
          <div class="importer-sync-bar" id="importerSyncBar">
            <div class="importer-sync-indicator" id="importerSyncIndicator">
              <span class="pulse-dot amber"></span>
              <span>Checking Sync Engine...</span>
            </div>
            <div class="importer-sync-actions">
              <button type="button" id="importerGhTokenBtn" class="importer-mini-btn" title="GitHub Direct Push Settings">
                <span>⚙️ GitHub Token</span>
              </button>
            </div>
          </div>

          <!-- Collapsible GitHub Token Drawer -->
          <div id="importerGhTokenDrawer" class="importer-token-drawer" style="display: none;">
            <div class="token-drawer-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span>🐙</span> <span>GitHub Direct Push Settings (PLAYX_TOKEN)</span>
              </div>
              <button type="button" id="importerCloseTokenDrawerBtn" class="btn-clear-search" style="display:flex;">✕</button>
            </div>
            <p class="token-drawer-desc">
              Browser security restricts reading private repository secrets directly. Save your GitHub Personal Access Token (PAT) with <code>repo</code> scope below to commit songs directly to <b>alok706175/PlayX:main</b>.
            </p>
            <div class="token-input-row">
              <div class="token-input-wrap">
                <input type="password" id="importerGhTokenInput" placeholder="Enter PLAYX_TOKEN (ghp_...)" class="token-input">
                <button type="button" class="token-eye-btn" id="importerToggleTokenVis" title="Toggle visibility">👁️</button>
              </div>
              <button type="button" id="importerSaveTokenBtn" class="importer-mini-btn primary">Save Token</button>
              <button type="button" id="importerClearTokenBtn" class="importer-mini-btn danger">Clear</button>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.2rem;">
              <a href="https://github.com/settings/tokens/new?scopes=repo&description=PlayX-Song-Importer" target="_blank" rel="noopener noreferrer" class="importer-mini-btn" style="text-decoration:none;">
                🔑 Generate PAT (repo scope)
              </a>
              <a href="https://github.com/alok706175/PlayX/actions/workflows/auto-add-song.yml" target="_blank" rel="noopener noreferrer" class="importer-mini-btn" style="text-decoration:none;">
                ⚡ GitHub Actions Workflow
              </a>
            </div>
          </div>

          <!-- Navigation Tabs: Import Songs vs Delete / Manage Songs -->
          <div class="importer-tabs-bar" id="importerTabsBar">
            <button type="button" class="importer-tab-btn active" id="tabImportModeBtn">
              <span>➕</span> <span>Import New Song</span>
            </button>
            <button type="button" class="importer-tab-btn danger-tab" id="tabDeleteModeBtn">
              <span>🗑️</span> <span>Delete / Manage Songs</span>
            </button>
          </div>

          <!-- Section 1: Add / Import Song -->
          <div id="importerAddSection">
            <!-- Unified Search & URL Input Box -->
            <div class="importer-input-card">
              <div class="importer-input-card-header">
                <label for="importerUrlInput" class="importer-input-label">
                  <span>Paste YouTube or YouTube Music Link</span>
                </label>
              </div>

              <!-- Master Search Bar -->
              <div class="importer-search-bar">
                <span class="search-bar-icon-lead">▶</span>
                <input type="text" id="importerUrlInput" class="importer-url-input"
                  placeholder="Paste youtube or Youtube Music link" autocomplete="off" spellcheck="false">
                <button type="button" class="btn-clear-search" id="importerClearInputBtn" title="Clear input">✕</button>
                <button type="button" class="btn-paste-chip" id="importerPasteBtn" title="Paste from clipboard">
                  <span>📋</span> <span>Paste</span>
                </button>
                <button type="button" class="btn-analyze-primary" id="importerAnalyzeBtn">
                  <span id="analyzeBtnIcon">⚡</span>
                  <span id="analyzeBtnText">Analyze Link</span>
                </button>
              </div>
            </div>

            <!-- Dynamic Container for Welcome Showcase OR Interactive Preview Card -->
            <div id="importerDynamicArea"></div>
          </div>

          <!-- Section 2: Delete / Manage Songs -->
          <div id="importerDeleteSection" class="importer-delete-section" style="display: none;">
            <div class="delete-category-pills" id="deleteCategoryPills"></div>
            <div class="delete-search-bar">
              <span style="font-size: 1.1rem; color: #94a3b8;">🔍</span>
              <input type="text" id="deleteSongSearchInput" class="delete-search-input" placeholder="Search songs in this category to delete...">
              <span id="deleteSongCountBadge" class="delete-count-badge">0 songs</span>
            </div>
            <div class="delete-songs-list" id="deleteSongsList">
              <div class="delete-empty-state">
                <span>⏳</span>
                <span>Select a category above to view and delete songs.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    modalEl = overlay;

    // Attach listeners
    attachModalListeners();

    // Render default welcome hero showcase
    renderWelcomeShowcase();
  }

  /**
   * Renders the welcome hero section when no link is currently being analyzed
   */
  function renderWelcomeShowcase() {
    const container = document.getElementById('importerDynamicArea');
    if (container && !activeAnalysis) {
      container.innerHTML = '';
    }
  }

  function attachModalListeners() {

    // Mode Switcher Tabs (Import vs Delete)
    const tabImportBtn = document.getElementById('tabImportModeBtn');
    const tabDeleteBtn = document.getElementById('tabDeleteModeBtn');
    if (tabImportBtn) tabImportBtn.addEventListener('click', () => switchTab('import'));
    if (tabDeleteBtn) tabDeleteBtn.addEventListener('click', () => switchTab('delete'));

    // Delete Song Search Filter Listener
    const deleteSearchInput = document.getElementById('deleteSongSearchInput');
    if (deleteSearchInput) {
      deleteSearchInput.addEventListener('input', (e) => {
        renderDeleteSongsList(e.target.value);
      });
    }

    // Close modal
    document.getElementById('importerCloseBtn').addEventListener('click', closeModal);
    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl) closeModal();
    });

    // Token Drawer Toggle
    const tokenBtn = document.getElementById('importerGhTokenBtn');
    const drawer = document.getElementById('importerGhTokenDrawer');
    const closeDrawerBtn = document.getElementById('importerCloseTokenDrawerBtn');

    if (tokenBtn && drawer) {
      tokenBtn.addEventListener('click', () => {
        drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
      });
    }
    if (closeDrawerBtn && drawer) {
      closeDrawerBtn.addEventListener('click', () => {
        drawer.style.display = 'none';
      });
    }

    // Save Token
    const saveTokenBtn = document.getElementById('importerSaveTokenBtn');
    if (saveTokenBtn) {
      saveTokenBtn.addEventListener('click', () => {
        const val = (document.getElementById('importerGhTokenInput')?.value || '').trim();
        if (val) {
          localStorage.setItem('playx_token', val);
          localStorage.setItem('playx_github_token', val);
          showBanner('info', '✅ PLAYX_TOKEN saved successfully in browser!');
          if (drawer) drawer.style.display = 'none';
          updateSyncBar();
        } else {
          showBanner('warning', 'Please enter a valid GitHub Personal Access Token (starts with ghp_ or github_pat_).');
        }
      });
    }

    // Clear Token
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

    // Token visibility eye toggle
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

    // URL Input clear button
    const urlInput = document.getElementById('importerUrlInput');
    const clearBtn = document.getElementById('importerClearInputBtn');
    if (urlInput && clearBtn) {
      urlInput.addEventListener('input', () => {
        clearBtn.style.display = urlInput.value.trim() ? 'flex' : 'none';
      });
      clearBtn.addEventListener('click', () => {
        urlInput.value = '';
        clearBtn.style.display = 'none';
        urlInput.focus();
        if (activeAnalysis) {
          activeAnalysis = null;
          renderWelcomeShowcase();
        }
      });
    }

    // Paste from clipboard
    const pasteBtn = document.getElementById('importerPasteBtn');
    if (pasteBtn && urlInput) {
      pasteBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            if (text) {
              urlInput.value = text.trim();
              if (clearBtn) clearBtn.style.display = 'flex';
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
    if (analyzeBtn && urlInput) {
      analyzeBtn.addEventListener('click', () => {
        const val = urlInput.value.trim();
        if (!val) {
          showBanner('warning', 'Please paste a valid YouTube or YouTube Music link.');
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
   * Updates sync status bar indicator
   */
  async function updateSyncBar() {
    const indicator = document.getElementById('importerSyncIndicator');
    const tokenInput = document.getElementById('importerGhTokenInput');
    const savedToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
    if (tokenInput && savedToken) {
      tokenInput.value = savedToken;
    }

    if (!indicator) return;

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

    if (isLocalServerOnline || savedToken) {
      indicator.innerHTML = `
        <span class="pulse-dot green"></span>
        <span style="color:#10b981;font-weight:700;">Server is live</span>
      `;
    } else {
      indicator.innerHTML = `
        <span class="pulse-dot amber"></span>
        <span style="color:#f59e0b;font-weight:700;">Server Offline & No GitHub Token</span>
        <span style="color:var(--importer-text-muted);">(Click ⚙️ to configure)</span>
      `;
    }
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
      text.textContent = 'Fetching...';
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
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--importer-text-muted); background: var(--importer-surface); border-radius: 18px; border: 1.5px dashed var(--importer-border);">
          <div class="spinner" style="margin: 0 auto 0.9rem;"></div>
          <div style="font-weight: 700; color: var(--importer-text); margin-bottom: 0.3rem;">Analyzing YouTube Link...</div>
          <div style="font-size: 0.82rem;">Fetching high-resolution artwork, video metadata & matching optimal playlist category</div>
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
      renderWelcomeShowcase();
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
            <span>⚠️ Duplicate Song Detected!</span>
          </div>
          <div>This song already exists in the "<strong>${dup.categoryName || dup.foundInCategory}</strong>" playlist (${dup.foundInFile}). Adding it again is not recommended.</div>
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

    // Interactive Visual Category Chips (8 categories)
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

    // Native select options for form binding
    const optionsHtml = CATEGORY_OPTIONS.map(c => `
      <option value="${c.id}" ${c.id === suggestedCatId ? 'selected' : ''}>
        ${c.icon} ${c.name} (${c.hindi})
      </option>
    `).join('');

    container.innerHTML = `
      <div class="importer-preview-card" id="importerPreviewCard">
        <!-- Top Badge Row -->
        <div class="preview-top-badges">
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
            <div class="media-thumbnail-box" id="mediaThumbnailBox" title="Click to test play video stream">
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
              <select id="selectSongCategory" style="display:none;">
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

              <div class="form-field">
                <label>Video ID</label>
                <input type="text" value="${escapeHtml(meta.videoId)}" readonly style="opacity:0.75;font-family:monospace;">
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
        showBanner('info', '✨ Cleaned video title boilerplate!');
      });
    }

    // Toggle Live Player
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
      activeAnalysis = null;
      hideBanner();
      renderWelcomeShowcase();
    });

    // Approve Button
    document.getElementById('importerApproveBtn').addEventListener('click', () => {
      approveAndSaveSong();
    });
  }

  /**
   * Approves and saves the song to JSON database and auto-syncs dataset bundle
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
            throw ghErr;
          }
        } else {
          throw new Error(
            `Unable to connect to backend server (${backendError ? backendError.message : 'Server offline'}).\n\n` +
            `To enable automatic GitHub pushes:\n` +
            `1. Start local server: node "backend/server.js"\n` +
            `2. Or click '⚙️ GitHub Token' and save your PLAYX_TOKEN.`
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

  async function saveSongDirectlyToGitHub(categoryKey, songData, githubToken) {
    const catObj = CATEGORY_OPTIONS.find(c => c.id === categoryKey);
    if (!catObj) throw new Error(`Invalid category: ${categoryKey}`);

    const repo = 'alok706175/PlayX';
    const branch = 'main';
    const filePath = catObj.file;
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&_nocache=${Date.now()}`;

    const cleanToken = (githubToken || '').trim().replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '');
    if (!cleanToken) {
      throw new Error('GitHub Token is missing. Click "⚙️ GitHub Token" and save your Personal Access Token.');
    }
    const authHeader = cleanToken.startsWith('github_pat_') ? `Bearer ${cleanToken}` : `token ${cleanToken}`;

    // 1. Fetch current file content with cache-busting (CORS-safe: only Authorization header)
    let getRes;
    try {
      getRes = await fetch(url, {
        headers: {
          'Authorization': authHeader
        }
      });
    } catch (netErr) {
      // Fallback: If Authorization header triggers unexpected CORS issue on GET, try public fetch
      try {
        getRes = await fetch(url);
      } catch (fallbackErr) {
        throw new Error(`Failed to reach GitHub API (${netErr.message}). Check your internet connection or verify api.github.com is not blocked.`);
      }
    }

    if (!getRes.ok) {
      if (getRes.status === 401) {
        throw new Error('Invalid or expired GitHub Token (401 Bad Credentials)! Click "⚙️ GitHub Token" to update your token.');
      }
      if (getRes.status === 403) {
        throw new Error('GitHub Token Permission Denied (403)! Ensure your token has "repo" (Contents: Read and Write) permissions.');
      }
      if (getRes.status === 404) {
        throw new Error(`Playlist file not found in repository (${filePath}) on branch '${branch}'.`);
      }
      throw new Error(`GitHub file fetch failed (${getRes.status}): ${getRes.statusText}`);
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

    // 4. PUT commit to GitHub (CORS-safe: only Authorization & Content-Type)
    let putRes;
    try {
      putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMsg,
          content: encodedContent,
          sha: fileMeta.sha,
          branch: branch
        })
      });
    } catch (putNetErr) {
      throw new Error(`Network error while pushing commit to GitHub (${putNetErr.message}). Check your connection.`);
    }

    if (!putRes.ok) {
      if (putRes.status === 401) {
        throw new Error('Invalid GitHub Token (401 Bad Credentials)! Please verify or regenerate your GitHub Personal Access Token.');
      }
      if (putRes.status === 403) {
        throw new Error('GitHub Permission Denied (403)! Ensure your Personal Access Token has "repo" (Contents: Read & Write) permissions for alok706175/PlayX.');
      }
      if (putRes.status === 404) {
        throw new Error(`Target file or repository not found (404): ${repo}/${filePath}`);
      }
      if (putRes.status === 409) {
        throw new Error('GitHub Commit Conflict (409): The playlist was recently modified on GitHub. Please click "Approve" again to re-sync.');
      }
      const putErrJson = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub Commit Error (${putRes.status}): ${putErrJson.message || putRes.statusText || 'Commit rejected by GitHub'}`);
    }

    const putData = await putRes.json();

    // 5. If Hindi songs, keep preloaded bundle hindi_songs_data.js in sync on GitHub
    if (categoryKey === 'hindi') {
      try {
        const bundlePath = 'hindi-songs/hindi_songs_data.js';
        let bundleSha = null;
        try {
          const bundleGetRes = await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}?ref=${branch}&_nocache=${Date.now()}`, {
            headers: {
              'Authorization': authHeader
            }
          });
          if (bundleGetRes.ok) {
            const bundleMeta = await bundleGetRes.json();
            bundleSha = bundleMeta.sha;
          }
        } catch (e) {}

        const bundleStr = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(currentSongs, null, 2) + ';\n';
        await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
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
  
  // ==========================================================================
  // Admin Song Deletion & Management Engine
  // ==========================================================================
  let activeTabMode = 'import'; // 'import' or 'delete'
  let activeDeleteCategory = 'bhojpuri';
  let cachedDeleteSongs = [];

  function switchTab(mode) {
    activeTabMode = mode;
    const addSection = document.getElementById('importerAddSection');
    const deleteSection = document.getElementById('importerDeleteSection');
    const tabImportBtn = document.getElementById('tabImportModeBtn');
    const tabDeleteBtn = document.getElementById('tabDeleteModeBtn');
    const modalTitle = document.getElementById('importerModalTitle');

    if (mode === 'delete') {
      if (addSection) addSection.style.display = 'none';
      if (deleteSection) deleteSection.style.display = 'flex';
      if (tabImportBtn) tabImportBtn.classList.remove('active');
      if (tabDeleteBtn) tabDeleteBtn.classList.add('active');
      if (modalTitle) modalTitle.innerHTML = '<span>PlayX Song Manager (Delete / Remove Songs)</span>';

      renderDeleteCategoryPills();
      loadDeleteCategorySongs(activeDeleteCategory);
    } else {
      if (addSection) addSection.style.display = 'block';
      if (deleteSection) deleteSection.style.display = 'none';
      if (tabImportBtn) tabImportBtn.classList.add('active');
      if (tabDeleteBtn) tabDeleteBtn.classList.remove('active');
      if (modalTitle) modalTitle.innerHTML = '<span>PlayX Song Importer</span>';
    }
  }

  function renderDeleteCategoryPills() {
    const container = document.getElementById('deleteCategoryPills');
    if (!container) return;

    container.innerHTML = CATEGORY_OPTIONS.map(cat => {
      const isActive = cat.id === activeDeleteCategory;
      return `
        <button type="button" class="delete-cat-pill ${isActive ? 'active' : ''}" data-cat="${cat.id}">
          <span>${cat.icon}</span> <span>${cat.name}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.delete-cat-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat');
        if (catId && catId !== activeDeleteCategory) {
          activeDeleteCategory = catId;
          renderDeleteCategoryPills();
          loadDeleteCategorySongs(catId);
        }
      });
    });
  }

  async function loadDeleteCategorySongs(categoryKey) {
    const listEl = document.getElementById('deleteSongsList');
    const countBadge = document.getElementById('deleteSongCountBadge');
    const searchInput = document.getElementById('deleteSongSearchInput');
    if (!listEl) return;

    if (searchInput) searchInput.value = '';

    const catObj = CATEGORY_OPTIONS.find(c => c.id === categoryKey);
    if (!catObj) return;

    listEl.innerHTML = `
      <div class="delete-empty-state">
        <div class="spinner"></div>
        <span>Loading ${escapeHtml(catObj.name)} playlist...</span>
      </div>
    `;

    try {
      const res = await fetch(`${catObj.file}?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`Could not load playlist (${res.status})`);
      const songs = await res.json();
      cachedDeleteSongs = Array.isArray(songs) ? songs : [];
      if (countBadge) countBadge.textContent = `${cachedDeleteSongs.length} songs`;
      renderDeleteSongsList('');
    } catch (err) {
      listEl.innerHTML = `
        <div class="delete-empty-state" style="color:#ef4444;">
          <span>⚠️</span>
          <span>Failed to load songs: ${escapeHtml(err.message)}</span>
        </div>
      `;
    }
  }

  function renderDeleteSongsList(query = '') {
    const listEl = document.getElementById('deleteSongsList');
    const countBadge = document.getElementById('deleteSongCountBadge');
    if (!listEl) return;

    const q = (query || '').toLowerCase().trim();
    const filtered = cachedDeleteSongs.filter(s => {
      if (!q) return true;
      const name = (s.name || s.title || '').toLowerCase();
      const singer = (s.singer || s.singerEn || '').toLowerCase();
      const id = String(s.id || '');
      return name.includes(q) || singer.includes(q) || id.includes(q);
    });

    if (countBadge) {
      countBadge.textContent = q ? `${filtered.length} of ${cachedDeleteSongs.length} songs` : `${cachedDeleteSongs.length} songs`;
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="delete-empty-state">
          <span>🔍</span>
          <span>No songs found matching "${escapeHtml(query)}".</span>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(s => {
      const sid = s.id;
      const name = s.name || s.title || 'Untitled Song';
      const singer = s.singer || 'Artist';
      const duration = s.duration || '--:--';
      const thumb = s.thumbnail || (s.videoId ? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg` : 'images/playx_icon.png');

      return `
        <div class="delete-song-row" id="deleteSongRow_${sid}">
          <div class="delete-song-left">
            <img src="${escapeHtml(thumb)}" class="delete-song-thumb" alt="${escapeHtml(name)}" onerror="this.src='images/playx_icon.png'">
            <div class="delete-song-info">
              <div class="delete-song-title" title="${escapeHtml(name)}">${escapeHtml(name)}</div>
              <div class="delete-song-artist">🎤 ${escapeHtml(singer)} • ⏱️ ${duration} • #${sid}</div>
            </div>
          </div>
          <button type="button" class="btn-delete-song-action" data-song-id="${sid}" data-song-name="${escapeHtml(name)}">
            <span>🗑️</span> <span>Delete</span>
          </button>
        </div>
      `;
    }).join('');

    // Attach click listeners to delete action buttons
    listEl.querySelectorAll('.btn-delete-song-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.getAttribute('data-song-id');
        const sname = btn.getAttribute('data-song-name') || 'this song';
        handleSongDeleteAction(sid, sname, btn);
      });
    });
  }

  async function handleSongDeleteAction(songId, songName, btnElement) {
    // 1. Verify Admin Authentication
    const isAdmin = localStorage.getItem('playx_admin_logged_in') === 'true';
    if (!isAdmin) {
      const proceed = confirm('🔒 Admin Authentication Required: You must be logged in as an administrator to delete songs.\n\nDo you want to log in now?');
      if (proceed && window.openAdminModal) window.openAdminModal();
      return;
    }

    const catObj = CATEGORY_OPTIONS.find(c => c.id === activeDeleteCategory);
    const catName = catObj ? catObj.name : activeDeleteCategory;

    // 2. User Confirmation Dialog
    const confirmed = confirm(`⚠️ Are you sure you want to permanently delete:\n\n"${songName}"\n\nfrom ${catName}? This change will be pushed to origin/main.`);
    if (!confirmed) return;

    btnElement.disabled = true;
    btnElement.innerHTML = `<div class="spinner"></div> <span>Deleting...</span>`;

    try {
      let deleteSuccess = false;
      let deleteMessage = '';

      // Strategy 1: Try Local Backend Server
      try {
        const adminToken = localStorage.getItem('playx_admin_token') || sessionStorage.getItem('playx_admin_secret') || '';
        const res = await fetch(`${API_BASE}/api/delete-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({ category: activeDeleteCategory, songId: songId })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            deleteSuccess = true;
            deleteMessage = 'Deleted via server and pushed to git origin/main!';
          }
        }
      } catch (err) {
        // Fallback to GitHub Direct REST API
      }

      // Strategy 2: Direct GitHub REST API Deletion (origin/main)
      if (!deleteSuccess) {
        const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token');
        if (!ghToken) {
          throw new Error('Server offline and no GitHub Token configured. Please click "⚙️ GitHub Token" above and enter your PLAYX_TOKEN to commit deletions.');
        }

        btnElement.innerHTML = `<div class="spinner"></div> <span>Pushing to GitHub...</span>`;
        await deleteSongDirectlyFromGitHub(activeDeleteCategory, songId, ghToken);
        deleteSuccess = true;
        deleteMessage = 'Deleted and committed directly to GitHub repository (origin/main)!';
      }

      // Remove from cached array
      cachedDeleteSongs = cachedDeleteSongs.filter(s => String(s.id) !== String(songId) && s.videoId !== String(songId));

      // Visual removal animation
      const row = document.getElementById(`deleteSongRow_${songId}`);
      if (row) {
        row.style.transition = 'all 0.35s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';
        setTimeout(() => row.remove(), 360);
      }

      const countBadge = document.getElementById('deleteSongCountBadge');
      if (countBadge) countBadge.textContent = `${cachedDeleteSongs.length} songs`;

      showBanner('info', `✅ "${songName}" was deleted and pushed to GitHub (origin/main) successfully!`);
    } catch (err) {
      alert(`Error deleting song:\n${err.message}`);
      btnElement.disabled = false;
      btnElement.innerHTML = `<span>🗑️</span> <span>Delete</span>`;
    }
  }

  async function deleteSongDirectlyFromGitHub(categoryKey, songId, githubToken) {
    const catObj = CATEGORY_OPTIONS.find(c => c.id === categoryKey);
    if (!catObj) throw new Error(`Invalid category: ${categoryKey}`);

    const repo = 'alok706175/PlayX';
    const branch = 'main';
    const filePath = catObj.file;
    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&_nocache=${Date.now()}`;

    const cleanToken = (githubToken || '').trim().replace(/^Bearer\s+/i, '').replace(/^token\s+/i, '');
    if (!cleanToken) {
      throw new Error('GitHub Token is missing. Click "⚙️ GitHub Token" and save your token.');
    }
    const authHeader = cleanToken.startsWith('github_pat_') ? `Bearer ${cleanToken}` : `token ${cleanToken}`;

    // 1. Fetch current file
    let getRes;
    try {
      getRes = await fetch(url, { headers: { 'Authorization': authHeader } });
    } catch (netErr) {
      try {
        getRes = await fetch(url);
      } catch (e) {
        throw new Error(`Failed to reach GitHub API (${netErr.message}). Check your internet connection.`);
      }
    }

    if (!getRes.ok) {
      if (getRes.status === 401) throw new Error('Invalid or expired GitHub Token (401)!');
      if (getRes.status === 403) throw new Error('GitHub Token Permission Denied (403)! Ensure token has "repo" scope.');
      throw new Error(`Failed to fetch playlist (${getRes.status})`);
    }

    const fileMeta = await getRes.json();
    let currentSongs = [];
    try {
      currentSongs = JSON.parse(decodeUtf8Base64(fileMeta.content));
    } catch (e) {
      throw new Error(`Could not parse playlist JSON: ${e.message}`);
    }

    const idx = currentSongs.findIndex(s => String(s.id) === String(songId) || s.videoId === String(songId));
    if (idx === -1) {
      throw new Error(`Song with ID "${songId}" was not found in the repository playlist.`);
    }

    const [deletedSong] = currentSongs.splice(idx, 1);

    // 2. Commit updated JSON back to GitHub
    const updatedJsonStr = JSON.stringify(currentSongs, null, 2) + '\n';
    const encodedContent = encodeUtf8Base64(updatedJsonStr);
    const commitMsg = `Delete '${(deletedSong.name || 'Song').replace(/['"]/g, '')}' from ${catObj.name} playlist [PlayX Admin]`;

    let putRes;
    try {
      putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMsg,
          content: encodedContent,
          sha: fileMeta.sha,
          branch: branch
        })
      });
    } catch (putErr) {
      throw new Error(`Network error while pushing commit to GitHub (${putErr.message}).`);
    }

    if (!putRes.ok) {
      if (putRes.status === 401 || putRes.status === 403) {
        throw new Error('GitHub Permission Denied! Ensure your token has write access to repository.');
      }
      if (putRes.status === 409) {
        throw new Error('GitHub Conflict (409): The playlist was recently modified on GitHub. Please retry.');
      }
      throw new Error(`GitHub Commit Error (${putRes.status})`);
    }

    // 3. If Hindi, also keep hindi_songs_data.js in sync
    if (categoryKey === 'hindi') {
      try {
        const bundlePath = 'hindi-songs/hindi_songs_data.js';
        let bundleSha = null;
        try {
          const bGet = await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}?ref=${branch}&_nocache=${Date.now()}`, {
            headers: { 'Authorization': authHeader }
          });
          if (bGet.ok) {
            const bMeta = await bGet.json();
            bundleSha = bMeta.sha;
          }
        } catch (e) {}

        const bundleStr = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(currentSongs, null, 2) + ';\n';
        await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}`, {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `Sync hindi_songs_data.js bundle after deleting '${(deletedSong.name || 'Song').replace(/['"]/g, '')}'`,
            content: encodeUtf8Base64(bundleStr),
            sha: bundleSha,
            branch: branch
          })
        });
      } catch (bundleErr) {
        console.warn('Hindi bundle sync on delete error:', bundleErr.message);
      }
    }

    return {
      success: true,
      deletedSong,
      totalSongs: currentSongs.length
    };
  }

  function openSongManager(categoryKey) {
    if (categoryKey && CATEGORY_OPTIONS.some(c => c.id === categoryKey)) {
      activeDeleteCategory = categoryKey;
    }
    openModal();
    switchTab('delete');
  }

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
        
        <div style="display: flex; align-items: center; gap: 0.95rem; background: var(--importer-surface); border: 1.5px solid var(--importer-border); padding: 0.95rem 1.35rem; border-radius: 16px; max-width: 520px; text-align: left; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
          <img src="${escapeHtml(thumbUrl)}" style="width: 68px; height: 50px; border-radius: 8px; object-fit: cover; background: #000;" onerror="this.src='images/playx_icon.png'">
          <div>
            <div style="font-weight: 750; color: var(--importer-text); font-size: 0.96rem;">${escapeHtml(s.name)}</div>
            <div style="font-size: 0.82rem; color: var(--importer-text-muted); margin-top: 0.2rem;">🎤 ${escapeHtml(s.singer)} • 📁 ${catName} #${s.id || savedData.totalSongs || ''}</div>
          </div>
        </div>

        ${savedData.githubSync?.committed ? `
          <div style="font-size: 0.86rem; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 0.65rem 1.1rem; border-radius: 12px; max-width: 520px; display: flex; align-items: center; gap: 0.65rem; text-align: left;">
            <span style="font-size: 1.3rem;">🚀</span>
            <div>
              <strong>GitHub Auto-Push Complete:</strong> ${savedData.githubSync.message}
              ${savedData.githubSync.url ? `<br><a href="${savedData.githubSync.url}" target="_blank" style="color: #38bdf8; text-decoration: underline; font-weight: 650;">View Commit on GitHub</a>` : ''}
            </div>
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.85rem; flex-wrap: wrap; justify-content: center; margin-top: 0.6rem;">
          <a href="${playNowUrl}" class="success-link-btn">
            <span>▶️</span> <span>Play "${escapeHtml(s.name.slice(0, 22))}" Now</span>
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
      activeAnalysis = null;
      hideBanner();
      renderWelcomeShowcase();
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
    openSongManager,
    switchTab,
    openModal,
    closeModal,
    analyzeUrl,
    cleanTitleString
  };
})();
