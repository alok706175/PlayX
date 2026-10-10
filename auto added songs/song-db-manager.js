/**
 * PlayX Auto Added Songs - JSON Database & GitHub Storage Manager
 * 
 * Safely persists songs to the appropriate PlayX category JSON files.
 * Provides duplicate checking across all categories, atomic file writes,
 * automatic backups, and optional GitHub API commit integration.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const categoryDetector = require('./category-detector');

// Base directory is the workspace root (one level up from 'auto added songs')
const PROJECT_ROOT = path.resolve(__dirname, '..');

// History log file for recently auto-added songs
const HISTORY_FILE = path.join(__dirname, 'auto_added_history.json');

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
function checkDuplicate(videoId, originalUrl = '') {
  if (!videoId) return { exists: false };

  for (const [catKey, cat] of Object.entries(categoryDetector.CATEGORIES)) {
    const filePath = path.join(PROJECT_ROOT, cat.jsonFile);
    const songs = readJsonSafe(filePath);

    for (const song of songs) {
      const matchId = (song.videoId === videoId) || 
                      (song.youtubeId === videoId) ||
                      (song.id === `youtube_${videoId}`);

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
    }
  }

  return { exists: false };
}

/**
 * Atomically writes data to file with a .bak backup
 * @param {string} targetPath 
 * @param {any} data 
 */
