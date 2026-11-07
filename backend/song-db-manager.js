/**
 * PlayX Auto Added Songs - JSON Database & GitHub Storage Manager
 * 
 * Safely persists songs to the appropriate PlayX category JSON files.
 * Provides duplicate checking across all categories, concurrency mutex locks,
 * atomic file writes with .bak backups, strict schema consistency,
 * and automatic Git CLI / GitHub REST API commit integration.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const categoryDetector = require('./category-detector');

// Base directory is the workspace root (one level up from 'backend')
const PROJECT_ROOT = path.resolve(__dirname, '..');

// History log file for recently auto-added songs
const HISTORY_FILE = path.join(__dirname, 'auto_added_history.json');

// Concurrency: Per-category operation queues to serialize writes and eliminate race conditions
const categoryQueues = new Map();

/**
 * Concurrency Mutex: Serializes asynchronous read-modify-write operations
 * on the same category JSON database file to eliminate race conditions.
 * @param {string} categoryKey 
 * @param {() => Promise<any>} taskFn 
 * @returns {Promise<any>}
 */
function withCategoryLock(categoryKey, taskFn) {
  const currentQueue = categoryQueues.get(categoryKey) || Promise.resolve();
  const nextTask = currentQueue
    .catch(() => {}) // Prevent previous error from blocking future operations
    .then(() => taskFn());
  categoryQueues.set(categoryKey, nextTask);
  return nextTask;
}

/**
 * Resolves absolute file path for a given category JSON file
 * @param {string} categoryKey 
 * @returns {string}
 */
function getCategoryFilePath(categoryKey) {
  const cat = categoryDetector.CATEGORIES[categoryKey];
  if (!cat) {
    throw new Error(`Unknown category key "${categoryKey}".`);
  }
  return path.join(PROJECT_ROOT, cat.jsonFile);
}

/**
 * Safely reads and parses a JSON file
 * @param {string} filePath 
 * @returns {Array<object>}
 */
function readJsonSafe(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error(`Error reading JSON file at ${filePath}:`, err.message);
    return [];
  }
}

/**
 * Checks if a song video ID or URL already exists in any category database
 * @param {string} videoId 
 * @param {string} [originalUrl] 
 * @returns {{
 *   exists: boolean,
 *   foundInCategory?: string,
 *   foundInFile?: string,
 *   song?: object
 * }}
 */
