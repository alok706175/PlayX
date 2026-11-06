/**
 * PlayX Dedicated Admin Dashboard Engine
 * Full-Featured Music Management Control Center:
 * - Add New Song (YouTube link analyzer, oEmbed metadata, category detector, auto-import)
 * - Edit Song Name (Title editing & live sync)
 * - Edit Singer Name (Artist editing & live sync)
 * - Delete Song (Search, confirmation & permanent deletion)
 * - GitHub Auto-Sync & Backend Server Fallback
 */

(function () {
  'use strict';

  // Master Categories Definition
  const CATEGORIES = [
    { id: 'hindi', name: 'Hindi Songs', icon: '🎵', file: 'hindi-songs/hindi_songs.json', pageUrl: 'hindi-songs/hindi-songs.html', defaultTag: 'Bollywood Hits' },
    { id: 'bhojpuri', name: 'Bhojpuri Songs', icon: '💃', file: 'bhojpuri-songs/bhojpuri_songs.json', pageUrl: 'bhojpuri-songs/bhojpuri-songs.html', defaultTag: 'Desi Hits' },
    { id: 'chhath', name: 'Chhath Puja Songs', icon: '🌅', file: 'chhath-puja/youtube_songs.json', pageUrl: 'chhath-puja/chhath-puja.html', defaultTag: 'Chhath Mahaparv' },
    { id: 'saawan', name: 'Saawan Songs', icon: '🔱', file: 'saawan-songs/saawan_songs.json', pageUrl: 'saawan-songs/saawan-songs.html', defaultTag: 'Shiv Bhajan' },
    { id: 'durga', name: 'Durga Puja Songs', icon: '🪔', file: 'durga-puja-songs/durga_puja_songs.json', pageUrl: 'durga-puja-songs/durga-puja-songs.html', defaultTag: 'Mata Bhajan' },
    { id: 'holi', name: 'Holi Songs', icon: '🎨', file: 'holi-songs/holi_songs.json', pageUrl: 'holi-songs/holi-songs.html', defaultTag: 'Fagun Geet' },
    { id: 'haryanvi', name: 'Haryanvi Songs', icon: '🌾', file: 'haryanvi-songs/haryanvi_songs.json', pageUrl: 'haryanvi-songs/haryanvi-songs.html', defaultTag: 'Haryanvi Ragni' },
    { id: 'punjabi', name: 'Punjabi Songs', icon: '🥁', file: 'punjabi-songs/punjabi_songs.json', pageUrl: 'punjabi-songs/punjabi-songs.html', defaultTag: 'Punjabi Beats' }
  ];

  // API Base resolution
  const RENDER_BACKEND_URL = 'https://playx-backend-tcp4.onrender.com';
  function getApiBase() {
    if (window.location.port === '3000') return '';
    const custom = localStorage.getItem('playx_backend_url');
    if (custom) return custom;
    const hostname = window.location.hostname || '';
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
      return `${window.location.protocol}//${hostname}:3000`;
    }
    return RENDER_BACKEND_URL;
  }

  // Dashboard State
  let activeTab = 'manage-songs'; // 'manage-songs', 'add-song', 'overview', 'settings-sync'
  let activeCategory = 'hindi';
  let activeQuickFilter = 'all'; // 'all', 'edit-title', 'edit-singer', 'delete'
  let cachedCategorySongs = [];
  let categoryCounts = {};
  let currentAnalyzingMeta = null;

  // Selected song for Modal editing or deletion
  let pendingEditSong = null;
  let pendingDeleteSong = null;

  /* =========================================================
     1. INITIALIZATION & AUTHENTICATION GATE
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initAuthGate();
    initThemeToggle();
    initDashboardTabs();
    initSongManagement();
    initAddSongSection();
    initSettingsSection();
    initModals();

    if (isAuthenticated()) {
      unlockDashboard();
    } else {
      lockDashboard();
    }
  });

  function isAuthenticated() {
    return localStorage.getItem('playx_admin_logged_in') === 'true';
  }

  function lockDashboard() {
    document.getElementById('adminLoginGate').style.display = 'flex';
    document.getElementById('adminDashboardLayout').style.display = 'none';
  }

  function unlockDashboard() {
    document.getElementById('adminLoginGate').style.display = 'none';
    document.getElementById('adminDashboardLayout').style.display = 'flex';

    // Update user profile name if available
    const userName = localStorage.getItem('playx_admin_user') || 'Deepak Singh Rajput';
    const profileEl = document.getElementById('dashAdminName');
    if (profileEl) profileEl.textContent = userName;

    // Load initial data
    loadAllCategoryStats();
    loadCategorySongs(activeCategory);
    checkSyncStatus();
  }

  function initAuthGate() {
    const form = document.getElementById('adminGateLoginForm');
    const pwdInput = document.getElementById('gateAdminPassword');
    const eyeBtn = document.getElementById('gateTogglePwdBtn');
    const msgEl = document.getElementById('gateLoginMsg');

    // Password Eye Toggle
    if (eyeBtn && pwdInput) {
      const eyeSvg = `<svg class="gate-eye-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      const eyeOffSvg = `<svg class="gate-eye-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>`;

      eyeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        eyeBtn.innerHTML = isPwd ? eyeOffSvg : eyeSvg;
        eyeBtn.title = isPwd ? 'Hide password' : 'Show password';
      });
    }

    // Form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = (pwdInput.value || '').trim();
        if (!pwd) {
          showGateMsg('error', 'Please enter your admin password.');
          pwdInput.focus();
          return;
        }

        const submitBtn = document.getElementById('gateSubmitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<div class="spinner-large" style="width:20px;height:20px;border-width:2px;margin:0;"></div> <span>Verifying...</span>`;

        try {
          let loginSuccess = false;
          let token = '';
          let userName = 'Deepak Singh Rajput';

          // Strategy 1: Check with Backend API
          try {
            const apiBase = getApiBase();
            const res = await fetch(`${apiBase}/api/admin/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: pwd, username: 'admin' })
            });

            if (res.ok) {
              const data = await res.json();
              if (data && data.success) {
                loginSuccess = true;
                token = data.token || '';
                userName = data.user?.name || userName;
              }
            }
          } catch (netErr) {
            // Standalone or offline fallback
          }

          // Strategy 2: Cryptographic fallback check
          if (!loginSuccess) {
            const hash = await sha256Hex(pwd);
            const ALLOWED_HASHES = [
              '9839446f04c63aa87050212f4625b09d9fb19e68d1844bdfd4304918f7734bb0', // Deep@k8747
              'e866872a912bbbcbe4454721495c2560e29b1fa85703f167e42d7b5f6a5b6c86', // Deepak@8747
              'e18f26a11e1f7f09f029ce68ffb1856c80c2f82ba5dbce9fa0f5ce402f08a4e8'  // PlayX@AdminDefault2026
            ];

            if (pwd === 'Deep@k8747' || pwd === 'Deepak@8747' || pwd === 'PlayX@AdminDefault2026' || ALLOWED_HASHES.includes(hash)) {
              loginSuccess = true;
            }
          }

          if (loginSuccess) {
            showGateMsg('success', '✅ Access Granted! Unlocking Dashboard...');
            localStorage.setItem('playx_admin_logged_in', 'true');
            localStorage.setItem('playx_admin_user', userName);
            if (token) localStorage.setItem('playx_admin_token', token);
            try { sessionStorage.setItem('playx_admin_secret', pwd); } catch (e) {}

            setTimeout(() => {
              unlockDashboard();
              submitBtn.disabled = false;
              submitBtn.innerHTML = `<span>Unlock Admin Dashboard</span>`;
            }, 600);
          } else {
            showGateMsg('error', '❌ Invalid admin password. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Unlock Admin Dashboard</span>`;
            pwdInput.select();
          }
        } catch (err) {
          showGateMsg('error', 'Authentication error: ' + err.message);
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Unlock Admin Dashboard</span>`;
        }
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('dashLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out of the Admin Dashboard?')) {
          localStorage.removeItem('playx_admin_logged_in');
          localStorage.removeItem('playx_admin_token');
          try { sessionStorage.removeItem('playx_admin_secret'); } catch (e) {}
          lockDashboard();
          showToast('info', 'Logged out of Admin Portal.');
        }
      });
    }
  }

  function showGateMsg(type, text) {
    const el = document.getElementById('gateLoginMsg');
    if (!el) return;
    el.className = `gate-msg ${type}`;
    el.textContent = text;
    el.style.display = 'block';
  }

  async function sha256Hex(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* =========================================================
     2. THEME & TABS SWITCHING
     ========================================================= */
  function initThemeToggle() {
    const themeBtn = document.getElementById('dashThemeToggleBtn');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = cur === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('playx_theme', next);
      updateThemeIcon(next);
    });

    const savedTheme = localStorage.getItem('playx_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function updateThemeIcon(theme) {
    const sun = document.querySelector('.theme-icon-sun');
    const moon = document.querySelector('.theme-icon-moon');
    if (!sun || !moon) return;
    if (theme === 'light') {
      sun.style.display = 'inline-block';
      moon.style.display = 'none';
    } else {
      sun.style.display = 'none';
      moon.style.display = 'inline-block';
    }
  }

  function initDashboardTabs() {
    const tabBtns = document.querySelectorAll('.dash-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        switchDashTab(target);
      });
    });
  }

  window.switchDashTab = function (targetTabId) {
    activeTab = targetTabId;

    // Update tab buttons
    document.querySelectorAll('.dash-tab-btn').forEach(btn => {
      const isTarget = btn.getAttribute('data-target') === targetTabId;
      btn.classList.toggle('active', isTarget);
      btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    // Update tab sections
    const map = {
      'manage-songs': 'sectionManageSongs',
      'add-song': 'sectionAddSong',
      'overview': 'sectionOverview',
      'settings-sync': 'sectionSettingsSync'
    };

    Object.entries(map).forEach(([key, sectionId]) => {
      const sec = document.getElementById(sectionId);
      if (sec) {
        sec.style.display = (key === targetTabId) ? 'flex' : 'none';
      }
    });

    // Sub-actions on switch
    if (targetTabId === 'manage-songs') {
      loadCategorySongs(activeCategory);
    } else if (targetTabId === 'overview') {
      loadAllCategoryStats();
      loadRecentHistory();
    }
  };

  /* =========================================================
     3. SONG MANAGEMENT (EDIT TITLE, EDIT SINGER, DELETE)
     ========================================================= */
  function initSongManagement() {
    renderCategoryPills();

    // Search filter input
    const searchInput = document.getElementById('dashSongSearchInput');
    const clearBtn = document.getElementById('dashClearSearchBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.trim();
        if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
        renderSongsTable(q);
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        renderSongsTable('');
        searchInput.focus();
      });
    }

    // Quick filter chips (All, Edit Title, Edit Singer, Delete)
    document.querySelectorAll('.manage-quick-filters .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.manage-quick-filters .filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeQuickFilter = chip.getAttribute('data-filter') || 'all';
        renderSongsTable(searchInput?.value || '');
      });
    });
  }

  function renderCategoryPills() {
    const container = document.getElementById('dashCategoryPillsBar');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => {
      const count = categoryCounts[cat.id] !== undefined ? categoryCounts[cat.id] : '...';
      const isActive = cat.id === activeCategory;
      return `
        <button type="button" class="cat-pill-item ${isActive ? 'active' : ''}" data-cat-id="${cat.id}">
          <span>${cat.icon}</span>
          <span>${cat.name}</span>
          <span style="opacity:0.75;font-size:0.75rem;">(${count})</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.cat-pill-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.getAttribute('data-cat-id');
        if (catId && catId !== activeCategory) {
          activeCategory = catId;
          renderCategoryPills();
          loadCategorySongs(catId);
        }
      });
    });
  }

  async function loadCategorySongs(categoryKey) {
    const tableBody = document.getElementById('dashSongsList');
    const searchInput = document.getElementById('dashSongSearchInput');
    if (!tableBody) return;

    const catObj = CATEGORIES.find(c => c.id === categoryKey);
    if (!catObj) return;

    tableBody.innerHTML = `
      <div class="dash-loading-state">
        <div class="spinner-large"></div>
        <p>Loading ${escapeHtml(catObj.name)} songs...</p>
      </div>
    `;

    try {
      const res = await fetch(`${catObj.file}?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`Could not load playlist file (${res.status})`);
      const data = await res.json();
      cachedCategorySongs = Array.isArray(data) ? data : [];

      // Update badge count
      categoryCounts[categoryKey] = cachedCategorySongs.length;
      renderCategoryPills();

      const tabBadge = document.getElementById('tabManageCountBadge');
      if (tabBadge) tabBadge.textContent = `${cachedCategorySongs.length}`;

      renderSongsTable(searchInput?.value || '');
    } catch (err) {
      tableBody.innerHTML = `
        <div class="dash-empty-state" style="color:var(--dash-danger);">
          <span>⚠️</span>
          <p>Failed to load ${escapeHtml(catObj.name)}: ${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function renderSongsTable(query = '') {
    const tableBody = document.getElementById('dashSongsList');
    const statsText = document.getElementById('dashFilteredCountText');
    if (!tableBody) return;

    const q = (query || '').toLowerCase().trim();
    const filtered = cachedCategorySongs.filter(s => {
      if (!q) return true;
      const name = (s.name || s.title || '').toLowerCase();
      const singer = (s.singer || s.singerEn || '').toLowerCase();
      const id = String(s.id || '');
      return name.includes(q) || singer.includes(q) || id.includes(q);
    });

    if (statsText) {
      const catObj = CATEGORIES.find(c => c.id === activeCategory);
      statsText.textContent = `${filtered.length} of ${cachedCategorySongs.length} songs (${catObj ? catObj.name : ''})`;
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <div class="dash-empty-state">
          <span>🔍</span>
          <p>No songs found matching "${escapeHtml(query)}" in this playlist.</p>
        </div>
      `;
      return;
    }

    const isTitleFocus = activeQuickFilter === 'edit-title';
    const isSingerFocus = activeQuickFilter === 'edit-singer';
    const catObj = CATEGORIES.find(c => c.id === activeCategory);

    tableBody.innerHTML = filtered.map(s => {
      const sid = s.id;
      const name = s.name || s.title || 'Untitled Song';
      const singer = s.singer || 'Artist';
      const duration = s.duration || '--:--';
      const thumb = s.thumbnail || (s.videoId ? `https://i.ytimg.com/vi/${s.videoId}/hqdefault.jpg` : 'images/playx_icon.png');

      return `
        <div class="song-row-item" id="songRow_${sid}">
          <div>
            <img src="${escapeHtml(thumb)}" class="song-cover-thumb" alt="${escapeHtml(name)}" onerror="this.src='images/playx_icon.png'">
          </div>

          <div class="song-title-cell ${isTitleFocus ? 'focus-highlight' : ''}">
            <span class="song-title-text" id="rowTitle_${sid}" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
          </div>

          <div class="song-singer-cell ${isSingerFocus ? 'focus-highlight' : ''}">
            <span class="song-singer-text" id="rowSinger_${sid}">🎤 ${escapeHtml(singer)}</span>
          </div>

          <div>
            <span class="cat-badge-cell">
              <span>${catObj ? catObj.icon : '📁'}</span>
              <span>${catObj ? catObj.name : 'Music'}</span>
            </span>
          </div>

          <div class="duration-cell">${duration}</div>

          <div class="row-actions-cell">
            <button type="button" class="btn-action-edit" data-song-id="${sid}" title="Edit Song Title & Singer">
              <span>✏️</span> <span>Edit</span>
            </button>
            <button type="button" class="btn-action-delete" data-song-id="${sid}" title="Delete song">
              <span>🗑️</span> <span>Delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to Edit buttons
    tableBody.querySelectorAll('.btn-action-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.getAttribute('data-song-id');
        const song = cachedCategorySongs.find(s => String(s.id) === String(sid) || s.videoId === String(sid));
        if (song) openEditSongModal(song);
      });
    });

    // Attach click listeners to Delete buttons
    tableBody.querySelectorAll('.btn-action-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sid = btn.getAttribute('data-song-id');
        const song = cachedCategorySongs.find(s => String(s.id) === String(sid) || s.videoId === String(sid));
        if (song) openDeleteSongModal(song);
      });
    });
  }

  /* =========================================================
     4. EDIT SONG NAME & SINGER NAME MODAL
     ========================================================= */
  function initModals() {
    // Edit Modal close handlers
    const editClose = document.getElementById('btnEditModalClose');
    const editCancel = document.getElementById('btnEditModalCancel');
    const editOverlay = document.getElementById('modalEditSong');
    if (editClose) editClose.addEventListener('click', closeEditSongModal);
    if (editCancel) editCancel.addEventListener('click', closeEditSongModal);
    if (editOverlay) {
      editOverlay.addEventListener('click', (e) => {
        if (e.target === editOverlay) closeEditSongModal();
      });
    }

    // Delete Modal close handlers
    const delClose = document.getElementById('btnDeleteModalClose');
    const delCancel = document.getElementById('btnDeleteModalCancel');
    const delOverlay = document.getElementById('modalDeleteSong');
    if (delClose) delClose.addEventListener('click', closeDeleteSongModal);
    if (delCancel) delCancel.addEventListener('click', closeDeleteSongModal);
    if (delOverlay) {
      delOverlay.addEventListener('click', (e) => {
        if (e.target === delOverlay) closeDeleteSongModal();
      });
    }

    // Edit Form Submit
    const editForm = document.getElementById('formEditSong');
    if (editForm) {
      editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSaveSongEdit();
      });
    }

    // Delete Confirm Button
    const delConfirmBtn = document.getElementById('btnDeleteModalConfirm');
    if (delConfirmBtn) {
      delConfirmBtn.addEventListener('click', async () => {
        await handleConfirmSongDelete();
      });
    }
  }

  function openEditSongModal(song) {
    pendingEditSong = song;
    const overlay = document.getElementById('modalEditSong');
    const idInput = document.getElementById('editModalSongId');
    const catInput = document.getElementById('editModalCategoryKey');
    const titleInput = document.getElementById('inputEditSongTitle');
    const singerInput = document.getElementById('inputEditSongSinger');
    const tagInput = document.getElementById('inputEditSongTag');
    const idDisplay = document.getElementById('displayEditSongId');
    const alertMsg = document.getElementById('editModalMsg');

    if (!overlay) return;
    if (alertMsg) alertMsg.style.display = 'none';

    idInput.value = song.id || '';
    catInput.value = activeCategory;
    titleInput.value = song.name || song.title || '';
    singerInput.value = song.singer || '';
    tagInput.value = song.tag || '';
    idDisplay.value = `#${song.id || ''}`;

    overlay.style.display = 'flex';
    titleInput.focus();
    titleInput.select();
  }

  function closeEditSongModal() {
    const overlay = document.getElementById('modalEditSong');
    if (overlay) overlay.style.display = 'none';
    pendingEditSong = null;
  }

  async function handleSaveSongEdit() {
    if (!pendingEditSong) return;

    const titleInput = document.getElementById('inputEditSongTitle');
    const singerInput = document.getElementById('inputEditSongSinger');
    const tagInput = document.getElementById('inputEditSongTag');
    const saveBtn = document.getElementById('btnEditModalSave');
    const alertMsg = document.getElementById('editModalMsg');

    const newTitle = (titleInput.value || '').trim();
    const newSinger = (singerInput.value || '').trim();
    const newTag = (tagInput.value || '').trim();

    if (!newTitle) {
      alert('Song name cannot be empty.');
      titleInput.focus();
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<div class="spinner-large" style="width:18px;height:18px;border-width:2px;margin:0;"></div> <span>Saving...</span>`;

    const songId = pendingEditSong.id;
    const catObj = CATEGORIES.find(c => c.id === activeCategory);

    try {
      let updateSuccess = false;

      // Strategy 1: Local / Cloud Backend API
      try {
        const adminToken = localStorage.getItem('playx_admin_token') || sessionStorage.getItem('playx_admin_secret') || '';
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/update-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({
            category: activeCategory,
            id: songId,
            name: newTitle,
            nameEn: newTitle,
            singer: newSinger,
            singerEn: newSinger,
            tag: newTag
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            updateSuccess = true;
          }
        }
      } catch (apiErr) {
        // Fallback to GitHub Direct Commit
      }

      // Strategy 2: GitHub Direct Commit with PLAYX_TOKEN
      if (!updateSuccess) {
        const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token');
        if (!ghToken) {
          throw new Error('Server unreachable and no GitHub Token configured. Please open "⚙️ Settings & GitHub PAT" to save your PLAYX_TOKEN.');
        }

        saveBtn.innerHTML = `<div class="spinner-large" style="width:18px;height:18px;border-width:2px;margin:0;"></div> <span>Pushing to GitHub...</span>`;
        await updateSongOnGitHubDirect(activeCategory, songId, { name: newTitle, singer: newSinger, tag: newTag }, ghToken);
        updateSuccess = true;
      }

      // Update in local cached array
      pendingEditSong.name = newTitle;
      pendingEditSong.nameEn = newTitle;
      pendingEditSong.singer = newSinger;
      pendingEditSong.singerEn = newSinger;
      if (newTag) pendingEditSong.tag = newTag;

      // Update DOM row directly
      const titleCell = document.getElementById(`rowTitle_${songId}`);
      const singerCell = document.getElementById(`rowSinger_${songId}`);
      if (titleCell) {
        titleCell.textContent = newTitle;
        titleCell.style.color = 'var(--dash-emerald)';
        setTimeout(() => { titleCell.style.color = ''; }, 2500);
      }
      if (singerCell) {
        singerCell.textContent = `🎤 ${newSinger}`;
      }

      showToast('success', `✅ "${newTitle}" updated & committed to origin/main!`);
      closeEditSongModal();
    } catch (err) {
      if (alertMsg) {
        alertMsg.className = 'modal-alert-msg danger';
        alertMsg.textContent = 'Error: ' + err.message;
        alertMsg.style.display = 'block';
      } else {
        alert(err.message);
      }
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span>💾</span> <span>Save Changes</span>`;
    }
  }

  /* =========================================================
     5. DELETE SONG MODAL & ENGINE
     ========================================================= */
  function openDeleteSongModal(song) {
    pendingDeleteSong = song;
    const overlay = document.getElementById('modalDeleteSong');
    const thumb = document.getElementById('deleteModalThumb');
    const nameEl = document.getElementById('deleteModalSongName');
    const singerEl = document.getElementById('deleteModalSongSinger');
    const catEl = document.getElementById('deleteModalCategoryName');
    const alertMsg = document.getElementById('deleteModalMsg');

    if (!overlay) return;
    if (alertMsg) alertMsg.style.display = 'none';

    const catObj = CATEGORIES.find(c => c.id === activeCategory);
    const thumbUrl = song.thumbnail || (song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 'images/playx_icon.png');

    thumb.src = thumbUrl;
    nameEl.textContent = song.name || song.title || 'Untitled Song';
    singerEl.textContent = `🎤 ${song.singer || 'Artist'} • ID #${song.id}`;
    catEl.textContent = catObj ? `${catObj.icon} ${catObj.name}` : activeCategory;

    overlay.style.display = 'flex';
  }

  function closeDeleteSongModal() {
    const overlay = document.getElementById('modalDeleteSong');
    if (overlay) overlay.style.display = 'none';
    pendingDeleteSong = null;
  }

  async function handleConfirmSongDelete() {
    if (!pendingDeleteSong) return;

    const confirmBtn = document.getElementById('btnDeleteModalConfirm');
    const alertMsg = document.getElementById('deleteModalMsg');
    const songId = pendingDeleteSong.id;
    const songName = pendingDeleteSong.name || pendingDeleteSong.title || 'Song';
    const catObj = CATEGORIES.find(c => c.id === activeCategory);

    confirmBtn.disabled = true;
    confirmBtn.innerHTML = `<div class="spinner-large" style="width:18px;height:18px;border-width:2px;margin:0;"></div> <span>Deleting...</span>`;

    try {
      let deleteSuccess = false;

      // Strategy 1: Backend API
      try {
        const adminToken = localStorage.getItem('playx_admin_token') || sessionStorage.getItem('playx_admin_secret') || '';
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/delete-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify({ category: activeCategory, songId: songId })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            deleteSuccess = true;
          }
        }
      } catch (apiErr) {
        // Fallback to GitHub Direct Commit
      }

      // Strategy 2: GitHub Direct Commit
      if (!deleteSuccess) {
        const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token');
        if (!ghToken) {
          throw new Error('Server unreachable and no GitHub Token configured. Please open Settings tab to enter your PLAYX_TOKEN.');
        }

        confirmBtn.innerHTML = `<div class="spinner-large" style="width:18px;height:18px;border-width:2px;margin:0;"></div> <span>Pushing deletion...</span>`;
        await deleteSongOnGitHubDirect(activeCategory, songId, ghToken);
        deleteSuccess = true;
      }

      // Remove from cached array
      cachedCategorySongs = cachedCategorySongs.filter(s => String(s.id) !== String(songId) && s.videoId !== String(songId));
      categoryCounts[activeCategory] = cachedCategorySongs.length;
      renderCategoryPills();

      // Animate row removal
      const row = document.getElementById(`songRow_${songId}`);
      if (row) {
        row.style.transition = 'all 0.35s ease';
        row.style.opacity = '0';
        row.style.transform = 'translateX(-25px)';
        setTimeout(() => row.remove(), 360);
      }

      showToast('success', `🗑️ "${songName}" permanently deleted & committed to GitHub!`);
      closeDeleteSongModal();
      loadAllCategoryStats();
    } catch (err) {
      if (alertMsg) {
        alertMsg.className = 'modal-alert-msg danger';
        alertMsg.textContent = 'Delete error: ' + err.message;
        alertMsg.style.display = 'block';
      } else {
        alert(err.message);
      }
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = `<span>🗑️</span> <span>Yes, Permanently Delete</span>`;
    }
  }

  /* =========================================================
     6. ADD NEW SONG ENGINE (YOUTUBE LINK PARSER)
     ========================================================= */
  function initAddSongSection() {
    const input = document.getElementById('addSongUrlInput');
    const analyzeBtn = document.getElementById('addSongAnalyzeBtn');
    const pasteBtn = document.getElementById('addSongPasteBtn');
    const clearBtn = document.getElementById('addSongClearBtn');

    if (pasteBtn && input) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            input.value = text.trim();
            analyzeCurrentInput();
          }
        } catch (e) {
          input.focus();
        }
      });
    }

    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        renderAddWelcomeShowcase();
        input.focus();
      });
    }

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', () => {
        analyzeCurrentInput();
      });
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          analyzeCurrentInput();
        }
      });
    }
  }

  async function analyzeCurrentInput() {
    const input = document.getElementById('addSongUrlInput');
    const btn = document.getElementById('addSongAnalyzeBtn');
    const container = document.getElementById('addSongDynamicArea');
    if (!input || !container) return;

    const raw = (input.value || '').trim();
    if (!raw) {
      showToast('error', 'Please enter a valid YouTube link.');
      input.focus();
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<div class="spinner-large" style="width:16px;height:16px;border-width:2px;margin:0;"></div> <span>Analyzing...</span>`;

    container.innerHTML = `
      <div class="dash-loading-state">
        <div class="spinner-large"></div>
        <p>Analyzing YouTube link & fetching metadata...</p>
      </div>
    `;

    try {
      let analysisResult = null;

      // Strategy 1: Backend API
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/parse-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: raw })
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.valid && data.videoId) {
            analysisResult = data;
          }
        }
      } catch (apiErr) {}

      // Strategy 2: Client-side URL Parser + YouTube oEmbed fallback
      if (!analysisResult) {
        if (!window.PlayXUrlParser) throw new Error('URL Parser module is loading. Please retry.');
        const parsed = window.PlayXUrlParser.parse(raw);
        if (!parsed || !parsed.valid || !parsed.videoId) {
          throw new Error('Invalid YouTube URL. Please check the link and try again.');
        }

        // Fetch oEmbed
        let oembed = {};
        try {
          const oRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${parsed.videoId}&format=json`);
          if (oRes.ok) oembed = await oRes.json();
        } catch (oe) {}

        const cleanTitle = cleanVideoTitle(oembed.title || 'New Song');
        const catSuggestion = window.PlayXCategoryDetector ? window.PlayXCategoryDetector.detect({
          title: oembed.title || '',
          cleanTitle: cleanTitle,
          channelTitle: oembed.author_name || ''
        }) : { category: 'hindi', categoryDetails: { name: 'Hindi Songs', defaultTag: 'Bollywood Hits' } };

        analysisResult = {
          valid: true,
          videoId: parsed.videoId,
          embedUrl: `https://www.youtube.com/embed/${parsed.videoId}`,
          cleanTitle: cleanTitle,
          meta: {
            title: oembed.title || cleanTitle,
            singer: oembed.author_name || 'Artist',
            channelTitle: oembed.author_name || '',
            thumbnail: `https://i.ytimg.com/vi/${parsed.videoId}/hqdefault.jpg`,
            duration: '03:45'
          },
          categorySuggestion: catSuggestion
        };
      }

      currentAnalyzingMeta = analysisResult;
      renderSongReviewCard(analysisResult);
    } catch (err) {
      container.innerHTML = `
        <div class="dash-empty-state" style="color:var(--dash-danger);">
          <span>⚠️</span>
          <p>Failed to analyze video: ${escapeHtml(err.message)}</p>
          <button type="button" class="btn-hero-secondary" onclick="document.getElementById('addSongUrlInput').focus();" style="margin-top:1rem;">
            Try Another Link
          </button>
        </div>
      `;
      showToast('error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span>⚡</span> <span>Analyze Link</span>`;
    }
  }

  function renderSongReviewCard(data) {
    const container = document.getElementById('addSongDynamicArea');
    if (!container) return;

    const vid = data.videoId;
    const meta = data.meta || {};
    const initialTitle = data.cleanTitle || meta.title || 'Untitled Song';
    const initialSinger = meta.singer || meta.channelTitle || 'Artist';
    const catSug = data.categorySuggestion || {};
    const suggestedCatKey = catSug.category || 'hindi';
    const embedUrl = data.embedUrl || `https://www.youtube.com/embed/${vid}`;

    const categoryOptionsHtml = CATEGORIES.map(c => {
      const isSel = c.id === suggestedCatKey;
      return `<option value="${c.id}" ${isSel ? 'selected' : ''}>${c.icon} ${c.name}</option>`;
    }).join('');

    container.innerHTML = `
      <div class="review-song-grid">
        <div class="preview-media-pane">
          <div class="preview-embed-wrap">
            <iframe src="${escapeHtml(embedUrl)}?autoplay=0&rel=0" title="YouTube video player" allowfullscreen></iframe>
          </div>
          <div style="font-size: 0.8rem; color: var(--dash-text-dim); display:flex; justify-content:space-between;">
            <span>ID: <code>${vid}</code></span>
            <span>Auto-Category: <strong>${catSug.categoryDetails?.name || 'Detected'}</strong></span>
          </div>
        </div>

        <form id="formApproveAddSong" class="review-form-pane">
          <div class="review-field-group">
            <label for="reviewInputTitle">Song Name / Title <span style="color:var(--dash-danger)">*</span></label>
            <input type="text" id="reviewInputTitle" class="review-input-styled" value="${escapeHtml(initialTitle)}" required>
          </div>

          <div class="review-field-group">
            <label for="reviewInputSinger">Singer / Artist Name <span style="color:var(--dash-danger)">*</span></label>
            <input type="text" id="reviewInputSinger" class="review-input-styled" value="${escapeHtml(initialSinger)}" required>
          </div>

          <div class="review-field-group">
            <label for="reviewSelectCategory">Target Playlist / Category <span style="color:var(--dash-danger)">*</span></label>
            <select id="reviewSelectCategory" class="review-input-styled" style="cursor:pointer;">
              ${categoryOptionsHtml}
            </select>
          </div>

          <div class="review-field-group" id="subCatGroup" style="${suggestedCatKey === 'hindi' ? 'display:flex;' : 'display:none;'}">
            <label for="reviewSubCategory">Hindi Sub-Category Mood</label>
            <select id="reviewSubCategory" class="review-input-styled">
              <option value="Romantic" selected>Romantic</option>
              <option value="90s Classics">90s Classics</option>
              <option value="Soulful Melodies">Soulful Melodies</option>
              <option value="Dance & Beats">Dance & Beats</option>
            </select>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
            <div class="review-field-group">
              <label for="reviewInputTag">Tag / Mood</label>
              <input type="text" id="reviewInputTag" class="review-input-styled" value="${escapeHtml(catSug.categoryDetails?.defaultTag || 'Hits')}">
            </div>
            <div class="review-field-group">
              <label for="reviewInputDuration">Duration</label>
              <input type="text" id="reviewInputDuration" class="review-input-styled" value="${escapeHtml(meta.duration || '03:45')}">
            </div>
          </div>

          <button type="submit" class="btn-approve-song-save" id="btnApproveSave">
            <span>💾</span> <span>Approve & Save Song</span>
          </button>
        </form>
      </div>
    `;

    // Listen to category change to toggle Hindi sub-category
    const catSelect = document.getElementById('reviewSelectCategory');
    const subCatGroup = document.getElementById('subCatGroup');
    if (catSelect && subCatGroup) {
      catSelect.addEventListener('change', () => {
        subCatGroup.style.display = (catSelect.value === 'hindi') ? 'flex' : 'none';
      });
    }

    // Attach approve submission
    const approveForm = document.getElementById('formApproveAddSong');
    if (approveForm) {
      approveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleApproveSongSubmit(vid, embedUrl);
      });
    }
  }

  async function handleApproveSongSubmit(videoId, embedUrl) {
    const saveBtn = document.getElementById('btnApproveSave');
    const title = (document.getElementById('reviewInputTitle')?.value || '').trim();
    const singer = (document.getElementById('reviewInputSinger')?.value || '').trim();
    const catKey = document.getElementById('reviewSelectCategory')?.value || 'hindi';
    const subCat = document.getElementById('reviewSubCategory')?.value || 'Romantic';
    const tag = (document.getElementById('reviewInputTag')?.value || '').trim();
    const duration = (document.getElementById('reviewInputDuration')?.value || '').trim();

    if (!title) {
      alert('Song title is required.');
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<div class="spinner-large" style="width:20px;height:20px;border-width:2px;margin:0;"></div> <span>Importing & Pushing to GitHub...</span>`;

    const songPayload = {
      videoId,
      embedUrl,
      title,
      titleEn: title,
      singer,
      singerEn: singer,
      category: catKey,
      subCategory: subCat,
      tag: tag || 'New Song',
      duration: duration || '03:45',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      originalUrl: `https://www.youtube.com/watch?v=${videoId}`
    };

    try {
      let importSuccess = false;

      // Strategy 1: Backend Server
      try {
        const adminToken = localStorage.getItem('playx_admin_token') || sessionStorage.getItem('playx_admin_secret') || '';
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/api/import-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {})
          },
          body: JSON.stringify(songPayload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            importSuccess = true;
          } else if (data && data.duplicateDetails) {
            throw new Error(`Duplicate Song: Already exists in "${data.duplicateDetails.categoryName}"`);
          }
        }
      } catch (apiErr) {
        if (apiErr.message.includes('Duplicate Song')) throw apiErr;
      }

      // Strategy 2: GitHub Direct Commit
      if (!importSuccess) {
        const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token');
        if (!ghToken) {
          throw new Error('Server unreachable and no GitHub Token configured. Please open Settings tab to enter your PLAYX_TOKEN.');
        }

        saveBtn.innerHTML = `<div class="spinner-large" style="width:20px;height:20px;border-width:2px;margin:0;"></div> <span>Committing to GitHub origin/main...</span>`;
        await importSongOnGitHubDirect(catKey, songPayload, ghToken);
        importSuccess = true;
      }

      showToast('success', `🎉 "${title}" successfully imported and committed to origin/main!`);

      // Reset Input and show success showcase
      const input = document.getElementById('addSongUrlInput');
      if (input) input.value = '';

      renderAddWelcomeShowcase();
      loadAllCategoryStats();

      // If imported category is current, reload playlist
      if (activeCategory === catKey) {
        loadCategorySongs(catKey);
      }
    } catch (err) {
      alert(`Import Error:\n${err.message}`);
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<span>💾</span> <span>Approve & Save Song</span>`;
    }
  }

  function renderAddWelcomeShowcase() {
    const container = document.getElementById('addSongDynamicArea');
    if (!container) return;
    container.innerHTML = `
      <div class="add-welcome-showcase">
        <div class="showcase-glow"></div>
        <div class="showcase-content">
          <div class="showcase-emoji">🚀</div>
          <h3>Intelligent Song Importer Ready</h3>
          <p>Paste a YouTube URL above and click <strong>Analyze Link</strong>. You can review and edit the song title, artist, category, and tag before approving the commit to GitHub.</p>
          
          <div class="showcase-features-grid">
            <div class="feat-pill"><span>🔍</span> <span>Clean Title Sanitization</span></div>
            <div class="feat-pill"><span>🤖</span> <span>Automatic Linguistic Category Detection</span></div>
            <div class="feat-pill"><span>🛡️</span> <span>Duplicate Song Prevention</span></div>
            <div class="feat-pill"><span>⚡</span> <span>Instant GitHub Direct Push</span></div>
          </div>
        </div>
      </div>
    `;
  }

  /* =========================================================
     7. CATEGORY STATS & OVERVIEW
     ========================================================= */
  async function loadAllCategoryStats() {
    let totalSongs = 0;

    for (const cat of CATEGORIES) {
      try {
        const res = await fetch(`${cat.file}?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            categoryCounts[cat.id] = data.length;
            totalSongs += data.length;
          }
        }
      } catch (e) {}
    }

    const totalEl = document.getElementById('statTotalSongs');
    if (totalEl) totalEl.textContent = totalSongs.toLocaleString();

    renderCategoryPills();
    renderOverviewCategoryCards();
  }

  function renderOverviewCategoryCards() {
    const container = document.getElementById('dashOverviewCategoryGrid');
    if (!container) return;

    container.innerHTML = CATEGORIES.map(cat => {
      const count = categoryCounts[cat.id] !== undefined ? categoryCounts[cat.id] : '...';
      return `
        <div class="cat-overview-card" onclick="window.manageSpecificCategory('${cat.id}')">
          <div class="cat-card-top">
            <span class="cat-card-icon">${cat.icon}</span>
            <span class="cat-card-count">${count}</span>
          </div>
          <div class="cat-card-title">${cat.name}</div>
          <div class="cat-card-desc">Click to manage & edit songs in this playlist</div>
        </div>
      `;
    }).join('');

    const refreshBtn = document.getElementById('btnRefreshCategories');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        loadAllCategoryStats();
        showToast('info', 'Refreshed category song counts.');
      };
    }
  }

  window.manageSpecificCategory = function (catId) {
    activeCategory = catId;
    switchDashTab('manage-songs');
    renderCategoryPills();
    loadCategorySongs(catId);
  };

  async function loadRecentHistory() {
    const container = document.getElementById('dashRecentHistoryList');
    if (!container) return;

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/recent-imports`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.recentImports) && data.recentImports.length > 0) {
          container.innerHTML = data.recentImports.slice(0, 5).map(item => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid var(--dash-border);">
              <div>
                <strong style="color:var(--dash-text);font-size:0.9rem;">${escapeHtml(item.name)}</strong>
                <div style="font-size:0.78rem;color:var(--dash-text-muted);">🎤 ${escapeHtml(item.singer || 'Artist')} • 📁 ${escapeHtml(item.categoryName || 'Music')}</div>
              </div>
              <span style="font-size:0.75rem;color:var(--dash-emerald);font-weight:700;">✅ Approved</span>
            </div>
          `).join('');
          return;
        }
      }
    } catch (e) {}

    container.innerHTML = `<p style="color:var(--dash-text-muted);font-size:0.85rem;">Recent additions will appear here automatically.</p>`;
  }

  /* =========================================================
     8. SETTINGS & GITHUB PAT CONFIGURATION
     ========================================================= */
  function initSettingsSection() {
    const tokenInput = document.getElementById('settingsGhTokenInput');
    const eyeBtn = document.getElementById('settingsToggleTokenVis');
    const saveTokenBtn = document.getElementById('settingsSaveTokenBtn');
    const clearTokenBtn = document.getElementById('settingsClearTokenBtn');
    const testTokenBtn = document.getElementById('btnTestGithubConnection');

    // Populate existing token
    const savedToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
    if (tokenInput && savedToken) {
      tokenInput.value = savedToken;
    }

    if (eyeBtn && tokenInput) {
      eyeBtn.addEventListener('click', () => {
        tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
      });
    }

    if (saveTokenBtn && tokenInput) {
      saveTokenBtn.addEventListener('click', () => {
        const clean = (tokenInput.value || '').trim();
        if (!clean) {
          showToast('error', 'Please enter a GitHub Personal Access Token.');
          return;
        }
        localStorage.setItem('playx_token', clean);
        localStorage.setItem('playx_github_token', clean);
        showToast('success', '✅ GitHub PAT saved in browser storage.');
        checkSyncStatus();
      });
    }

    if (clearTokenBtn && tokenInput) {
      clearTokenBtn.addEventListener('click', () => {
        localStorage.removeItem('playx_token');
        localStorage.removeItem('playx_github_token');
        tokenInput.value = '';
        showToast('info', 'GitHub PAT cleared.');
        checkSyncStatus();
      });
    }

    if (testTokenBtn) {
      testTokenBtn.addEventListener('click', async () => {
        const t = (tokenInput?.value || '').trim();
        if (!t) {
          showToast('error', 'Enter a token before testing connection.');
          return;
        }
        testTokenBtn.disabled = true;
        testTokenBtn.textContent = 'Testing connection...';
        try {
          const authHeader = t.startsWith('github_pat_') ? `Bearer ${t}` : `token ${t}`;
          const res = await fetch('https://api.github.com/user', { headers: { 'Authorization': authHeader } });
          if (res.ok) {
            const u = await res.json();
            showToast('success', `✅ Authenticated as GitHub user: ${u.login}`);
          } else {
            showToast('error', `❌ GitHub token check failed (${res.status} Bad Credentials).`);
          }
        } catch (e) {
          showToast('error', `Network error: ${e.message}`);
        } finally {
          testTokenBtn.disabled = false;
          testTokenBtn.textContent = '📡 Test GitHub Token Connection';
        }
      });
    }

    // Backend URL settings
    const apiInput = document.getElementById('settingsApiBaseInput');
    const saveApiBtn = document.getElementById('settingsSaveApiBaseBtn');
    const resetApiBtn = document.getElementById('settingsResetApiBaseBtn');

    if (apiInput) {
      apiInput.value = localStorage.getItem('playx_backend_url') || getApiBase();
    }

    if (saveApiBtn && apiInput) {
      saveApiBtn.addEventListener('click', () => {
        const val = (apiInput.value || '').trim().replace(/\/$/, '');
        if (val) {
          localStorage.setItem('playx_backend_url', val);
          showToast('success', `Backend URL set to: ${val}`);
        }
      });
    }

    if (resetApiBtn && apiInput) {
      resetApiBtn.addEventListener('click', () => {
        localStorage.removeItem('playx_backend_url');
        apiInput.value = getApiBase();
        showToast('info', 'Reset backend URL to default.');
      });
    }
  }

  async function checkSyncStatus() {
    const pill = document.getElementById('dashSyncStatusPill');
    const text = document.getElementById('dashSyncStatusText');
    const dot = pill?.querySelector('.sync-dot');

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/sync-status`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.server === 'active') {
          if (text) text.textContent = 'Server & Git Connected';
          if (dot) { dot.className = 'sync-dot green'; }
          return;
        }
      }
    } catch (e) {}

    const hasToken = Boolean(localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token'));
    if (text) text.textContent = hasToken ? 'GitHub Direct Push' : 'Standalone / No Token';
    if (dot) { dot.className = hasToken ? 'sync-dot amber' : 'sync-dot'; }
  }

  /* =========================================================
     9. GITHUB REST API DIRECT COMMIT HELPERS
     ========================================================= */
  async function updateSongOnGitHubDirect(categoryKey, songId, updates, token) {
    const cat = CATEGORIES.find(c => c.id === categoryKey);
    if (!cat) throw new Error('Category not found');

    const repo = 'alok706175/PlayX';
    const branch = 'main';
    const filePath = cat.file;
    const authHeader = token.startsWith('github_pat_') ? `Bearer ${token}` : `token ${token}`;

    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&_nocache=${Date.now()}`;
    const getRes = await fetch(url, { headers: { 'Authorization': authHeader } });
    if (!getRes.ok) throw new Error(`GitHub fetch failed (${getRes.status})`);

    const meta = await getRes.json();
    const songs = JSON.parse(decodeUtf8Base64(meta.content));
    const idx = songs.findIndex(s => String(s.id) === String(songId) || s.videoId === String(songId));
    if (idx === -1) throw new Error(`Song ID ${songId} not found in repository.`);

    if (updates.name) {
      songs[idx].name = updates.name.trim();
      songs[idx].nameEn = updates.name.trim();
    }
    if (updates.singer) {
      songs[idx].singer = updates.singer.trim();
      songs[idx].singerEn = updates.singer.trim();
    }
    if (updates.tag) {
      songs[idx].tag = updates.tag.trim();
    }

    const updatedContent = JSON.stringify(songs, null, 2) + '\n';
    const commitMsg = `Update '${songs[idx].name}' in ${cat.name} playlist [PlayX Admin Dashboard]`;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMsg,
        content: encodeUtf8Base64(updatedContent),
        sha: meta.sha,
        branch: branch
      })
    });

    if (!putRes.ok) throw new Error(`GitHub Commit failed (${putRes.status})`);

    // If Hindi, also keep hindi_songs_data.js in sync
    if (categoryKey === 'hindi') {
      try {
        const bundlePath = 'hindi-songs/hindi_songs_data.js';
        let bundleSha = null;
        try {
          const bGet = await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}?ref=${branch}&_nocache=${Date.now()}`, {
            headers: { 'Authorization': authHeader }
          });
          if (bGet.ok) bundleSha = (await bGet.json()).sha;
        } catch (e) {}

        const bundleStr = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(songs, null, 2) + ';\n';
        await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}`, {
          method: 'PUT',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Sync hindi_songs_data.js bundle after updating '${songs[idx].name}'`,
            content: encodeUtf8Base64(bundleStr),
            sha: bundleSha,
            branch: branch
          })
        });
      } catch (e) {}
    }
  }

  async function deleteSongOnGitHubDirect(categoryKey, songId, token) {
    const cat = CATEGORIES.find(c => c.id === categoryKey);
    if (!cat) throw new Error('Category not found');

    const repo = 'alok706175/PlayX';
    const branch = 'main';
    const filePath = cat.file;
    const authHeader = token.startsWith('github_pat_') ? `Bearer ${token}` : `token ${token}`;

    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&_nocache=${Date.now()}`;
    const getRes = await fetch(url, { headers: { 'Authorization': authHeader } });
    if (!getRes.ok) throw new Error(`GitHub fetch failed (${getRes.status})`);

    const meta = await getRes.json();
    const songs = JSON.parse(decodeUtf8Base64(meta.content));
    const idx = songs.findIndex(s => String(s.id) === String(songId) || s.videoId === String(songId));
    if (idx === -1) throw new Error(`Song ID ${songId} not found in repository.`);

    const [deleted] = songs.splice(idx, 1);
    const updatedContent = JSON.stringify(songs, null, 2) + '\n';
    const commitMsg = `Delete '${deleted.name || 'Song'}' from ${cat.name} playlist [PlayX Admin Dashboard]`;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMsg,
        content: encodeUtf8Base64(updatedContent),
        sha: meta.sha,
        branch: branch
      })
    });

    if (!putRes.ok) throw new Error(`GitHub Commit failed (${putRes.status})`);

    if (categoryKey === 'hindi') {
      try {
        const bundlePath = 'hindi-songs/hindi_songs_data.js';
        let bundleSha = null;
        try {
          const bGet = await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}?ref=${branch}&_nocache=${Date.now()}`, {
            headers: { 'Authorization': authHeader }
          });
          if (bGet.ok) bundleSha = (await bGet.json()).sha;
        } catch (e) {}

        const bundleStr = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(songs, null, 2) + ';\n';
        await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}`, {
          method: 'PUT',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Sync hindi_songs_data.js bundle after deleting '${deleted.name || 'Song'}'`,
            content: encodeUtf8Base64(bundleStr),
            sha: bundleSha,
            branch: branch
          })
        });
      } catch (e) {}
    }
  }

  async function importSongOnGitHubDirect(categoryKey, songData, token) {
    const cat = CATEGORIES.find(c => c.id === categoryKey);
    if (!cat) throw new Error('Category not found');

    const repo = 'alok706175/PlayX';
    const branch = 'main';
    const filePath = cat.file;
    const authHeader = token.startsWith('github_pat_') ? `Bearer ${token}` : `token ${token}`;

    const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}&_nocache=${Date.now()}`;
    const getRes = await fetch(url, { headers: { 'Authorization': authHeader } });
    if (!getRes.ok) throw new Error(`GitHub fetch failed (${getRes.status})`);

    const meta = await getRes.json();
    const songs = JSON.parse(decodeUtf8Base64(meta.content));

    // Duplicate check
    if (songs.some(s => s.videoId === songData.videoId)) {
      throw new Error(`Duplicate Song: Video ${songData.videoId} already exists in ${cat.name}.`);
    }

    let maxId = 0;
    songs.forEach(s => {
      const nid = parseInt(s.id, 10);
      if (!isNaN(nid) && nid > maxId) maxId = nid;
    });

    const newRecord = {
      id: maxId + 1,
      name: songData.title,
      nameEn: songData.titleEn || songData.title,
      singer: songData.singer,
      singerEn: songData.singerEn || songData.singer,
      category: categoryKey === 'hindi' ? (songData.subCategory || 'Romantic') : cat.name,
      tag: songData.tag || 'New Song',
      videoId: songData.videoId,
      youtubeId: songData.videoId,
      embedUrl: songData.embedUrl || `https://www.youtube.com/embed/${songData.videoId}`,
      originalUrl: songData.originalUrl || `https://www.youtube.com/watch?v=${songData.videoId}`,
      duration: songData.duration || '03:45',
      thumbnail: songData.thumbnail || `https://i.ytimg.com/vi/${songData.videoId}/hqdefault.jpg`,
      addedAt: new Date().toISOString(),
      status: 'approved',
      source: 'youtube'
    };

    songs.push(newRecord);

    const updatedContent = JSON.stringify(songs, null, 2) + '\n';
    const commitMsg = `Add '${newRecord.name}' to ${cat.name} playlist [PlayX Admin Dashboard]`;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMsg,
        content: encodeUtf8Base64(updatedContent),
        sha: meta.sha,
        branch: branch
      })
    });

    if (!putRes.ok) throw new Error(`GitHub Commit failed (${putRes.status})`);

    if (categoryKey === 'hindi') {
      try {
        const bundlePath = 'hindi-songs/hindi_songs_data.js';
        let bundleSha = null;
        try {
          const bGet = await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}?ref=${branch}&_nocache=${Date.now()}`, {
            headers: { 'Authorization': authHeader }
          });
          if (bGet.ok) bundleSha = (await bGet.json()).sha;
        } catch (e) {}

        const bundleStr = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(songs, null, 2) + ';\n';
        await fetch(`https://api.github.com/repos/${repo}/contents/${bundlePath}`, {
          method: 'PUT',
          headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `Sync hindi_songs_data.js bundle after adding '${newRecord.name}'`,
            content: encodeUtf8Base64(bundleStr),
            sha: bundleSha,
            branch: branch
          })
        });
      } catch (e) {}
    }
  }

  function decodeUtf8Base64(b64) {
    const cleanB64 = (b64 || '').replace(/\s/g, '');
    const bin = atob(cleanB64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }

  function encodeUtf8Base64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  /* =========================================================
     10. UTILITIES & TOASTS
     ========================================================= */
  function showToast(type, message, durationMs = 4000) {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, durationMs);
  }

  function cleanVideoTitle(rawTitle) {
    let t = (rawTitle || '').trim();
    t = t.replace(/\s*[\(\[\{](?:official\s*(?:video|audio|music\s*video|lyric\s*video|hd|4k|song)?|full\s*song|video\s*song|lyrical|audio\s*song|remix|hd\s*video|original\s*video|4k\s*ultra\s*hd|special\s*edition)[)\]\}]/gi, '');
    t = t.replace(/\s*\|\s*(?:official\s*video|t-series|zee\s*music|sony\s*music|tips\s*official|yrf|speed\s*records|wave\s*music).*/gi, '');
    return t.trim() || rawTitle;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

})();