function atomicWriteJson(targetPath, data) {
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const jsonStr = JSON.stringify(data, null, 2) + '\n';
  const tmpPath = `${targetPath}.tmp.${Date.now()}`;
  const bakPath = `${targetPath}.bak`;

  // 1. Create backup if file exists and has content
  if (fs.existsSync(targetPath)) {
    try {
      fs.copyFileSync(targetPath, bakPath);
    } catch (e) {
      console.warn(`Could not create backup for ${targetPath}:`, e.message);
    }
  }

  // 2. Write to temp file
  fs.writeFileSync(tmpPath, jsonStr, 'utf8');

  // 3. Atomic rename to target
  fs.renameSync(tmpPath, targetPath);
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
 * Automatically syncs the newly added song to GitHub:
 * Strategy 1: Git CLI (Local auto-commit & push to origin/main)
 * Strategy 2: GitHub REST API (Fallback using GITHUB_TOKEN if configured)
 */
async function autoSyncToGitHub(relativeFilePath, songName, categoryName) {
  const safeSongName = (songName || 'New Song').replace(/["`$\r\n]/g, "'");
  const commitMsg = `Add '${safeSongName}' to ${categoryName} playlist [PlayX Auto-Import]`;
  const normalizedPath = relativeFilePath.replace(/\\/g, '/');

  console.log(`\n🚀 [GitHub Auto-Sync] Syncing "${safeSongName}" to GitHub (${normalizedPath})...`);

  // Strategy 1: Local Git CLI Push
  try {
    // Stage the updated category file and history log
    await execShellCommand(`git add "${normalizedPath}"`);
    await execShellCommand(`git add "auto added songs/auto_added_history.json"`);

    // Commit
    const commitRes = await execShellCommand(`git commit -m "${commitMsg}"`);
    // Check if commit succeeded or already committed
    if (commitRes.success || commitRes.stdout.includes('nothing to commit')) {
      // Push to GitHub main
      let pushRes = await execShellCommand(`git push origin main`);

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
        console.warn(`⚠️ [GitHub Auto-Sync] Git CLI push warning: ${pushRes.error}`);
      }
    } else {
      console.warn(`⚠️ [GitHub Auto-Sync] Git commit note: ${commitRes.stdout || commitRes.error}`);
    }
  } catch (err) {
    console.warn(`⚠️ [GitHub Auto-Sync] Git CLI error: ${err.message}`);
  }

  // Strategy 2: GitHub REST API Fallback (when GITHUB_TOKEN is configured)
  const ghToken = process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GITHUB_REPO || 'alok706175/PlayX';
  const ghBranch = process.env.GITHUB_BRANCH || 'main';

  if (ghToken) {
    try {
      console.log(`🐙 [GitHub Auto-Sync] Attempting GitHub REST API commit with GITHUB_TOKEN...`);
      const targetPath = path.join(PROJECT_ROOT, relativeFilePath);
      const contentStr = fs.readFileSync(targetPath, 'utf8');
      const apiRes = await commitToGitHub(relativeFilePath, contentStr, commitMsg, {
        token: ghToken,
        repo: ghRepo,
        branch: ghBranch
      });

      if (apiRes.success) {
        console.log(`✅ [GitHub Auto-Sync] Successfully committed via GitHub REST API!`);
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
    message: 'Local JSON file updated, but GitHub auto-push could not reach origin. You can also run "git push" manually.'
  };
}

/**
 * Formats a song record precisely for the target category's schema
 * @param {string} categoryKey 
 * @param {number} nextId 
 * @param {object} inputData 
 * @returns {object} Formatted song object
 */
function formatSongRecord(categoryKey, nextId, inputData) {
  const cat = categoryDetector.CATEGORIES[categoryKey];
  const videoId = inputData.videoId;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const nowIso = new Date().toISOString();

  const title = inputData.title || inputData.cleanTitle || 'Untitled Song';
  const titleEn = inputData.titleEn || inputData.title || title;
  const singer = inputData.singer || inputData.channelTitle || 'Artist';
  const singerEn = inputData.singerEn || singer;
  const duration = inputData.duration && inputData.duration !== '--:--' ? inputData.duration : '03:45';
  const thumbnail = inputData.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const tag = inputData.tag || cat.defaultTag;

  if (categoryKey === 'chhath') {
    // Chhath Puja youtube_songs.json schema
    return {
      id: nextId,
      name: title,
      nameEn: titleEn,
      singer: singer,
      singerEn: singerEn,
      videoId: videoId,
      youtubeId: videoId,
      embedUrl: embedUrl,
      originalUrl: inputData.originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: thumbnail,
      duration: duration,
      addedAt: nowIso,
      status: 'approved',
      source: 'youtube'
    };
  }

  if (categoryKey === 'hindi') {
    // Hindi songs schema
    return {
      id: nextId,
      name: title,
      nameEn: titleEn,
      singer: singer,
      singerEn: singerEn,
      category: inputData.subCategory || 'Romantic',
      duration: duration,
      videoId: videoId,
      youtubeId: videoId,
      embedUrl: embedUrl,
      originalUrl: inputData.originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: thumbnail,
      addedAt: nowIso,
      status: 'approved',
      source: 'youtube'
    };
  }

  // Festival-player schema (Bhojpuri, Saawan, Durga Puja, Holi, Haryanvi, Punjabi)
  return {
    id: nextId,
    name: title,
    nameEn: titleEn,
    singer: singer,
    singerEn: singerEn,
    category: cat.name,
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
async function addSongToCategory(categoryKey, songData, options = {}) {
  const cat = categoryDetector.CATEGORIES[categoryKey];
  if (!cat) {
    return { success: false, error: `Invalid category "${categoryKey}".` };
  }

  if (!songData.videoId) {
    return { success: false, error: 'Cannot save song without a valid YouTube video ID.' };
  }

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

  const targetPath = getCategoryFilePath(categoryKey);
  const existingList = readJsonSafe(targetPath);

  // Determine next numeric ID
  let maxId = 0;
  for (const s of existingList) {
    const numId = parseInt(s.id, 10);
    if (!isNaN(numId) && numId > maxId) {
      maxId = numId;
    }
  }
  const nextId = maxId + 1;

  // Format record according to category schema
  const newRecord = formatSongRecord(categoryKey, nextId, songData);

  // Append new record
  existingList.push(newRecord);

  // 2. Atomic write to local file
  try {
    atomicWriteJson(targetPath, existingList);
  } catch (err) {
    return {
      success: false,
      error: `Failed to write to database file ${cat.jsonFile}: ${err.message}`
    };
  }

  // 3. Record in history log
  recordHistory({
    ...newRecord,
    categoryKey,
    categoryName: cat.name,
    savedTo: cat.jsonFile
  });

  // 4. Automatic GitHub repository and playlist code update
  const githubSync = await autoSyncToGitHub(cat.jsonFile, newRecord.name, cat.name);

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
  getCategoryFilePath,
  readJsonSafe,
  checkDuplicate,
  atomicWriteJson,
  formatSongRecord,
  addSongToCategory,
  getAllCategoriesSummary,
  getRecentAutoAddedSongs
};