function checkDuplicate(videoId, originalUrl = '', title = '', singer = '') {
  if (!videoId && !title) return { exists: false };

  const normTitle = title ? String(title).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  const normSinger = singer ? String(singer).toLowerCase().replace(/[^a-z0-9]/g, '') : '';

  for (const [catKey, cat] of Object.entries(categoryDetector.CATEGORIES)) {
    const filePath = path.join(PROJECT_ROOT, cat.jsonFile);
    const songs = readJsonSafe(filePath);

    for (const song of songs) {
      const matchId = videoId && ((song.videoId === videoId) || 
                      (song.youtubeId === videoId) ||
                      (song.id === `youtube_${videoId}`));

      const matchUrl = originalUrl && (song.originalUrl === originalUrl || song.embedUrl?.includes(videoId));

      if (matchId || matchUrl) {
        return {
          exists: true,
          foundInCategory: catKey,
          categoryName: cat.name,
          categoryHindi: cat.hindiName,
          foundInFile: cat.jsonFile,
          song
        };
      }

      // Title & Singer duplicate heuristic (Prevents adding the same song from different channels)
      if (normTitle && normTitle.length > 5 && normSinger && normSinger.length > 3) {
        const sTitle = String(song.name || song.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const sSinger = String(song.singer || song.artist || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (sTitle && sTitle === normTitle && (sSinger.includes(normSinger) || normSinger.includes(sSinger))) {
          return {
            exists: true,
            isFuzzyMatch: true,
            foundInCategory: catKey,
            categoryName: cat.name,
            categoryHindi: cat.hindiName,
            foundInFile: cat.jsonFile,
            song
          };
        }
      }
    }
  }

  return { exists: false };
}

/**
 * Synchronizes chhath-puja/songs.json with latest chhath-puja/youtube_songs.json
 * @param {Array<object>} songsList 
 * @returns {boolean}
 */
function syncChhathSongs(songsList) {
  try {
    const songsPath = path.join(PROJECT_ROOT, 'chhath-puja', 'songs.json');
    atomicWriteJson(songsPath, songsList);
    return true;
  } catch (err) {
    console.warn('Could not sync chhath-puja/songs.json:', err.message);
    return false;
  }
}

/**
 * Atomically writes data to file with validation, retry mechanism, and .bak backup
 * @param {string} targetPath 
 * @param {any} data 
 */
function atomicWriteJson(targetPath, data) {
  if (!Array.isArray(data)) {
    throw new Error(`Data validation error: atomicWriteJson expects an Array, received ${typeof data}`);
  }

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonStr = JSON.stringify(data, null, 2) + '\n';
  const tmpPath = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  const bakPath = `${targetPath}.bak`;

  // 1. Create .bak backup if target exists and is non-empty
  if (fs.existsSync(targetPath)) {
    try {
      const stats = fs.statSync(targetPath);
      if (stats.size > 0) {
        fs.copyFileSync(targetPath, bakPath);
      }
    } catch (e) {
      console.warn(`Could not create backup for ${targetPath}:`, e.message);
    }
  }

  // 2. Write to unique temporary file
  fs.writeFileSync(tmpPath, jsonStr, 'utf8');

  // 3. Atomic rename with Windows retry mechanism
  let renamed = false;
  let attempts = 0;
  while (!renamed && attempts < 5) {
    try {
      attempts++;
      fs.renameSync(tmpPath, targetPath);
      renamed = true;
    } catch (err) {
      if (attempts >= 5) {
        // Fallback: copyFileSync then remove tmp
        try {
          fs.copyFileSync(tmpPath, targetPath);
          fs.unlinkSync(tmpPath);
          renamed = true;
        } catch (copyErr) {
          throw new Error(`Atomic write failed after ${attempts} attempts: ${err.message} (copy fallback: ${copyErr.message})`);
        }
      } else {
        // Brief synchronous pause for momentary Windows file locks to release
        const waitTill = Date.now() + 25;
        while (Date.now() < waitTill) {}
      }
    }
  }
}

/**
 * Synchronizes hindi-songs/hindi_songs_data.js bundle with latest hindi_songs.json
 * @param {Array<object>} songsList 
 * @returns {boolean}
 */
function syncHindiBundle(songsList) {
  try {
    const dataJsPath = path.join(PROJECT_ROOT, 'hindi-songs', 'hindi_songs_data.js');
    const bundleContent = '/* PlayX Hindi Songs Dataset Bundle (Auto-Synchronized) */\nwindow.PLAYX_HINDI_SONGS_DATA = ' + JSON.stringify(songsList, null, 2) + ';\n';
    fs.writeFileSync(dataJsPath, bundleContent, 'utf8');
    return true;
  } catch (bundleErr) {
    console.warn('Could not sync hindi_songs_data.js bundle:', bundleErr.message);
    return false;
  }
}

/**
 * Checks parity between hindi_songs.json and hindi_songs_data.js
 * @returns {{ inSync: boolean, jsonCount?: number, jsCount?: number, error?: string }}
 */
function verifyHindiParity() {
  const jsonPath = path.join(PROJECT_ROOT, 'hindi-songs', 'hindi_songs.json');
  const jsPath = path.join(PROJECT_ROOT, 'hindi-songs', 'hindi_songs_data.js');
  const jsonSongs = readJsonSafe(jsonPath);
  if (!fs.existsSync(jsPath)) {
    return { inSync: false, jsonCount: jsonSongs.length, jsCount: 0 };
  }
  const rawJs = fs.readFileSync(jsPath, 'utf8');
  const match = rawJs.match(/window\.PLAYX_HINDI_SONGS_DATA\s*=\s*(\[[\s\S]*\]);/);
  if (!match) {
    return { inSync: false, error: 'Could not parse hindi_songs_data.js bundle' };
  }
  try {
    const jsSongs = JSON.parse(match[1]);
    const inSync = (jsonSongs.length === jsSongs.length) &&
      (jsonSongs.length === 0 || jsonSongs[0].id === jsSongs[0].id);
    return { inSync, jsonCount: jsonSongs.length, jsCount: jsSongs.length };
  } catch (e) {
    return { inSync: false, error: e.message };
  }
}

/**
 * Appends record to auto-added history
 * @param {object} songRecord 
 */
function recordHistory(songRecord) {
  try {
    const history = readJsonSafe(HISTORY_FILE);
    history.unshift(songRecord);
    // Keep last 100 entries
    if (history.length > 100) history.length = 100;
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2) + '\n', 'utf8');
  } catch (err) {
    console.warn('Could not record import history:', err.message);
  }
}

