/**
 * PlayX Auto Added Songs - Frontend Song Importer Controller
 * 
 * Provides an administrative modal for analyzing YouTube / YouTube Music links,
 * previewing embed playback, approving metadata & categories, and saving to JSON.
 * Supports PWA Web Share Target automatic pre-fill and client-side fallback.
 */

(function () {
  "use strict";

  // Backend API URL (defaults to current origin or port 3000 if running on standard static port)
  const API_BASE = (function () {
    const origin = window.location.origin;
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      // If already on port 3000, use relative paths
      if (window.location.port === '3000') return '';
      // Otherwise point to backend on port 3000
      return 'http://localhost:3000';
    }
    return '';
  })();

  let modalEl = null;
  let activeAnalysis = null;
  let isSubmitting = false;

  const CATEGORY_OPTIONS = [
    { id: 'chhath', name: 'Chhath Puja Songs (छठ महापर्व)', page: 'chhath-puja/chhath-puja.html', file: 'chhath-puja/youtube_songs.json' },
    { id: 'hindi', name: 'Hindi Songs (बॉलीवुड सुपरहिट)', page: 'hindi-songs/hindi-songs.html', file: 'hindi-songs/hindi_songs.json' },
    { id: 'saawan', name: 'Saawan Songs (सावन शिव भजन)', page: 'saawan-songs/saawan-songs.html', file: 'saawan-songs/saawan_songs.json' },
    { id: 'durga', name: 'Durga Puja Songs (दुर्गा पूजा व नवरात्रि)', page: 'durga-puja-songs/durga-puja-songs.html', file: 'durga-puja-songs/durga_puja_songs.json' },
    { id: 'holi', name: 'Holi Songs (होली के रंग-बिरंगे)', page: 'holi-songs/holi-songs.html', file: 'holi-songs/holi_songs.json' },
    { id: 'bhojpuri', name: 'Bhojpuri Songs (भोजपुरी सुपरहिट)', page: 'bhojpuri-songs/bhojpuri-songs.html', file: 'bhojpuri-songs/bhojpuri_songs.json' },
    { id: 'haryanvi', name: 'Haryanvi Songs (हरियाणवी सुपरहिट)', page: 'haryanvi-songs/haryanvi-songs.html', file: 'haryanvi-songs/haryanvi_songs.json' },
    { id: 'punjabi', name: 'Punjabi Songs (पंजाबी सुपरहिट)', page: 'punjabi-songs/punjabi-songs.html', file: 'punjabi-songs/punjabi_songs.json' }
  ];

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
            <div>
              <h2 id="importerModalTitle">PlayX Song Importer</h2>
              <p>Automatic YouTube & YouTube Music Sharing & Embed Conversion</p>
            </div>
          </div>
          <button class="importer-close-btn" id="importerCloseBtn" type="button" title="Close Importer" aria-label="Close">✕</button>
        </div>

        <!-- Body -->
        <div class="importer-body" id="importerBody">
          <!-- Notification / Share Banner -->
          <div id="importerBanner" style="display: none;"></div>

          <!-- URL Input Section -->
          <div class="importer-input-wrapper">
            <label for="importerUrlInput">
              <span>Paste YouTube or YouTube Music Link</span>
              <span style="font-size: 0.78rem; font-weight: normal; color: var(--importer-text-muted);">Shorts, Watch, Music & Share Links</span>
            </label>
            <div class="importer-input-group">
              <input type="text" id="importerUrlInput" class="importer-url-input"
                placeholder="https://music.youtube.com/watch?v=... or https://youtu.be/..." autocomplete="off">
              <button type="button" class="btn-paste" id="importerPasteBtn" title="Paste from clipboard">
                <span>📋</span> <span>Paste</span>
              </button>
              <button type="button" class="btn-analyze" id="importerAnalyzeBtn">
                <span id="analyzeBtnIcon">🔍</span>
                <span id="analyzeBtnText">Analyze Link</span>
              </button>
            </div>
            <div class="input-hints">
              <span>✓ youtube.com/watch?v=...</span>
              <span>✓ youtu.be/...</span>
              <span>✓ music.youtube.com/watch?v=...</span>
              <span>✓ youtube.com/shorts/...</span>
            </div>
          </div>

          <!-- Dynamic Container for Preview & Status -->
          <div id="importerDynamicArea"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    modalEl = overlay;

    // Event listeners
    document.getElementById('importerCloseBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('importerPasteBtn').addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            document.getElementById('importerUrlInput').value = text.trim();
            analyzeUrl(text.trim());
          }
        } else {
          document.getElementById('importerUrlInput').focus();
        }
      } catch (err) {
        document.getElementById('importerUrlInput').focus();
      }
    });

    document.getElementById('importerAnalyzeBtn').addEventListener('click', () => {
      const val = document.getElementById('importerUrlInput').value.trim();
      if (!val) {
        showBanner('warning', 'कृपया YouTube या YouTube Music का लिंक दर्ज करें (Please enter a link).');
        return;
      }
      analyzeUrl(val);
    });

    // Enter key triggers analysis
    document.getElementById('importerUrlInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val) analyzeUrl(val);
      }
    });
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
      text.textContent = 'Analyzing...';
    } else {
      icon.innerHTML = `🔍`;
      text.textContent = 'Analyze Link';
    }
  }

  /**
   * Analyzes YouTube URL (via backend or client-side fallback)
   */
  async function analyzeUrl(inputUrl) {
    hideBanner();
    setAnalyzeLoading(true);
    const container = document.getElementById('importerDynamicArea');
    if (container) container.innerHTML = '';

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
        console.warn('Backend link analysis error, using client-side fallback:', backendErr.message);

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
      showBanner('danger', err.message);
    } finally {
      setAnalyzeLoading(false);
    }
  }

  /**
   * Renders the interactive preview card with embed player and metadata form
   */
  function renderPreview(data) {
    const container = document.getElementById('importerDynamicArea');
    if (!container) return;

    const meta = data.metadata;
    const catSug = data.categorySuggestion || { suggestedCategory: 'hindi', confidence: 'medium', reason: 'Default category' };
    const dup = data.duplicateCheck || { exists: false };

    const suggestedCatId = catSug.suggestedCategory || 'hindi';

    let duplicateHtml = '';
    if (dup.exists) {
      duplicateHtml = `
        <div class="importer-warning-box" style="background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
          <strong>⚠️ Duplicate Song Detected!</strong>
          <span>This song is already present in the "<strong>${dup.categoryName || dup.foundInCategory}</strong>" playlist (${dup.foundInFile}). Adding it again is not recommended.</span>
        </div>
      `;
    }

    let warningHtml = '';
    if (meta.warnings && meta.warnings.length > 0) {
      warningHtml = `
        <div class="importer-warning-box">
          ${meta.warnings.map(w => `<div>${w}</div>`).join('')}
        </div>
      `;
    }

    const optionsHtml = CATEGORY_OPTIONS.map(c => `
      <option value="${c.id}" ${c.id === suggestedCatId ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');

    container.innerHTML = `
      <div class="importer-preview-card" id="importerPreviewCard">
        <!-- Platform & Badge Row -->
        <div class="preview-badge-row">
          <span class="platform-pill">
            <span>📺</span> <span>${meta.platform || 'YouTube'}</span>
          </span>
          <span class="category-suggested-pill" title="${catSug.reason}">
            <span>✨ Auto-detected:</span>
            <span>${catSug.categoryDetails?.name || suggestedCatId} (${catSug.confidence.toUpperCase()})</span>
          </span>
        </div>

        ${duplicateHtml}
        ${warningHtml}

        <!-- Responsive Embed Player for Live Playback Verification -->
        <div class="preview-player-container">
          <iframe
            id="previewPlayerIframe"
            src="${meta.embedUrl}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}"
            title="${meta.cleanTitle}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen>
          </iframe>
        </div>

        <!-- Editable Metadata Form -->
        <div class="preview-form-grid">
          <div class="form-field full-width">
            <label for="editSongTitle">Song Title (गाने का नाम)</label>
            <input type="text" id="editSongTitle" value="${escapeHtml(meta.cleanTitle || meta.rawTitle)}" required>
          </div>

          <div class="form-field">
            <label for="editSongSinger">Artist / Singer / Channel (गायक / चैनल)</label>
            <input type="text" id="editSongSinger" value="${escapeHtml(meta.singer || meta.channelTitle)}" required>
          </div>

          <div class="form-field">
            <label for="selectSongCategory">Target Playlist Category (श्रेणी चुनें)</label>
            <select id="selectSongCategory">
              ${optionsHtml}
            </select>
          </div>

          <div class="form-field">
            <label for="editSongTag">Tag / Festival Note (टैग)</label>
            <input type="text" id="editSongTag" value="${escapeHtml(catSug.categoryDetails?.defaultTag || 'Special')}">
          </div>

          <div class="form-field">
            <label for="editSongDuration">Duration (अवधि)</label>
            <input type="text" id="editSongDuration" value="${escapeHtml(meta.duration || '--:--')}">
          </div>
        </div>

        <!-- Metadata Information Chips -->
        <div class="meta-chips-row">
          <div class="meta-chip"><span>Video ID:</span> <strong>${meta.videoId}</strong></div>
          <div class="meta-chip"><span>Embed URL:</span> <strong>${meta.embedUrl}</strong></div>
          <div class="meta-chip"><span>Source:</span> <strong>${meta.sourceApi || 'YouTube'}</strong></div>
        </div>

        <!-- Actions -->
        <div class="importer-actions">
          <button type="button" class="btn-secondary" id="importerCancelBtn">Cancel</button>
          <button type="button" class="btn-approve" id="importerApproveBtn" ${dup.exists ? 'style="background: linear-gradient(135deg, #f59e0b, #d97706);"' : ''}>
            <span>${dup.exists ? '⚠️ Import Anyway' : '✅ Approve & Add to Playlist'}</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('importerCancelBtn').addEventListener('click', () => {
      container.innerHTML = '';
      activeAnalysis = null;
    });

    document.getElementById('importerApproveBtn').addEventListener('click', () => {
      approveAndSaveSong();
    });
  }

  /**
   * Approves and saves song to JSON database
   */
  async function approveAndSaveSong() {
    if (!activeAnalysis || isSubmitting) return;

    // Check admin authentication
    const isAdmin = localStorage.getItem('playx_admin_logged_in') === 'true';
    if (!isAdmin) {
      alert('🔒 एडमिन लॉगिन आवश्यक है!\nकृपया गाने जोड़ने से पहले एडमिन पोर्टल में लॉगिन करें।');
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
      alert('कृपया गाने का शीर्षक और गायक दोनों दर्ज करें।');
      return;
    }

    const approveBtn = document.getElementById('importerApproveBtn');
    if (approveBtn) {
      approveBtn.disabled = true;
      approveBtn.innerHTML = `<div class="spinner"></div> <span>Saving to Database...</span>`;
    }
    isSubmitting = true;

    const payload = {
      adminSecret: 'Deep@k8747', // Standard PlayX admin secret
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

      try {
        const res = await fetch(`${API_BASE}/api/import-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-secret': 'Deep@k8747'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          savedData = await res.json();
        } else {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Server responded with status ${res.status}`);
        }
      } catch (backendErr) {
        console.warn('Backend save not available, offering JSON download/copy:', backendErr.message);

        // Fallback for static GitHub Pages / offline hosting
        const catObj = CATEGORY_OPTIONS.find(c => c.id === category);
        const record = {
          id: Date.now(),
          name: title,
          nameEn: title,
          singer: singer,
          singerEn: singer,
          category: catObj ? catObj.name : category,
          tag: tag,
          videoId: payload.songData.videoId,
          youtubeId: payload.songData.videoId,
          embedUrl: payload.songData.embedUrl,
          originalUrl: payload.songData.originalUrl,
          duration: duration,
          thumbnail: payload.songData.thumbnail,
          addedAt: new Date().toISOString(),
          status: 'approved'
        };

        savedData = {
          success: true,
          isClientFallback: true,
          song: record,
          targetFile: catObj?.file || 'category.json',
          categoryName: catObj?.name || category,
          pageUrl: catObj?.page || 'home.html'
        };
      }

      renderSuccess(savedData);
    } catch (err) {
      alert(`गाने को सुरक्षित करने में त्रुटि (Error saving song): ${err.message}`);
      if (approveBtn) {
        approveBtn.disabled = false;
        approveBtn.innerHTML = `<span>Approve & Add to Playlist</span>`;
      }
    } finally {
      isSubmitting = false;
    }
  }

  /**
   * Displays the final success card with direct playback link
   */
  function renderSuccess(savedData) {
    const container = document.getElementById('importerDynamicArea');
    if (!container) return;

    const s = savedData.song || {};
    const pageUrl = savedData.pageUrl || 'home.html';
    const catName = savedData.categoryName || 'PlayX';

    container.innerHTML = `
      <div class="importer-success-card">
        <div class="success-icon">🎉</div>
        <h3 style="margin: 0; font-size: 1.35rem; color: #10b981;">Song Successfully Imported!</h3>
        <p style="margin: 0; color: var(--importer-text-muted); max-width: 500px;">
          "<strong>${escapeHtml(s.name)}</strong>" by <strong>${escapeHtml(s.singer)}</strong>
          को सफलतापूर्वक <strong>${catName}</strong> प्लेलिस्ट में जोड़ दिया गया है।
        </p>

        ${savedData.githubSync?.committed ? `
          <div style="font-size: 0.88rem; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); padding: 0.6rem 1rem; border-radius: 10px; max-width: 520px; display: flex; align-items: center; gap: 0.5rem; text-align: left;">
            <span style="font-size: 1.2rem;">🚀</span>
            <div>
              <strong>GitHub Code Auto-Updated:</strong> ${savedData.githubSync.message}
              ${savedData.githubSync.url ? `<br><a href="${savedData.githubSync.url}" target="_blank" style="color: #38bdf8; text-decoration: underline;">View Commit on GitHub</a>` : ''}
            </div>
          </div>
        ` : ''}

        ${savedData.isClientFallback ? `
          <div style="font-size: 0.82rem; color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 0.75rem; border-radius: 8px; max-width: 520px; text-align: left;">
            ℹ️ <strong>Static Hosting Notice:</strong> To permanently update your JSON file with one click, run:
            <code>node "auto added songs/server.js"</code>. In static mode, copy this JSON snippet to <code>${savedData.targetFile}</code>:
            <textarea readonly style="width: 100%; height: 80px; margin-top: 0.4rem; background: #000; color: #fff; font-size: 0.75rem; border-radius: 6px; padding: 0.4rem;">${JSON.stringify(s, null, 2)}</textarea>
          </div>
        ` : ''}

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; margin-top: 0.5rem;">
          <a href="${pageUrl}" class="success-link-btn">
            <span>▶️</span> <span>Open ${catName} & Play Now</span>
          </a>
          <button type="button" class="btn-secondary" id="importAnotherBtn">
            <span>+ Import Another Song</span>
          </button>
        </div>
      </div>
    `;

    document.getElementById('importAnotherBtn').addEventListener('click', () => {
      document.getElementById('importerUrlInput').value = '';
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

      const input = document.getElementById('importerUrlInput');
      if (input) {
        if (prefillUrl) {
          input.value = prefillUrl;
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
      // Stop iframe video playback if playing
      const iframe = document.getElementById('previewPlayerIframe');
      if (iframe) iframe.src = '';
    }
  }

  /**
   * Checks query parameters for Web Share Target or external share link
   */
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

  // Initialize on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    initImporterUI();
    checkShareTargetOnLoad();
  });

  // Expose API on window
  window.PlayXSongImporter = {
    openModal,
    closeModal,
    analyzeUrl
  };
})();
