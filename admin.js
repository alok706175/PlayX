/**
 * PlayX Dedicated Admin Dashboard Engine (v2.0)
 * 4-Feature Navigation Flow:
 * Admin Dashboard -> Select Feature (4 Cards) -> Select Category -> Select Song / Add Song Form
 * 
 * Features:
 * 1. Add Song - Add a new song with metadata and category tagging
 * 2. Delete Song - Browse playlists by category and delete songs with confirmation
 * 3. Edit Singer Name - Update and correct artist / singer names
 * 4. Edit Song Name - Update and refine song titles
 */

(function () {
  'use strict';

  // Master Categories Fallback Definition (Used when backend API is offline or static)
  const DEFAULT_CATEGORIES = [
    { id: 'hindi', name: 'Hindi Songs', hindiName: 'हिंदी सुपरहिट बॉलीवुड गीत', icon: '🎵', file: 'hindi-songs/hindi_songs.json', pageUrl: 'hindi-songs/hindi-songs.html', defaultTag: 'Bollywood Hits' },
    { id: 'bhojpuri', name: 'Bhojpuri Songs', hindiName: 'भोजपुरी देसी हिट्स', icon: '💃', file: 'bhojpuri-songs/bhojpuri_songs.json', pageUrl: 'bhojpuri-songs/bhojpuri-songs.html', defaultTag: 'Desi Hits' },
    { id: 'chhath', name: 'Chhath Puja Songs', hindiName: 'छठ पूजा महापर्व गीत', icon: '🌅', file: 'chhath-puja/youtube_songs.json', pageUrl: 'chhath-puja/chhath-puja.html', defaultTag: 'Chhath Mahaparv' },
    { id: 'saawan', name: 'Saawan Songs', hindiName: 'सावन शिव भजन व बोल बम', icon: '🔱', file: 'saawan-songs/saawan_songs.json', pageUrl: 'saawan-songs/saawan-songs.html', defaultTag: 'Shiv Bhajan' },
    { id: 'durga', name: 'Durga Puja Songs', hindiName: 'दुर्गा पूजा व नवरात्रि भजन', icon: '🪔', file: 'durga-puja-songs/durga_puja_songs.json', pageUrl: 'durga-puja-songs/durga-puja-songs.html', defaultTag: 'Mata Bhajan' },
    { id: 'holi', name: 'Holi Songs', hindiName: 'होली फाग व रंग गुलाल', icon: '🎨', file: 'holi-songs/holi_songs.json', pageUrl: 'holi-songs/holi-songs.html', defaultTag: 'Fagun Geet' },
    { id: 'haryanvi', name: 'Haryanvi Songs', hindiName: 'हरियाणवी रागनी व डीजे हिट्स', icon: '🌾', file: 'haryanvi-songs/haryanvi_songs.json', pageUrl: 'haryanvi-songs/haryanvi-songs.html', defaultTag: 'Haryanvi Ragni' },
    { id: 'punjabi', name: 'Punjabi Songs', hindiName: 'पंजाबी बीट्स व भांगड़ा', icon: '🥁', file: 'punjabi-songs/punjabi_songs.json', pageUrl: 'punjabi-songs/punjabi-songs.html', defaultTag: 'Punjabi Beats' }
  ];

  // Exact category icons & emblems matching the homepage cards
  const CATEGORY_ICON_CONFIG = {
    hindi: {
      html: '<img src="hindi-songs/images/hindi_song_icon.png" alt="Superhit Hindi Music" class="cat-card-icon-img" width="38" height="38" style="object-fit: cover; border-radius: 6px;">',
      bg: 'linear-gradient(135deg, #0d1033, #1f144d)',
      border: 'rgba(236, 72, 153, 0.45)',
      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
    },
    haryanvi: {
      html: '<img src="haryanvi-songs/images/haryanvi_logo.svg" alt="Haryanvi Superhit Music" class="cat-card-icon-img" width="38" height="38" style="object-fit: contain;">',
      bg: '#09091f',
      border: 'rgba(236, 72, 153, 0.45)',
      boxShadow: '0 4px 14px rgba(236, 72, 153, 0.35)'
    },
    punjabi: {
      html: '<img src="punjabi-songs/images/punjabi_logo.png" alt="Punjabi Superhit Music" class="cat-card-icon-img" width="34" height="34" style="border-radius: 50%; object-fit: cover;">',
      bg: '#09091f',
      border: 'rgba(168, 85, 247, 0.45)',
      boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)'
    },
    durga: {
      html: '<img src="durga-puja-songs/images/durga_puja_logo.png" alt="Durga Puja & Navratri" class="cat-card-icon-img" width="38" height="38" style="object-fit: contain;">',
      bg: 'linear-gradient(135deg, #e11d48, #fbbf24)',
      border: 'rgba(225, 29, 72, 0.45)',
      boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
    },
    saawan: {
      html: '<img src="saawan-songs/images/trishul_damru.svg" alt="Trishul & Damru" class="cat-card-icon-img" width="30" height="38" style="object-fit: contain;">',
      bg: 'linear-gradient(135deg, #0284c7, #06b6d4)',
      border: 'rgba(6, 182, 212, 0.45)',
      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
    },
    chhath: {
      html: '<span class="cat-card-icon-emoji" style="font-size: 1.85rem; line-height: 1;">🌅</span>',
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      border: 'rgba(245, 158, 11, 0.45)',
      boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)'
    },
    holi: {
      html: '<img src="holi-songs/images/holi_logo.svg" alt="Holi Music" class="cat-card-icon-img" width="38" height="38" style="object-fit: contain;">',
      bg: '#ffffff',
      border: 'rgba(244, 63, 94, 0.45)',
      boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'
    },
    bhojpuri: {
      html: '<img src="bhojpuri-songs/images/bhojpuri_logo.png" alt="Bhojpuri Superhit Music" class="cat-card-icon-img" width="38" height="38" style="object-fit: contain;">',
      bg: '#ffffff',
      border: 'rgba(239, 68, 68, 0.45)',
      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
    }
  };

  // API Base Resolution
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

  // Dashboard Navigation State
  let activeFeature = 'add-song'; // 'add-song' | 'delete-song' | 'edit-singer' | 'edit-song-name'
  let activeCategory = null;     // category object currently selected
  let dynamicCategories = [];    // dynamically fetched categories with live counts
  let cachedCategorySongs = [];  // songs belonging to activeCategory
  let selectedSongForAction = null; // song targeted for modal edit or delete

  /* =========================================================
     1. INITIALIZATION & AUTHENTICATION GATE
     ========================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initAuthGate();
    initThemeToggle();
    initSettingsModal();
    initNavigationListeners();
    initSongListControls();
    initAddSongSection();
    initActionModals();

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
    const gate = document.getElementById('adminLoginGate');
    const dash = document.getElementById('adminDashboardLayout');
    if (gate) gate.style.display = 'flex';
    if (dash) dash.style.display = 'none';
  }

  function unlockDashboard() {
    const gate = document.getElementById('adminLoginGate');
    const dash = document.getElementById('adminDashboardLayout');
    if (gate) gate.style.display = 'none';
    if (dash) dash.style.display = 'flex';

    // Update admin profile name
    const userName = localStorage.getItem('playx_admin_user') || 'Deepak Singh Rajput';
    const profileEl = document.getElementById('dashAdminName');
    if (profileEl) profileEl.textContent = userName;

    // Load categories and sync status
    loadCategoriesDynamic();
    checkSyncStatus();
    switchView('viewDashboardMain');
  }

  function initAuthGate() {
    const form = document.getElementById('adminGateLoginForm');
    const pwdInput = document.getElementById('gateAdminPassword');
    const eyeBtn = document.getElementById('gateTogglePwdBtn');
    const msgEl = document.getElementById('gateLoginMsg');

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

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pwd = (pwdInput.value || '').trim();
        if (!pwd) {
          showGateMsg('error', 'Please enter your admin password.');
          return;
        }

        const submitBtn = document.getElementById('gateSubmitBtn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span>Verifying credentials...</span>';
        }

        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.token) {
              localStorage.setItem('playx_admin_logged_in', 'true');
              localStorage.setItem('playx_admin_token', data.token);
              if (data.admin) {
                localStorage.setItem('playx_admin_user', data.admin.name || 'Deepak Singh Rajput');
              }
              showGateMsg('success', 'Authentication successful! Loading dashboard...');
              setTimeout(() => unlockDashboard(), 400);
              return;
            }
          }
        } catch (netErr) {
          // If offline, check SHA-256 fallback
        }

        // SHA-256 fallback verification
        const hash = await sha256(pwd);
        if (hash === '2b43b4f697475f850e0569eefc8c1995ba07849c71a3980a37e192f146be4818' || pwd === 'PlayxAdmin@2026' || pwd === 'deepak@playx') {
          localStorage.setItem('playx_admin_logged_in', 'true');
          localStorage.setItem('playx_admin_user', 'Deepak Singh Rajput');
          showGateMsg('success', 'Verified! Loading dashboard...');
          setTimeout(() => unlockDashboard(), 400);
        } else {
          showGateMsg('error', 'Invalid admin password. Access denied.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
              <span>Unlock Admin Dashboard</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            `;
          }
        }
      });
    }

    const logoutBtn = document.getElementById('dashLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out of PlayX Admin Dashboard?')) {
          localStorage.removeItem('playx_admin_logged_in');
          localStorage.removeItem('playx_admin_token');
          lockDashboard();
          showToast('info', 'Logged out successfully.');
        }
      });
    }
  }

  function showGateMsg(type, msg) {
    const el = document.getElementById('gateLoginMsg');
    if (!el) return;
    el.className = `gate-msg ${type}`;
    el.textContent = msg;
    el.style.display = 'block';
  }

  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* =========================================================
     2. NAVIGATION & VIEW SWITCHING SYSTEM
     ========================================================= */
  function switchView(viewId) {
    document.querySelectorAll('.dash-view').forEach(v => {
      v.classList.remove('active');
      v.style.display = 'none';
    });

    const target = document.getElementById(viewId);
    if (target) {
      target.style.display = 'block';
      target.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initNavigationListeners() {
    // 1. The 4 Feature Cards on Main Dashboard
    const cardAdd = document.getElementById('cardFeatAddSong');
    const cardDelete = document.getElementById('cardFeatDeleteSong');
    const cardEditSinger = document.getElementById('cardFeatEditSinger');
    const cardEditSongName = document.getElementById('cardFeatEditSongName');

    if (cardAdd) {
      cardAdd.addEventListener('click', () => openFeatureCategorySelect('add-song'));
      cardAdd.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFeatureCategorySelect('add-song'); });
    }
    if (cardDelete) {
      cardDelete.addEventListener('click', () => openFeatureCategorySelect('delete-song'));
      cardDelete.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFeatureCategorySelect('delete-song'); });
    }
    if (cardEditSinger) {
      cardEditSinger.addEventListener('click', () => openFeatureCategorySelect('edit-singer'));
      cardEditSinger.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFeatureCategorySelect('edit-singer'); });
    }
    if (cardEditSongName) {
      cardEditSongName.addEventListener('click', () => openFeatureCategorySelect('edit-song-name'));
      cardEditSongName.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFeatureCategorySelect('edit-song-name'); });
    }

    // 2. Back to Dashboard Button from Category Select
    const btnBackToDash = document.getElementById('btnBackToDashboard');
    if (btnBackToDash) {
      btnBackToDash.addEventListener('click', () => {
        switchView('viewDashboardMain');
      });
    }

    // 3. Back to Categories from Song List
    const btnBackToCats = document.getElementById('btnBackToCategories');
    if (btnBackToCats) {
      btnBackToCats.addEventListener('click', () => {
        openFeatureCategorySelect(activeFeature);
      });
    }

    // 4. Back to Categories from Add Song
    const btnBackToCatsAdd = document.getElementById('btnBackToCategoriesFromAdd');
    if (btnBackToCatsAdd) {
      btnBackToCatsAdd.addEventListener('click', () => {
        openFeatureCategorySelect('add-song');
      });
    }
  }

  function openFeatureCategorySelect(featureKey) {
    activeFeature = featureKey;

    const badge = document.getElementById('catViewFeatureBadge');
    const title = document.getElementById('catViewTitle');
    const desc = document.getElementById('catViewSubtitle');

    if (badge && title && desc) {
      badge.className = 'feature-active-pill';
      if (featureKey === 'add-song') {
        badge.classList.add('feat-add');
        badge.textContent = '➕ Add Song';
        title.textContent = 'Add Song: Select a Music Category';
        desc.textContent = 'Choose the playlist category where you want to add a new song.';
      } else if (featureKey === 'delete-song') {
        badge.classList.add('feat-delete');
        badge.textContent = '🗑️ Delete Song';
        title.textContent = 'Delete Song: Select a Music Category';
        desc.textContent = 'Select a category to view and delete songs from that playlist.';
      } else if (featureKey === 'edit-singer') {
        badge.classList.add('feat-edit-singer');
        badge.textContent = '🎤 Edit Singer Name';
        title.textContent = 'Edit Singer: Select a Music Category';
        desc.textContent = 'Select a category to view songs and update their singer or artist names.';
      } else if (featureKey === 'edit-song-name') {
        badge.classList.add('feat-edit-title');
        badge.textContent = '✏️ Edit Song Name';
        title.textContent = 'Edit Song Name: Select a Music Category';
        desc.textContent = 'Select a category to view songs and update or rename their song titles.';
      }
    }

    renderCategoryCards();
    switchView('viewCategorySelect');
  }

  /* =========================================================
     3. DYNAMIC CATEGORY LOADING & RENDERING
     ========================================================= */
  async function loadCategoriesDynamic() {
    let loaded = [];

    // Strategy 1: Fetch from backend /api/categories
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/categories?_t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.categories) {
          loaded = Object.values(json.categories).map(cat => ({
            id: cat.id,
            name: cat.name,
            hindiName: cat.hindiName || '',
            file: cat.jsonFile,
            pageUrl: cat.pageUrl || '',
            icon: cat.icon || '🎵',
            count: typeof cat.songCount === 'number' ? cat.songCount : 0
          }));
        }
      }
    } catch (e) {
      // Backend offline or running statically
    }

    // Strategy 2: If backend returned empty, use DEFAULT_CATEGORIES and fetch JSON files
    if (loaded.length === 0) {
      loaded = DEFAULT_CATEGORIES.map(c => ({ ...c, count: 0 }));
      await Promise.allSettled(
        loaded.map(async (cat) => {
          try {
            const r = await fetch(`${cat.file}?_t=${Date.now()}`);
            if (r.ok) {
              const data = await r.json();
              if (Array.isArray(data)) cat.count = data.length;
            }
          } catch (err) {}
        })
      );
    }

    dynamicCategories = loaded;

    // Update Quick Stats Strip on Main Dashboard
    const totalSongs = dynamicCategories.reduce((acc, c) => acc + (c.count || 0), 0);
    const totalSongsBadge = document.getElementById('dashTotalSongsBadge');
    if (totalSongsBadge) {
      totalSongsBadge.textContent = `${totalSongs.toLocaleString()} Songs in Database`;
    }

    const totalCatsBadge = document.getElementById('dashTotalCatsBadge');
    if (totalCatsBadge) {
      totalCatsBadge.textContent = `${dynamicCategories.length} Active Playlists`;
    }

    // Re-render category cards if visible
    renderCategoryCards();
  }

  function renderCategoryCards() {
    const grid = document.getElementById('categoryCardsGrid');
    if (!grid) return;

    if (dynamicCategories.length === 0) {
      grid.innerHTML = `
        <div class="dash-loading-state">
          <div class="spinner-large"></div>
          <p>Loading playlist categories from database...</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = dynamicCategories.map(cat => {
      const countLabel = cat.count === 1 ? '1 Song' : `${cat.count} Songs`;
      const iconConfig = CATEGORY_ICON_CONFIG[cat.id] || {
        html: cat.icon || '🎵',
        bg: 'var(--dash-surface-hover)',
        border: 'var(--dash-border)',
        boxShadow: 'none'
      };

      return `
        <div class="category-card-item" data-cat-id="${cat.id}" role="button" tabindex="0" title="Manage ${escapeHtml(cat.name)}">
          <div class="cat-item-left">
            <div class="cat-item-icon-box" style="background: ${iconConfig.bg}; border: 1.5px solid ${iconConfig.border}; box-shadow: ${iconConfig.boxShadow};">
              ${iconConfig.html}
            </div>
            <div>
              <div class="cat-item-name">${escapeHtml(cat.name)}</div>
              <div class="cat-item-hindi">${escapeHtml(cat.hindiName)}</div>
            </div>
          </div>
          <div class="cat-item-right">
            <span class="cat-count-badge">${countLabel}</span>
            <span class="cat-arrow-icon">→</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click handlers to all category cards
    grid.querySelectorAll('.category-card-item').forEach(card => {
      const catId = card.getAttribute('data-cat-id');
      const catObj = dynamicCategories.find(c => c.id === catId);
      if (!catObj) return;

      const onSelect = () => handleCategorySelection(catObj);
      card.addEventListener('click', onSelect);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSelect(); });
    });
  }

  function handleCategorySelection(catObj) {
    activeCategory = catObj;

    // Navigation Rule: For Add Song, selecting a category should open the Add Song form directly.
    if (activeFeature === 'add-song') {
      openAddSongForm(catObj);
      return;
    }

    // For Delete Song, Edit Singer Name, and Edit Song Name: Open Song List page
    openSongListPage(catObj, activeFeature);
  }

  /* =========================================================
     4. FLOW: SONG LIST PAGE (Delete, Edit Singer, Edit Title)
     ========================================================= */
  async function openSongListPage(catObj, featureKey) {
    activeCategory = catObj;
    activeFeature = featureKey;

    const badge = document.getElementById('songListViewFeatureBadge');
    const title = document.getElementById('songListViewTitle');
    const desc = document.getElementById('songListViewSubtitle');
    const searchInput = document.getElementById('songListSearchInput');

    if (searchInput) searchInput.value = '';

    if (badge && title && desc) {
      badge.className = 'feature-active-pill';
      if (featureKey === 'delete-song') {
        badge.classList.add('feat-delete');
        badge.textContent = '🗑️ Delete Song';
        title.textContent = `Delete Songs from ${catObj.name}`;
        desc.textContent = `Select any song from ${catObj.name} to permanently remove it.`;
      } else if (featureKey === 'edit-singer') {
        badge.classList.add('feat-edit-singer');
        badge.textContent = '🎤 Edit Singer Name';
        title.textContent = `Edit Singer Names in ${catObj.name}`;
        desc.textContent = `Select a song below to update its singer / artist name.`;
      } else if (featureKey === 'edit-song-name') {
        badge.classList.add('feat-edit-title');
        badge.textContent = '✏️ Edit Song Name';
        title.textContent = `Edit Song Titles in ${catObj.name}`;
        desc.textContent = `Select a song below to update or correct its title.`;
      }
    }

    switchView('viewSongList');
    await loadCategorySongs(catObj.id);
  }

  async function loadCategorySongs(categoryKey) {
    const tableBody = document.getElementById('songListTableBody');
    const countBadge = document.getElementById('songListCountBadge');
    if (!tableBody) return;

    tableBody.innerHTML = `
      <div class="dash-loading-state">
        <div class="spinner-large"></div>
        <p>Loading songs from database...</p>
      </div>
    `;

    const catObj = dynamicCategories.find(c => c.id === categoryKey) || DEFAULT_CATEGORIES.find(c => c.id === categoryKey);
    if (!catObj) return;

    try {
      const res = await fetch(`${catObj.file}?_t=${Date.now()}`);
      if (!res.ok) throw new Error(`Could not load playlist file (${res.status})`);
      const data = await res.json();
      cachedCategorySongs = Array.isArray(data) ? data : [];

      // Update category count
      catObj.count = cachedCategorySongs.length;
      if (countBadge) {
        countBadge.textContent = `Showing all ${cachedCategorySongs.length} songs`;
      }

      renderSongsList(cachedCategorySongs);
    } catch (err) {
      tableBody.innerHTML = `
        <div class="dash-empty-state" style="color:var(--dash-danger);">
          <span>⚠️</span>
          <p>Failed to load songs: ${escapeHtml(err.message)}</p>
        </div>
      `;
    }
  }

  function renderSongsList(songsToRender) {
    const tableBody = document.getElementById('songListTableBody');
    const countBadge = document.getElementById('songListCountBadge');
    if (!tableBody) return;

    if (countBadge) {
      countBadge.textContent = `Showing ${songsToRender.length} of ${cachedCategorySongs.length} songs`;
    }

    if (songsToRender.length === 0) {
      tableBody.innerHTML = `
        <div class="dash-empty-state">
          <span>🔍</span>
          <p>No songs found matching your search.</p>
        </div>
      `;
      return;
    }

    tableBody.innerHTML = songsToRender.map(song => {
      const songId = song.id || song.videoId || 'unknown';
      const songTitle = song.name || song.title || 'Untitled Song';
      const singerName = song.singer || song.singerEn || 'Unknown Artist';
      const duration = song.duration || '--:--';
      const thumb = song.thumbnail || (song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 'images/playx_icon.png');
      const catName = activeCategory?.name || 'Playlist';

      // Action Button based on activeFeature
      let actionBtnHtml = '';
      if (activeFeature === 'delete-song') {
        actionBtnHtml = `
          <button type="button" class="btn-action-delete" data-song-id="${songId}">
            <span>🗑️</span> <span>Delete</span>
          </button>
        `;
      } else if (activeFeature === 'edit-singer') {
        actionBtnHtml = `
          <button type="button" class="btn-action-edit-singer" data-song-id="${songId}">
            <span>🎤</span> <span>Edit Singer</span>
          </button>
        `;
      } else if (activeFeature === 'edit-song-name') {
        actionBtnHtml = `
          <button type="button" class="btn-action-edit-title" data-song-id="${songId}">
            <span>✏️</span> <span>Edit Title</span>
          </button>
        `;
      }

      return `
        <div class="song-row-item" data-song-id="${songId}">
          <div>
            <img src="${escapeHtml(thumb)}" class="song-cover-thumb" alt="${escapeHtml(songTitle)}" loading="lazy" onerror="this.src='images/playx_icon.png'">
          </div>
          <div class="song-title-cell" title="${escapeHtml(songTitle)}">
            ${escapeHtml(songTitle)}
          </div>
          <div class="song-singer-cell" title="${escapeHtml(singerName)}">
            🎤 ${escapeHtml(singerName)}
          </div>
          <div class="cat-badge-cell">
            <span class="cat-mini-badge">${escapeHtml(catName)}</span>
          </div>
          <div class="duration-cell">
            ⏱️ ${escapeHtml(duration)}
          </div>
          <div class="row-actions-cell">
            ${actionBtnHtml}
          </div>
        </div>
      `;
    }).join('');

    // Attach Action Listeners
    if (activeFeature === 'delete-song') {
      tableBody.querySelectorAll('.btn-action-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.getAttribute('data-song-id');
          const song = cachedCategorySongs.find(s => String(s.id) === String(sid) || s.videoId === String(sid));
          if (song) openDeleteModal(song);
        });
      });
    } else if (activeFeature === 'edit-singer') {
      tableBody.querySelectorAll('.btn-action-edit-singer').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.getAttribute('data-song-id');
          const song = cachedCategorySongs.find(s => String(s.id) === String(sid) || s.videoId === String(sid));
          if (song) openEditSingerModal(song);
        });
      });
    } else if (activeFeature === 'edit-song-name') {
      tableBody.querySelectorAll('.btn-action-edit-title').forEach(btn => {
        btn.addEventListener('click', () => {
          const sid = btn.getAttribute('data-song-id');
          const song = cachedCategorySongs.find(s => String(s.id) === String(sid) || s.videoId === String(sid));
          if (song) openEditSongNameModal(song);
        });
      });
    }
  }

  function initSongListControls() {
    const searchInput = document.getElementById('songListSearchInput');
    const clearBtn = document.getElementById('btnSongListClearSearch');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = (searchInput.value || '').trim().toLowerCase();
        if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

        const filtered = cachedCategorySongs.filter(s => {
          if (!q) return true;
          const name = (s.name || s.title || '').toLowerCase();
          const singer = (s.singer || s.singerEn || '').toLowerCase();
          const id = String(s.id || s.videoId || '');
          return name.includes(q) || singer.includes(q) || id.includes(q);
        });
        renderSongsList(filtered);
      });
    }

    if (clearBtn && searchInput) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        renderSongsList(cachedCategorySongs);
      });
    }
  }

  /* =========================================================
     5. FLOW: ADD SONG PAGE (Direct Form after Category)
     ========================================================= */
  function openAddSongForm(catObj) {
    activeCategory = catObj;

    const titleEl = document.getElementById('addSongViewTitle');
    const subEl = document.getElementById('addSongViewSubtitle');
    const targetCatId = document.getElementById('addSongTargetCatId');
    const displayCat = document.getElementById('addDisplayCategory');
    const formMsg = document.getElementById('addSongFormMsg');

    if (titleEl) titleEl.textContent = `Add New Song to ${catObj.name}`;
    if (subEl) subEl.textContent = `Selected Playlist: ${catObj.name} (${catObj.hindiName})`;
    if (targetCatId) targetCatId.value = catObj.id;
    if (displayCat) displayCat.value = catObj.name;
    if (formMsg) formMsg.style.display = 'none';

    // Reset inputs
    const urlInput = document.getElementById('addSongUrlInput');
    const titleInput = document.getElementById('addInputSongTitle');
    const singerInput = document.getElementById('addInputSingerName');
    const durInput = document.getElementById('addInputDuration');
    const tagInput = document.getElementById('addInputTag');
    const vidInput = document.getElementById('addInputVideoUrl');
    const previewBox = document.getElementById('addSongPreviewBox');

    if (urlInput) urlInput.value = '';
    if (titleInput) titleInput.value = '';
    if (singerInput) singerInput.value = '';
    if (durInput) durInput.value = '';
    if (tagInput) tagInput.value = catObj.defaultTag || 'Hits';
    if (vidInput) vidInput.value = '';
    if (previewBox) previewBox.style.display = 'none';

    switchView('viewAddSong');
  }

  function initAddSongSection() {
    const urlInput = document.getElementById('addSongUrlInput');
    const clearBtn = document.getElementById('addSongClearBtn');
    const pasteBtn = document.getElementById('addSongPasteBtn');
    const analyzeBtn = document.getElementById('addSongAnalyzeBtn');
    const form = document.getElementById('formAddSongDetails');
    const cancelBtn = document.getElementById('btnCancelAddSong');

    const titleInput = document.getElementById('addInputSongTitle');
    const singerInput = document.getElementById('addInputSingerName');
    const durInput = document.getElementById('addInputDuration');
    const vidInput = document.getElementById('addInputVideoUrl');

    // Live Preview Binding
    const updatePreview = () => {
      const pBox = document.getElementById('addSongPreviewBox');
      const pTitle = document.getElementById('addSongPreviewTitle');
      const pSinger = document.getElementById('addSongPreviewSinger');
      const pCat = document.getElementById('addSongPreviewCat');
      const pDur = document.getElementById('addSongPreviewDur');
      const pThumb = document.getElementById('addSongPreviewThumb');

      const t = titleInput?.value.trim();
      const s = singerInput?.value.trim();
      if (t || s) {
        if (pBox) pBox.style.display = 'block';
        if (pTitle) pTitle.textContent = t || 'Song Title';
        if (pSinger) pSinger.textContent = s || 'Singer Name';
        if (pCat) pCat.textContent = activeCategory?.name || 'Playlist';
        if (pDur) pDur.textContent = durInput?.value.trim() || '--:--';

        // Extract video ID for thumbnail if available
        let vidId = '';
        const rawVid = vidInput?.value.trim() || urlInput?.value.trim() || '';
        if (window.PlayXUrlParser) {
          const parsed = window.PlayXUrlParser.parseYouTubeUrl(rawVid);
          if (parsed.valid) vidId = parsed.videoId;
        }
        if (!vidId && rawVid.length === 11) vidId = rawVid;

        if (pThumb) {
          pThumb.src = vidId ? `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg` : 'images/playx_icon.png';
        }
      }
    };

    if (titleInput) titleInput.addEventListener('input', updatePreview);
    if (singerInput) singerInput.addEventListener('input', updatePreview);
    if (durInput) durInput.addEventListener('input', updatePreview);
    if (vidInput) vidInput.addEventListener('input', updatePreview);

    if (clearBtn && urlInput) {
      clearBtn.addEventListener('click', () => {
        urlInput.value = '';
        urlInput.focus();
      });
    }

    if (pasteBtn && urlInput) {
      pasteBtn.addEventListener('click', async () => {
        try {
          if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            urlInput.value = text.trim();
            showToast('info', 'Pasted URL from clipboard.');
          }
        } catch (e) {
          urlInput.focus();
        }
      });
    }

    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', async () => {
        const rawUrl = (urlInput?.value || '').trim();
        if (!rawUrl) {
          showToast('error', 'Please paste a YouTube or YouTube Music link first.');
          return;
        }

        analyzeBtn.disabled = true;
        document.getElementById('analyzeIcon').textContent = '⏳';
        document.getElementById('analyzeText').textContent = 'Analyzing...';

        try {
          let videoId = '';
          if (window.PlayXUrlParser) {
            const parsed = window.PlayXUrlParser.parseYouTubeUrl(rawUrl);
            if (parsed.valid) videoId = parsed.videoId;
          }

          let fetchedTitle = '';
          let fetchedArtist = '';
          let fetchedDuration = '';

          // Try backend /api/parse-link
          try {
            const apiBase = getApiBase();
            const res = await fetch(`${apiBase}/api/parse-link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: rawUrl })
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.metadata) {
                fetchedTitle = data.metadata.title || '';
                fetchedArtist = data.metadata.artist || '';
                if (data.metadata.duration && data.metadata.duration !== '--:--') {
                  fetchedDuration = data.metadata.duration;
                }
                if (data.metadata.videoId) videoId = data.metadata.videoId;
              }
            }
          } catch (e) {}

          // Fallback to client oEmbed if title still empty
          if (!fetchedTitle && videoId) {
            try {
              const oeRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
              if (oeRes.ok) {
                const oe = await oeRes.json();
                if (oe && oe.title) {
                  fetchedTitle = cleanVideoTitle(oe.title);
                  fetchedArtist = oe.author_name || '';
                }
              }
            } catch (e) {}
          }

          // If duration was not found via API, attempt auto-detection from title
          if (!fetchedDuration) {
            const durationMatch = (fetchedTitle || rawUrl).match(/[([{\s](\d{1,2}:\d{2})[)\]}\s]/);
            if (durationMatch) {
              let d = durationMatch[1];
              if (d.length === 4) d = '0' + d;
              fetchedDuration = d;
            }
          }

          if (fetchedTitle && titleInput) titleInput.value = fetchedTitle;
          if (fetchedArtist && singerInput) singerInput.value = fetchedArtist;
          if (durInput) durInput.value = fetchedDuration || '';
          if (videoId && vidInput) vidInput.value = `https://www.youtube.com/watch?v=${videoId}`;

          updatePreview();
          showToast('success', 'YouTube metadata analyzed and populated!');
        } catch (err) {
          showToast('error', `Could not analyze link: ${err.message}`);
        } finally {
          analyzeBtn.disabled = false;
          document.getElementById('analyzeIcon').textContent = '⚡';
          document.getElementById('analyzeText').textContent = 'Analyze';
        }
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        openFeatureCategorySelect('add-song');
      });
    }

    // Form Submit: Save Song to Database
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const catId = activeCategory?.id;
        const title = (titleInput?.value || '').trim();
        const singer = (singerInput?.value || '').trim();
        const duration = (durInput?.value || '').trim() || '--:--';
        const tag = (document.getElementById('addInputTag')?.value || '').trim() || 'Hits';
        const rawVid = (vidInput?.value || urlInput?.value || '').trim();

        const formMsg = document.getElementById('addSongFormMsg');
        const saveBtn = document.getElementById('btnSaveNewSong');
        const saveIcon = document.getElementById('saveNewSongIcon');
        const saveText = document.getElementById('saveNewSongText');

        if (!title || !singer) {
          if (formMsg) {
            formMsg.className = 'form-alert-msg error';
            formMsg.textContent = 'Please provide both Song Name and Singer Name.';
            formMsg.style.display = 'block';
          }
          return;
        }

        // Parse Video ID
        let videoId = '';
        if (window.PlayXUrlParser) {
          const parsed = window.PlayXUrlParser.parseYouTubeUrl(rawVid);
          if (parsed.valid) videoId = parsed.videoId;
        }
        if (!videoId && rawVid.length === 11) videoId = rawVid;
        if (!videoId) {
          // Generate pseudo video ID for custom/local tracks if none provided
          videoId = 'playx_' + Date.now().toString(36);
        }

        const songRecord = {
          title: title,
          singer: singer,
          duration: duration,
          tag: tag,
          category: catId,
          videoId: videoId,
          url: rawVid || `https://www.youtube.com/watch?v=${videoId}`
        };

        saveBtn.disabled = true;
        saveIcon.textContent = '⏳';
        saveText.textContent = 'Saving to Database...';
        if (formMsg) formMsg.style.display = 'none';

        try {
          let savedSuccessfully = false;

          // Attempt 1: POST /api/import-song on backend
          try {
            const apiBase = getApiBase();
            const token = localStorage.getItem('playx_admin_token') || '';
            const res = await fetch(`${apiBase}/api/import-song`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                category: catId,
                title: title,
                titleEn: title,
                singer: singer,
                singerEn: singer,
                duration: duration,
                tag: tag,
                url: songRecord.url,
                videoId: videoId,
                password: localStorage.getItem('playx_admin_password') || 'deepak@playx'
              })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success) savedSuccessfully = true;
            }
          } catch (netErr) {}

          // Attempt 2: Direct GitHub commit fallback
          if (!savedSuccessfully) {
            const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
            if (ghToken) {
              await importSongOnGitHubDirect(catId, songRecord, ghToken);
              savedSuccessfully = true;
            }
          }

          if (savedSuccessfully) {
            showToast('success', `✅ '${title}' saved successfully to ${activeCategory.name}!`);
            if (formMsg) {
              formMsg.className = 'form-alert-msg success';
              formMsg.textContent = `Song '${title}' was successfully saved to the database.`;
              formMsg.style.display = 'block';
            }

            // Update local count
            activeCategory.count = (activeCategory.count || 0) + 1;
            loadCategoriesDynamic();

            setTimeout(() => {
              openSongListPage(activeCategory, 'edit-song-name');
            }, 1200);
          } else {
            throw new Error('Could not connect to backend server and no GitHub PAT was found in Settings.');
          }
        } catch (err) {
          if (formMsg) {
            formMsg.className = 'form-alert-msg error';
            formMsg.textContent = `Error saving song: ${err.message}`;
            formMsg.style.display = 'block';
          }
          showToast('error', `Failed to save song: ${err.message}`);
        } finally {
          saveBtn.disabled = false;
          saveIcon.textContent = '💾';
          saveText.textContent = 'Save Song to Database';
        }
      });
    }
  }

  /* =========================================================
     6. MODALS: EDIT SINGER, EDIT SONG NAME, DELETE CONFIRM
     ========================================================= */
  function initActionModals() {
    // 1. Edit Singer Modal
    const formSinger = document.getElementById('formEditSinger');
    const closeSingerBtn = document.getElementById('btnEditSingerClose');
    const cancelSingerBtn = document.getElementById('btnEditSingerCancel');

    const closeSinger = () => {
      document.getElementById('modalEditSinger').style.display = 'none';
    };
    if (closeSingerBtn) closeSingerBtn.addEventListener('click', closeSinger);
    if (cancelSingerBtn) cancelSingerBtn.addEventListener('click', closeSinger);

    if (formSinger) {
      formSinger.addEventListener('submit', async (e) => {
        e.preventDefault();
        const songId = document.getElementById('editSingerSongId')?.value;
        const newSinger = (document.getElementById('inputEditSingerValue')?.value || '').trim();
        const msgEl = document.getElementById('editSingerMsg');
        const saveBtn = document.getElementById('btnEditSingerSave');
        const saveIcon = document.getElementById('editSingerSaveIcon');
        const saveText = document.getElementById('editSingerSaveText');

        if (!newSinger) {
          if (msgEl) {
            msgEl.className = 'modal-alert-msg danger';
            msgEl.textContent = 'Please enter a valid singer/artist name.';
            msgEl.style.display = 'block';
          }
          return;
        }

        saveBtn.disabled = true;
        saveIcon.textContent = '⏳';
        saveText.textContent = 'Saving...';
        if (msgEl) msgEl.style.display = 'none';

        try {
          await executeUpdateSong({ singer: newSinger, singerEn: newSinger }, songId);

          // Update cached array
          const song = cachedCategorySongs.find(s => String(s.id) === String(songId) || s.videoId === String(songId));
          if (song) {
            song.singer = newSinger;
            song.singerEn = newSinger;
          }

          renderSongsList(cachedCategorySongs);
          closeSinger();
          showToast('success', `✅ Singer name updated to: ${newSinger}`);
        } catch (err) {
          if (msgEl) {
            msgEl.className = 'modal-alert-msg danger';
            msgEl.textContent = `Error: ${err.message}`;
            msgEl.style.display = 'block';
          }
          showToast('error', `Update failed: ${err.message}`);
        } finally {
          saveBtn.disabled = false;
          saveIcon.textContent = '💾';
          saveText.textContent = 'Save Singer Name';
        }
      });
    }

    // 2. Edit Song Name Modal
    const formTitle = document.getElementById('formEditSongName');
    const closeTitleBtn = document.getElementById('btnEditSongNameClose');
    const cancelTitleBtn = document.getElementById('btnEditSongNameCancel');

    const closeTitle = () => {
      document.getElementById('modalEditSongName').style.display = 'none';
    };
    if (closeTitleBtn) closeTitleBtn.addEventListener('click', closeTitle);
    if (cancelTitleBtn) cancelTitleBtn.addEventListener('click', closeTitle);

    if (formTitle) {
      formTitle.addEventListener('submit', async (e) => {
        e.preventDefault();
        const songId = document.getElementById('editSongNameSongId')?.value;
        const newTitle = (document.getElementById('inputEditSongTitleValue')?.value || '').trim();
        const msgEl = document.getElementById('editSongNameMsg');
        const saveBtn = document.getElementById('btnEditSongNameSave');
        const saveIcon = document.getElementById('editSongNameSaveIcon');
        const saveText = document.getElementById('editSongNameSaveText');

        if (!newTitle) {
          if (msgEl) {
            msgEl.className = 'modal-alert-msg danger';
            msgEl.textContent = 'Please enter a valid song title.';
            msgEl.style.display = 'block';
          }
          return;
        }

        saveBtn.disabled = true;
        saveIcon.textContent = '⏳';
        saveText.textContent = 'Saving...';
        if (msgEl) msgEl.style.display = 'none';

        try {
          await executeUpdateSong({ name: newTitle, nameEn: newTitle }, songId);

          // Update cached array
          const song = cachedCategorySongs.find(s => String(s.id) === String(songId) || s.videoId === String(songId));
          if (song) {
            song.name = newTitle;
            song.nameEn = newTitle;
          }

          renderSongsList(cachedCategorySongs);
          closeTitle();
          showToast('success', `✅ Song title updated to: ${newTitle}`);
        } catch (err) {
          if (msgEl) {
            msgEl.className = 'modal-alert-msg danger';
            msgEl.textContent = `Error: ${err.message}`;
            msgEl.style.display = 'block';
          }
          showToast('error', `Update failed: ${err.message}`);
        } finally {
          saveBtn.disabled = false;
          saveIcon.textContent = '💾';
          saveText.textContent = 'Save Song Name';
        }
      });
    }

    // 3. Delete Song Modal
    const closeDelBtn = document.getElementById('btnDeleteModalClose');
    const cancelDelBtn = document.getElementById('btnDeleteModalCancel');
    const confirmDelBtn = document.getElementById('btnDeleteModalConfirm');

    const closeDel = () => {
      document.getElementById('modalDeleteSong').style.display = 'none';
    };
    if (closeDelBtn) closeDelBtn.addEventListener('click', closeDel);
    if (cancelDelBtn) cancelDelBtn.addEventListener('click', closeDel);

    if (confirmDelBtn) {
      confirmDelBtn.addEventListener('click', async () => {
        if (!selectedSongForAction) return;

        const songId = selectedSongForAction.id || selectedSongForAction.videoId;
        const songName = selectedSongForAction.name || selectedSongForAction.title || 'Song';
        const catId = activeCategory?.id;

        const msgEl = document.getElementById('deleteModalMsg');
        const iconEl = document.getElementById('deleteConfirmIcon');
        const textEl = document.getElementById('deleteConfirmText');

        confirmDelBtn.disabled = true;
        iconEl.textContent = '⏳';
        textEl.textContent = 'Deleting...';
        if (msgEl) msgEl.style.display = 'none';

        try {
          let deleted = false;

          // Attempt 1: Backend /api/delete-song
          try {
            const apiBase = getApiBase();
            const token = localStorage.getItem('playx_admin_token') || '';
            const res = await fetch(`${apiBase}/api/delete-song`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                category: catId,
                songId: songId,
                password: localStorage.getItem('playx_admin_password') || 'deepak@playx'
              })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.success) deleted = true;
            }
          } catch (netErr) {}

          // Attempt 2: GitHub Direct Commit
          if (!deleted) {
            const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
            if (ghToken) {
              await deleteSongOnGitHubDirect(catId, songId, ghToken);
              deleted = true;
            }
          }

          if (deleted) {
            // Remove from cached array immediately
            const idx = cachedCategorySongs.findIndex(s => String(s.id) === String(songId) || s.videoId === String(songId));
            if (idx !== -1) cachedCategorySongs.splice(idx, 1);

            // Update category count
            if (activeCategory) {
              activeCategory.count = Math.max(0, (activeCategory.count || 1) - 1);
            }
            loadCategoriesDynamic();

            renderSongsList(cachedCategorySongs);
            closeDel();
            showToast('success', `🗑️ Successfully deleted '${songName}'.`);
          } else {
            throw new Error('Backend server is offline and no GitHub PAT was configured in Settings.');
          }
        } catch (err) {
          if (msgEl) {
            msgEl.className = 'modal-alert-msg danger';
            msgEl.textContent = `Deletion error: ${err.message}`;
            msgEl.style.display = 'block';
          }
          showToast('error', `Delete failed: ${err.message}`);
        } finally {
          confirmDelBtn.disabled = false;
          iconEl.textContent = '🗑️';
          textEl.textContent = 'Yes, Permanently Delete';
        }
      });
    }
  }

  function openEditSingerModal(song) {
    selectedSongForAction = song;
    const modal = document.getElementById('modalEditSinger');
    const songIdInput = document.getElementById('editSingerSongId');
    const catInput = document.getElementById('editSingerCategoryKey');
    const thumbImg = document.getElementById('editSingerThumb');
    const nameDisp = document.getElementById('editSingerSongNameDisplay');
    const catDisp = document.getElementById('editSingerCategoryDisplay');
    const valInput = document.getElementById('inputEditSingerValue');
    const msgEl = document.getElementById('editSingerMsg');

    if (songIdInput) songIdInput.value = song.id || song.videoId;
    if (catInput) catInput.value = activeCategory?.id || '';
    if (thumbImg) {
      thumbImg.src = song.thumbnail || (song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 'images/playx_icon.png');
    }
    if (nameDisp) nameDisp.textContent = song.name || song.title || 'Untitled Song';
    if (catDisp) catDisp.textContent = activeCategory?.name || 'Playlist';
    if (valInput) valInput.value = song.singer || song.singerEn || '';
    if (msgEl) msgEl.style.display = 'none';

    if (modal) modal.style.display = 'flex';
    if (valInput) valInput.focus();
  }

  function openEditSongNameModal(song) {
    selectedSongForAction = song;
    const modal = document.getElementById('modalEditSongName');
    const songIdInput = document.getElementById('editSongNameSongId');
    const catInput = document.getElementById('editSongNameCategoryKey');
    const thumbImg = document.getElementById('editSongNameThumb');
    const singerDisp = document.getElementById('editSongNameSingerDisplay');
    const catDisp = document.getElementById('editSongNameCategoryDisplay');
    const valInput = document.getElementById('inputEditSongTitleValue');
    const msgEl = document.getElementById('editSongNameMsg');

    if (songIdInput) songIdInput.value = song.id || song.videoId;
    if (catInput) catInput.value = activeCategory?.id || '';
    if (thumbImg) {
      thumbImg.src = song.thumbnail || (song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 'images/playx_icon.png');
    }
    if (singerDisp) singerDisp.textContent = `🎤 ${song.singer || song.singerEn || 'Unknown Artist'}`;
    if (catDisp) catDisp.textContent = activeCategory?.name || 'Playlist';
    if (valInput) valInput.value = song.name || song.title || '';
    if (msgEl) msgEl.style.display = 'none';

    if (modal) modal.style.display = 'flex';
    if (valInput) valInput.focus();
  }

  function openDeleteModal(song) {
    selectedSongForAction = song;
    const modal = document.getElementById('modalDeleteSong');
    const thumbImg = document.getElementById('deleteModalThumb');
    const nameDisp = document.getElementById('deleteModalSongName');
    const singerDisp = document.getElementById('deleteModalSongSinger');
    const catDisp = document.getElementById('deleteModalCategoryName');
    const msgEl = document.getElementById('deleteModalMsg');

    if (thumbImg) {
      thumbImg.src = song.thumbnail || (song.videoId ? `https://i.ytimg.com/vi/${song.videoId}/hqdefault.jpg` : 'images/playx_icon.png');
    }
    if (nameDisp) nameDisp.textContent = song.name || song.title || 'Untitled Song';
    if (singerDisp) singerDisp.textContent = `🎤 ${song.singer || song.singerEn || 'Unknown Artist'}`;
    if (catDisp) catDisp.textContent = activeCategory?.name || 'Playlist';
    if (msgEl) msgEl.style.display = 'none';

    if (modal) modal.style.display = 'flex';
  }

  async function executeUpdateSong(updates, songId) {
    const catId = activeCategory?.id;
    let updated = false;

    // Attempt 1: Backend /api/update-song
    try {
      const apiBase = getApiBase();
      const token = localStorage.getItem('playx_admin_token') || '';
      const res = await fetch(`${apiBase}/api/update-song`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          category: catId,
          id: songId,
          songId: songId,
          name: updates.name,
          nameEn: updates.nameEn,
          singer: updates.singer,
          singerEn: updates.singerEn,
          tag: updates.tag,
          password: localStorage.getItem('playx_admin_password') || 'deepak@playx'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) updated = true;
      }
    } catch (netErr) {}

    // Attempt 2: GitHub Direct Commit
    if (!updated) {
      const ghToken = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
      if (ghToken) {
        await updateSongOnGitHubDirect(catId, songId, updates, ghToken);
        updated = true;
      }
    }

    if (!updated) {
      throw new Error('Backend server is offline and no GitHub PAT was found in Settings.');
    }
  }

  /* =========================================================
     7. SETTINGS MODAL & GITHUB PAT CONFIGURATION
     ========================================================= */
  function initSettingsModal() {
    const settingsBtn = document.getElementById('btnDashSettings');
    const modal = document.getElementById('modalSettings');
    const closeBtn = document.getElementById('btnSettingsModalClose');
    const closeBottomBtn = document.getElementById('btnSettingsCloseBottom');

    const tokenInput = document.getElementById('settingsGhTokenInput');
    const eyeBtn = document.getElementById('settingsToggleTokenVis');
    const saveTokenBtn = document.getElementById('settingsSaveTokenBtn');
    const clearTokenBtn = document.getElementById('settingsClearTokenBtn');

    const apiInput = document.getElementById('settingsApiBaseInput');
    const saveApiBtn = document.getElementById('settingsSaveApiBaseBtn');
    const resetApiBtn = document.getElementById('settingsResetApiBaseBtn');

    const openSettings = () => {
      if (tokenInput) {
        tokenInput.value = localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token') || '';
      }
      if (apiInput) {
        apiInput.value = localStorage.getItem('playx_backend_url') || getApiBase();
      }
      if (modal) modal.style.display = 'flex';
    };

    const closeSettings = () => {
      if (modal) modal.style.display = 'none';
    };

    if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
    if (closeBtn) closeBtn.addEventListener('click', closeSettings);
    if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeSettings);

    if (eyeBtn && tokenInput) {
      eyeBtn.addEventListener('click', () => {
        tokenInput.type = tokenInput.type === 'password' ? 'text' : 'password';
      });
    }

    if (saveTokenBtn && tokenInput) {
      saveTokenBtn.addEventListener('click', () => {
        const t = (tokenInput.value || '').trim();
        if (!t) {
          showToast('error', 'Please enter a valid GitHub PAT.');
          return;
        }
        localStorage.setItem('playx_token', t);
        localStorage.setItem('playx_github_token', t);
        showToast('success', '✅ GitHub PAT saved in browser storage.');
        checkSyncStatus();
      });
    }

    if (clearTokenBtn && tokenInput) {
      clearTokenBtn.addEventListener('click', () => {
        localStorage.removeItem('playx_token');
        localStorage.removeItem('playx_github_token');
        tokenInput.value = '';
        showToast('info', 'GitHub PAT removed.');
        checkSyncStatus();
      });
    }

    if (saveApiBtn && apiInput) {
      saveApiBtn.addEventListener('click', () => {
        const u = (apiInput.value || '').trim().replace(/\/$/, '');
        if (u) {
          localStorage.setItem('playx_backend_url', u);
          showToast('success', `Backend URL set to: ${u}`);
          checkSyncStatus();
        }
      });
    }

    if (resetApiBtn && apiInput) {
      resetApiBtn.addEventListener('click', () => {
        localStorage.removeItem('playx_backend_url');
        apiInput.value = getApiBase();
        showToast('info', 'Backend URL reset to default.');
        checkSyncStatus();
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
          if (dot) dot.className = 'sync-dot green';
          return;
        }
      }
    } catch (e) {}

    const hasToken = Boolean(localStorage.getItem('playx_token') || localStorage.getItem('playx_github_token'));
    if (text) text.textContent = hasToken ? 'GitHub Direct Push' : 'Standalone / No Token';
    if (dot) dot.className = hasToken ? 'sync-dot amber' : 'sync-dot';
  }

  /* =========================================================
     8. GITHUB REST API DIRECT COMMIT HELPERS
     ========================================================= */
  async function updateSongOnGitHubDirect(categoryKey, songId, updates, token) {
    const cat = dynamicCategories.find(c => c.id === categoryKey) || DEFAULT_CATEGORIES.find(c => c.id === categoryKey);
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

    // Synchronize hindi_songs_data.js bundle if Hindi
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
    const cat = dynamicCategories.find(c => c.id === categoryKey) || DEFAULT_CATEGORIES.find(c => c.id === categoryKey);
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
    const cat = dynamicCategories.find(c => c.id === categoryKey) || DEFAULT_CATEGORIES.find(c => c.id === categoryKey);
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
    if (songData.videoId && songs.some(s => s.videoId === songData.videoId)) {
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
      category: categoryKey === 'hindi' ? 'Romantic' : cat.name,
      tag: songData.tag || 'New Song',
      videoId: songData.videoId,
      youtubeId: songData.videoId,
      embedUrl: `https://www.youtube.com/embed/${songData.videoId}`,
      originalUrl: songData.url || `https://www.youtube.com/watch?v=${songData.videoId}`,
      duration: songData.duration || '--:--',
      thumbnail: `https://i.ytimg.com/vi/${songData.videoId}/hqdefault.jpg`,
      addedAt: new Date().toISOString(),
      status: 'approved',
      source: 'admin'
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
     9. THEME & UTILITIES
     ========================================================= */
  function initThemeToggle() {
    const btn = document.getElementById('dashThemeToggleBtn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' || current === 'royal-sunset' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon(next);
    });

    const saved = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  }

  function updateThemeIcon(theme) {
    const sun = document.querySelector('.theme-icon-sun');
    const moon = document.querySelector('.theme-icon-moon');
    const btn = document.getElementById('dashThemeToggleBtn');
    if (sun && moon) {
      if (theme === 'light') {
        sun.style.display = 'block';
        moon.style.display = 'none';
        if (btn) {
          btn.title = 'Switch to Dark Mode';
          btn.setAttribute('aria-label', 'Switch to Dark Mode');
        }
      } else {
        sun.style.display = 'none';
        moon.style.display = 'block';
        if (btn) {
          btn.title = 'Switch to Light Mode';
          btn.setAttribute('aria-label', 'Switch to Light Mode');
        }
      }
    }
  }

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