/**
 * Retrieves the recent history of auto-added songs
 * @returns {Array<object>}
 */
function getRecentAutoAddedSongs() {
  return readJsonSafe(HISTORY_FILE);
}

/**
 * Commits updated file to GitHub repository via GitHub REST API
 * @param {string} relativeFilePath 
 * @param {string} contentString 
 * @param {string} commitMessage 
 * @param {{ token: string, repo: string, branch: string }} githubConfig 
 * @returns {Promise<{ success: boolean, commitSha?: string, commitUrl?: string, error?: string }>}
 */
async function commitToGitHub(relativeFilePath, contentString, commitMessage, githubConfig) {
  const { token, repo, branch = 'main' } = githubConfig;
  if (!token || !repo) {
    return { success: false, error: 'GitHub token or repo not configured.' };
  }

  const normalizedPath = relativeFilePath.replace(/\\/g, '/');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'PlayX-AutoSongImporter',
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };

  // Step 1: Get existing file SHA if it exists
  let sha = null;
  try {
    const getRes = await makeHttpsRequest({
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${encodeURIComponent(normalizedPath)}?ref=${encodeURIComponent(branch)}`,
      method: 'GET',
      headers
    });
    if (getRes.statusCode === 200 && getRes.body?.sha) {
      sha = getRes.body.sha;
    }
  } catch (err) {
    // If 404, file is new
  }

  // Step 2: Put updated content
  const payload = {
    message: commitMessage,
    content: Buffer.from(contentString, 'utf8').toString('base64'),
    branch
  };
  if (sha) payload.sha = sha;

  try {
    const putRes = await makeHttpsRequest({
      hostname: 'api.github.com',
      path: `/repos/${repo}/contents/${encodeURIComponent(normalizedPath)}`,
      method: 'PUT',
      headers
    }, JSON.stringify(payload));

    if (putRes.statusCode >= 200 && putRes.statusCode < 300) {
      return {
        success: true,
        commitSha: putRes.body?.commit?.sha,
        commitUrl: putRes.body?.commit?.html_url
      };
    } else {
      return {
        success: false,
        error: `GitHub API error (${putRes.statusCode}): ${putRes.body?.message || JSON.stringify(putRes.body)}`
      };
    }
  } catch (err) {
    return {
      success: false,
      error: `GitHub network error: ${err.message}`
    };
  }
}

/**
 * Generic HTTPS request helper returning parsed body
 */
function makeHttpsRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(raw);
        } catch (e) {
          body = raw;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Executes a shell command as a Promise
 */
function execShellCommand(cmd, cwd) {
  return new Promise((resolve) => {
    exec(cmd, { cwd: cwd || PROJECT_ROOT, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          error: (stderr || error.message || '').trim(),
          stdout: (stdout || '').trim()
        });
      } else {
        resolve({
          success: true,
          stdout: (stdout || '').trim(),
          stderr: (stderr || '').trim()
        });
      }
    });
  });
}

/**
 * Detects and safely clears stale .git/index.lock if left over from interrupted git runs
 */
function clearStaleGitLock() {
  try {
    const lockPath = path.join(PROJECT_ROOT, '.git', 'index.lock');
    if (fs.existsSync(lockPath)) {
      const stats = fs.statSync(lockPath);
      // If older than 15 seconds, it is an abandoned stale lock
      if (Date.now() - stats.mtimeMs > 15000) {
        fs.unlinkSync(lockPath);
        console.log('🧹 [Git Clean] Removed stale .git/index.lock file.');
      }
    }
  } catch (err) {
    console.warn('[Git Clean] Notice checking .git/index.lock:', err.message);
  }
}

/**
 * Automatically syncs file changes to GitHub:
 * Strategy 1: Git CLI (Local auto-commit & push to origin/main)
 * Strategy 2: GitHub REST API (Fallback using PLAYX_TOKEN or GITHUB_TOKEN if configured)
 */
async function autoSyncToGitHub(relativeFilePath, songName, categoryName, action = 'add') {
  clearStaleGitLock();

  const safeSongName = (songName || 'Song').replace(/["`$\r\n]/g, "'");
  const commitMsg = action === 'delete'
    ? `Delete '${safeSongName}' from ${categoryName} playlist [PlayX Admin]`
    : action === 'update'
    ? `Update '${safeSongName}' in ${categoryName} playlist [PlayX Admin]`
    : `Add '${safeSongName}' to ${categoryName} playlist [PlayX Auto-Import]`;
  const normalizedPath = relativeFilePath.replace(/\\/g, '/');

  console.log(`\n🚀 [GitHub Auto-Sync] Syncing "${safeSongName}" (${action}) to GitHub (${normalizedPath})...`);

  // Strategy 1: Local Git CLI Push
  try {
    await execShellCommand(`git add "${normalizedPath}"`);
    if (action === 'add') {
      await execShellCommand(`git add "backend/auto_added_history.json"`);
    }
    if (normalizedPath.includes('hindi_songs.json')) {
      await execShellCommand(`git add "hindi-songs/hindi_songs_data.js"`);
    }
    if (normalizedPath.includes('youtube_songs.json')) {
      await execShellCommand(`git add "chhath-puja/songs.json"`);
    }

    const commitRes = await execShellCommand(`git commit -m "${commitMsg}"`);
    if (commitRes.success || commitRes.stdout.includes('nothing to commit')) {
      let pushRes = { success: false, error: 'origin check' };
      const remoteCheck = await execShellCommand('git remote');
      if (remoteCheck.success && remoteCheck.stdout.includes('origin')) {
        pushRes = await execShellCommand('git push origin main');
      }

      // If remote has new commits, pull with rebase and re-try push
      if (!pushRes.success && (pushRes.error.includes('fetch first') || pushRes.error.includes('non-fast-forward'))) {
        console.log(`🔄 [GitHub Auto-Sync] Remote is ahead, syncing via git pull --rebase...`);
        await execShellCommand(`git pull --rebase origin main`);
        pushRes = await execShellCommand(`git push origin main`);
      }

      if (pushRes.success) {
        console.log(`✅ [GitHub Auto-Sync] Successfully pushed to origin/main!`);
        return {
          success: true,
          committed: true,
          method: 'git-cli',
          repo: 'alok706175/PlayX',
          branch: 'main',
          commitMessage: commitMsg,
          message: 'Code and playlist automatically pushed to GitHub repository (origin/main)!'
        };
      } else {
        console.warn(`⚠️ [GitHub Auto-Sync] Git CLI push note: ${pushRes.error}`);
      }
    } else {
      console.warn(`⚠️ [GitHub Auto-Sync] Git commit note: ${commitRes.stdout || commitRes.error}`);
    }
  } catch (err) {
    console.warn(`⚠️ [GitHub Auto-Sync] Git CLI error: ${err.message}`);
  }

  // Strategy 2: GitHub REST API Fallback (when PLAYX_TOKEN or GITHUB_TOKEN is configured)
  const ghToken = process.env.PLAYX_TOKEN || process.env.GITHUB_TOKEN;
  const ghRepo = process.env.PLAYX_REPO || process.env.GITHUB_REPO || 'alok706175/PlayX';
  const ghBranch = process.env.PLAYX_BRANCH || process.env.GITHUB_BRANCH || 'main';

  if (ghToken) {
    try {
      console.log(`🐙 [GitHub Auto-Sync] Attempting GitHub REST API commit with PLAYX_TOKEN / GITHUB_TOKEN...`);
      const targetPath = path.join(PROJECT_ROOT, relativeFilePath);
      const contentStr = fs.readFileSync(targetPath, 'utf8');
      const apiRes = await commitToGitHub(relativeFilePath, contentStr, commitMsg, {
        token: ghToken,
        repo: ghRepo,
        branch: ghBranch
      });

      if (apiRes.success) {
        console.log(`✅ [GitHub Auto-Sync] Successfully committed via GitHub REST API!`);

        // Dual-bundle sync for Hindi Songs via REST API
        if (normalizedPath.includes('hindi_songs.json')) {
          try {
            const bundleRel = 'hindi-songs/hindi_songs_data.js';
            const bundleContent = fs.readFileSync(path.join(PROJECT_ROOT, bundleRel), 'utf8');
            await commitToGitHub(bundleRel, bundleContent, `Sync hindi_songs_data.js bundle [PlayX Auto-Sync]`, {
              token: ghToken,
              repo: ghRepo,
              branch: ghBranch
            });
            console.log(`✅ [GitHub Auto-Sync] Synced hindi_songs_data.js via GitHub REST API!`);
          } catch (bErr) {
            console.warn(`⚠️ [GitHub Auto-Sync] REST API bundle sync notice: ${bErr.message}`);
          }
        }

        // Dual-dataset sync for Chhath Puja Songs via REST API
        if (normalizedPath.includes('youtube_songs.json')) {
          try {
            const chhathSongsRel = 'chhath-puja/songs.json';
            const chhathContent = fs.readFileSync(path.join(PROJECT_ROOT, chhathSongsRel), 'utf8');
            await commitToGitHub(chhathSongsRel, chhathContent, `Sync chhath-puja/songs.json [PlayX Auto-Sync]`, {
              token: ghToken,
              repo: ghRepo,
              branch: ghBranch
            });
            console.log(`✅ [GitHub Auto-Sync] Synced chhath-puja/songs.json via GitHub REST API!`);
          } catch (cErr) {
            console.warn(`⚠️ [GitHub Auto-Sync] REST API chhath sync notice: ${cErr.message}`);
          }
        }

        return {
          success: true,
          committed: true,
          method: 'github-api',
          repo: ghRepo,
          branch: ghBranch,
          sha: apiRes.commitSha,
          url: apiRes.commitUrl,
          message: 'Code and playlist committed directly to GitHub via API!'
        };
      } else {
        console.warn(`⚠️ [GitHub Auto-Sync] GitHub API error: ${apiRes.error}`);
      }
    } catch (apiErr) {
      console.warn(`⚠️ [GitHub Auto-Sync] API fallback exception: ${apiErr.message}`);
    }
  }

  return {
    success: false,
    committed: false,
    method: 'none',
    message: 'Local JSON file updated. (GitHub push was not completed; code can also be pushed manually).'
  };
}

/**
 * Sanitizes user input string against HTML injection and control characters
 */
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>\r\n]/g, '').trim().slice(0, 300);
}

/**
 * Formats a song record with a strict, uniform schema across all PlayX categories.
 * Guarantees that every song object possesses all required playback properties.
 * @param {string} categoryKey 
 * @param {number} nextId 
 * @param {object} inputData 
 * @returns {object} Formatted song object
 */
function formatSongRecord(categoryKey, nextId, inputData) {
  const cat = categoryDetector.CATEGORIES[categoryKey];
  const videoId = String(inputData.videoId || '').trim();
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const nowIso = new Date().toISOString();

  const title = sanitizeText(inputData.title || inputData.cleanTitle || 'Untitled Song');
  const titleEn = sanitizeText(inputData.titleEn || inputData.title || title);
  const singer = sanitizeText(inputData.singer || inputData.channelTitle || 'Artist');
  const singerEn = sanitizeText(inputData.singerEn || singer);
  const duration = sanitizeText(inputData.duration && inputData.duration !== '--:--' ? inputData.duration : (inputData.duration || '--:--'));
  const thumbnail = inputData.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const tag = sanitizeText(inputData.tag || cat?.defaultTag || 'Hits');
  const categoryDisplay = cat?.name || 'PlayX Music';

  const validHindiCats = ['Romantic', '90s Classics', 'Soulful Melodies', 'Dance & Beats'];
  const hindiCategory = validHindiCats.includes(inputData.subCategory) ? inputData.subCategory : 'Romantic';

  // Uniform standard schema across all PlayX playlists
  return {
    id: parseInt(nextId, 10),
    name: title,
    nameEn: titleEn,
    singer: singer,
    singerEn: singerEn,
    category: categoryKey === 'hindi' ? hindiCategory : categoryDisplay,
    tag: tag,
    videoId: videoId,
    youtubeId: videoId,
    embedUrl: embedUrl,
    originalUrl: inputData.originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
    duration: duration,
    thumbnail: thumbnail,
    addedAt: nowIso,
    status: 'approved',
    source: 'youtube'
  };
}

/**
 * Adds an approved song to the selected category JSON database.
 * Uses mutex queue to serialize file writes and prevent concurrency race conditions.
 * @param {string} categoryKey 
 * @param {object} songData 
 * @param {{ allowDuplicate?: boolean }} [options] 
 * @returns {Promise<{
 *   success: boolean,
 *   song?: object,
 *   targetFile?: string,
 *   totalSongs?: number,
 *   githubCommit?: object,
 *   error?: string
 * }>}
 */
function addSongToCategory(categoryKey, songData, options = {}) {
  return withCategoryLock(categoryKey, async () => {
    const cat = categoryDetector.CATEGORIES[categoryKey];
    if (!cat) {
      return { success: false, error: `Invalid category "${categoryKey}".` };
    }

    const validVideoId = String(songData.videoId || '').trim();
    if (!validVideoId || !/^[a-zA-Z0-9_-]{11}$/.test(validVideoId)) {
      return { success: false, error: 'Cannot save song without a valid 11-character YouTube video ID.' };
    }
    songData.videoId = validVideoId;

    // 1. Duplicate check unless explicitly forced
    if (!options.allowDuplicate) {
      const dupCheck = checkDuplicate(songData.videoId, songData.originalUrl);
      if (dupCheck.exists) {
        return {
          success: false,
          error: `Duplicate Song: This video already exists in "${dupCheck.categoryName}" (${dupCheck.foundInFile}).`,
          duplicateDetails: dupCheck
        };
      }
    }

    // Sync repository with remote origin first to prevent overwriting recent commits
    try {
      const gitRemoteCheck = await execShellCommand('git remote');
      if (gitRemoteCheck.success && gitRemoteCheck.stdout.includes('origin')) {
        await execShellCommand('git pull --rebase origin main');
      }
    } catch (pullErr) {
      // Non-blocking in offline or detached environments
    }

    const targetPath = getCategoryFilePath(categoryKey);
    const existingList = readJsonSafe(targetPath);

    // Determine next numeric ID with robust parsing
    const maxId = existingList.reduce((max, s) => {
      const numId = parseInt(s.id, 10);
      return (!isNaN(numId) && numId > max) ? numId : max;
    }, 0);
    const nextId = maxId + 1;

    // Format record according to uniform schema
    const newRecord = formatSongRecord(categoryKey, nextId, songData);

    // Append new record
    existingList.push(newRecord);

    // 2. Atomic write to local file with validation and backup
    try {
      atomicWriteJson(targetPath, existingList);
    } catch (err) {
      return {
        success: false,
        error: `Failed to write to database file ${cat.jsonFile}: ${err.message}`
      };
    }

    // 2.1 Keep preloaded bundle hindi_songs_data.js in sync for Hindi songs
    if (categoryKey === 'hindi') {
      syncHindiBundle(existingList);
    }
    if (categoryKey === 'chhath') {
      syncChhathSongs(existingList);
    }

    // 3. Record in history log
    recordHistory({
      ...newRecord,
      categoryKey,
      categoryName: cat.name,
      savedTo: cat.jsonFile
    });

    // 4. Automatic GitHub repository push
    const githubSync = await autoSyncToGitHub(cat.jsonFile, newRecord.name, cat.name, 'add');

    return {
      success: true,
      song: newRecord,
      targetFile: cat.jsonFile,
      categoryName: cat.name,
      pageUrl: cat.pageUrl,
      totalSongs: existingList.length,
      githubSync: githubSync,
      githubCommit: githubSync
    };
  });
}

/**
 * Deletes a song from the selected category JSON database.
 * Serialized via withCategoryLock to prevent race conditions.
 * @param {string} categoryKey 
 * @param {string|number} songId 
 * @returns {Promise<{
 *   success: boolean,
 *   deletedSong?: object,
 *   targetFile?: string,
 *   totalSongs?: number,
 *   githubSync?: object,
 *   error?: string
 * }>}
 */
function deleteSongFromCategory(categoryKey, songId) {
  return withCategoryLock(categoryKey, async () => {
    const cat = categoryDetector.CATEGORIES[categoryKey];
    if (!cat) {
      return { success: false, error: 'Invalid category: ' + categoryKey };
    }

    // Sync repository with remote origin first to prevent overwriting recent commits
    try {
      const gitRemoteCheck = await execShellCommand('git remote');
      if (gitRemoteCheck.success && gitRemoteCheck.stdout.includes('origin')) {
        await execShellCommand('git pull --rebase origin main');
      }
    } catch (pullErr) {
      // Non-blocking in offline or detached environments
    }

    const targetPath = getCategoryFilePath(categoryKey);
    const existingList = readJsonSafe(targetPath);

    const idx = existingList.findIndex(s => String(s.id) === String(songId) || s.videoId === String(songId));
    if (idx === -1) {
      return { success: false, error: 'Song with ID ' + songId + ' not found in category ' + cat.name };
    }

    const [deletedSong] = existingList.splice(idx, 1);

    // 1. Atomic write back to local file
    try {
      atomicWriteJson(targetPath, existingList);
    } catch (err) {
      return {
        success: false,
        error: 'Failed to write to database file ' + cat.jsonFile + ': ' + err.message
      };
    }

    // 1.1 Keep preloaded bundle hindi_songs_data.js in sync for Hindi songs
    if (categoryKey === 'hindi') {
      syncHindiBundle(existingList);
    }
    if (categoryKey === 'chhath') {
      syncChhathSongs(existingList);
    }

    // 2. Automatic GitHub repository push with fallback
    const githubSync = await autoSyncToGitHub(cat.jsonFile, deletedSong.name, cat.name, 'delete');

    return {
      success: true,
      deletedSong,
      targetFile: cat.jsonFile,
      categoryName: cat.name,
      totalSongs: existingList.length,
      githubSync
    };
  });
}

/**
 * Updates a song's metadata (e.g. Song Title, Singer Name) in the selected category JSON database.
 * Serialized via withCategoryLock to prevent race conditions.
 * @param {string} categoryKey 
 * @param {string|number} songId 
 * @param {object} updates - { name, nameEn, singer, singerEn, tag }
 * @returns {Promise<{
 *   success: boolean,
 *   updatedSong?: object,
 *   targetFile?: string,
 *   totalSongs?: number,
 *   githubSync?: object,
 *   error?: string
 * }>}
 */
function updateSongInCategory(categoryKey, songId, updates = {}) {
  return withCategoryLock(categoryKey, async () => {
    const cat = categoryDetector.CATEGORIES[categoryKey];
    if (!cat) {
      return { success: false, error: 'Invalid category: ' + categoryKey };
    }

    // Sync repository with remote origin first to prevent overwriting recent commits
    try {
      const gitRemoteCheck = await execShellCommand('git remote');
      if (gitRemoteCheck.success && gitRemoteCheck.stdout.includes('origin')) {
        await execShellCommand('git pull --rebase origin main');
      }
    } catch (pullErr) {
      // Non-blocking in offline or detached environments
    }

    const targetPath = getCategoryFilePath(categoryKey);
    const existingList = readJsonSafe(targetPath);

    const idx = existingList.findIndex(s => String(s.id) === String(songId) || s.videoId === String(songId));
    if (idx === -1) {
      return { success: false, error: 'Song with ID ' + songId + ' not found in category ' + cat.name };
    }

    const song = existingList[idx];

    // Apply updates safely with text sanitization
    if (updates.name !== undefined && String(updates.name).trim()) {
      song.name = sanitizeText(String(updates.name).trim());
      song.nameEn = updates.nameEn ? sanitizeText(String(updates.nameEn).trim()) : song.name;
    }
    if (updates.singer !== undefined && String(updates.singer).trim()) {
      song.singer = sanitizeText(String(updates.singer).trim());
      song.singerEn = updates.singerEn ? sanitizeText(String(updates.singerEn).trim()) : song.singer;
    }
    if (updates.tag !== undefined && String(updates.tag).trim()) {
      song.tag = sanitizeText(String(updates.tag).trim());
    }
    if (updates.duration !== undefined && String(updates.duration).trim()) {
      song.duration = sanitizeText(String(updates.duration).trim());
    }
    if (updates.videoId !== undefined && String(updates.videoId).trim()) {
      const vid = String(updates.videoId).trim();
      song.videoId = vid;
      song.youtubeId = vid;
      song.embedUrl = `https://www.youtube.com/embed/${vid}`;
      song.originalUrl = `https://www.youtube.com/watch?v=${vid}`;
      song.thumbnail = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    }
    if (updates.subCategory !== undefined && String(updates.subCategory).trim()) {
      song.category = sanitizeText(String(updates.subCategory).trim());
    } else if (updates.category !== undefined && String(updates.category).trim() && categoryKey === 'hindi') {
      song.category = sanitizeText(String(updates.category).trim());
    }

    // 1. Atomic write back to local file
    try {
      atomicWriteJson(targetPath, existingList);
    } catch (err) {
      return {
        success: false,
        error: 'Failed to write to database file ' + cat.jsonFile + ': ' + err.message
      };
    }

    // 1.1 Keep preloaded bundle hindi_songs_data.js in sync for Hindi songs
    if (categoryKey === 'hindi') {
      syncHindiBundle(existingList);
    }
    if (categoryKey === 'chhath') {
      syncChhathSongs(existingList);
    }

    // 2. Automatic GitHub repository push
    const githubSync = await autoSyncToGitHub(cat.jsonFile, song.name, cat.name, 'update');

    return {
      success: true,
      updatedSong: song,
      targetFile: cat.jsonFile,
      categoryName: cat.name,
      totalSongs: existingList.length,
      githubSync
    };
  });
}

/**
 * Returns overall statistics for all categories
 */
function getAllCategoriesSummary() {
  const summary = {};
  for (const [key, cat] of Object.entries(categoryDetector.CATEGORIES)) {
    const filePath = path.join(PROJECT_ROOT, cat.jsonFile);
    const songs = readJsonSafe(filePath);
    summary[key] = {
      id: key,
      name: cat.name,
      hindiName: cat.hindiName,
      jsonFile: cat.jsonFile,
      pageUrl: cat.pageUrl,
      songCount: songs.length,
      icon: cat.icon
    };
  }
  return summary;
}

module.exports = {
  PROJECT_ROOT,
  withCategoryLock,
  getCategoryFilePath,
  readJsonSafe,
  checkDuplicate,
  atomicWriteJson,
  formatSongRecord,
  syncHindiBundle,
  verifyHindiParity,
  addSongToCategory,
  deleteSongFromCategory,
  updateSongInCategory,
  getAllCategoriesSummary,
  getRecentAutoAddedSongs
};
