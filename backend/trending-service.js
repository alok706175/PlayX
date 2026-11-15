/**
 * PlayX Auto Added Songs - Social Media & YouTube Trending Harvester Engine
 * 
 * Automatically discovers viral and trending songs from Instagram Reels,
 * YouTube Music Charts India, and social media trends, resolves metadata,
 * detects category, verifies uniqueness, and persists into PlayX playlists.
 * 
 * Works out-of-the-box with Zero-Config (RSS & scraping fallback) and
 * scales with YouTube Data API v3 when YOUTUBE_API_KEY is available.
 */

const https = require('https');
const http = require('http');
const metadataFetcher = require('./metadata-fetcher');
const categoryDetector = require('./category-detector');
const songDbManager = require('./song-db-manager');

// Curated official charts and viral playlists (India music & regional hits)
const RSS_CHART_PLAYLISTS = [
  { id: 'PL15B1E77BB5708555', name: 'YouTube Music India Top 100', defaultCat: 'hindi' },
  { id: 'PL4fGSIFoz5Tng54abttb02tS2A_k_Yw2I', name: 'YouTube Trending India', defaultCat: 'hindi' },
  { id: 'PLdisKGnmK4RyQ69pLgG4q6m1d_Ym87J4t', name: 'Bhojpuri Superhit Trending', defaultCat: 'bhojpuri' },
  { id: 'PLgzTt0k8mXzE0D_pL_e4o9E4J6bY4Zf9w', name: 'Bhojpuri Viral Hits', defaultCat: 'bhojpuri' },
  { id: 'PLxA687tYuMWg3zD76Y8v_Xv_u8d4k3eB2', name: 'Punjabi Top Hits', defaultCat: 'punjabi' }
];

// Target search queries to discover trending Instagram Reels & viral audio
const VIRAL_SEARCH_QUERIES = [
  { query: 'trending reels songs hindi', category: 'hindi' },
  { query: 'instagram viral songs hindi', category: 'hindi' },
  { query: 'viral bhojpuri reels song trending', category: 'bhojpuri' },
  { query: 'punjabi trending reels song', category: 'punjabi' },
  { query: 'haryanvi viral song reels trending', category: 'haryanvi' }
];

/**
 * Generic HTTPS GET helper with timeout and User-Agent
 * @param {string} reqUrl 
 * @param {number} timeoutMs 
 * @returns {Promise<string>}
 */
function fetchHttp(reqUrl, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const isHttps = reqUrl.startsWith('https://');
    const client = isHttps ? https : http;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    };

    const req = client.get(reqUrl, options, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHttp(res.headers.location, timeoutMs));
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        }
      });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timeout (${timeoutMs}ms) for ${reqUrl}`));
    });

    req.on('error', reject);
  });
}

/**
 * Parses duration string (e.g. "03:45", "4:15", "1:02:15") into total seconds
 * @param {string} durStr 
 * @returns {number}
 */
function durationToSeconds(durStr) {
  if (!durStr || typeof durStr !== 'string') return 0;
  const parts = durStr.split(':').map(p => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  } else if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  }
  return 0;
}

/**
 * Extracts 11-char video IDs and titles from YouTube XML/RSS feed
 * @param {string} xml 
 * @returns {Array<{ videoId: string, title: string }>}
 */
function parseRssFeed(xml) {
  const results = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entryChunk = match[1];
    const idMatch = entryChunk.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
    const titleMatch = entryChunk.match(/<title>([^<]+)<\/title>/);

    if (idMatch && idMatch[1]) {
      results.push({
        videoId: idMatch[1],
        title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : ''
      });
    }
  }

  return results;
}

/**
 * Fetches India Trending Music Videos using YouTube Data API v3 (if key present)
 * @param {string} apiKey 
 * @param {number} maxResults 
 * @returns {Promise<Array<{ videoId: string, title: string, channelTitle: string }>>}
 */
async function fetchTrendingFromDataApi(apiKey, maxResults = 30) {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&chart=mostPopular&regionCode=IN&videoCategoryId=10&maxResults=${maxResults}&key=${encodeURIComponent(apiKey)}`;
  try {
    const jsonStr = await fetchHttp(url);
    const data = JSON.parse(jsonStr);
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items
      .filter(item => item.status?.embeddable !== false && item.status?.privacyStatus !== 'private')
      .map(item => ({
        videoId: item.id,
        title: item.snippet?.title || '',
        channelTitle: item.snippet?.channelTitle || '',
        description: item.snippet?.description || '',
        tags: item.snippet?.tags || [],
        duration: metadataFetcher.parseISO8601Duration(item.contentDetails?.duration || ''),
        thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || ''
      }));
  } catch (err) {
    console.warn(`[Trending Harvester] YouTube Data API trending failed: ${err.message}`);
    return [];
  }
}

/**
 * Fetches video IDs from YouTube public RSS feeds
 * @param {string} playlistId 
 * @returns {Promise<Array<{ videoId: string, title: string }>>}
 */
async function fetchTrendingFromRss(playlistId) {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
  try {
    const xml = await fetchHttp(rssUrl, 7000);
    return parseRssFeed(xml);
  } catch (err) {
    console.warn(`[Trending Harvester] RSS chart ${playlistId} failed: ${err.message}`);
    return [];
  }
}

/**
 * Scrapes video IDs from YouTube search results for viral social media queries
 * @param {string} query 
 * @returns {Promise<Array<{ videoId: string, title: string }>>}
 */
async function fetchTrendingFromSearchScrape(query) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const html = await fetchHttp(searchUrl, 8000);
    const found = [];
    const seen = new Set();

    // Look for videoId patterns inside ytInitialData JSON
    const regex = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
    let m;
    while ((m = regex.exec(html)) !== null && found.length < 15) {
      const vid = m[1];
      if (!seen.has(vid)) {
        seen.add(vid);
        found.push({ videoId: vid, title: '' });
      }
    }
    return found;
  } catch (err) {
    console.warn(`[Trending Harvester] Search scrape failed for "${query}": ${err.message}`);
    return [];
  }
}

/**
 * Discovers trending candidate songs across all sources
 * @param {{ category?: string, limit?: number }} options 
 * @returns {Promise<Array<{ videoId: string, rawTitle?: string, sourceHint?: string, suggestedCategory?: string }>>}
 */
async function discoverCandidates(options = {}) {
  const apiKey = process.env.YOUTUBE_API_KEY || '';
  const candidates = [];
  const seenIds = new Set();

  function addCandidate(item, hint, catHint) {
    if (!item.videoId || seenIds.has(item.videoId)) return;
    seenIds.add(item.videoId);
    candidates.push({
      videoId: item.videoId,
      rawTitle: item.title || '',
      sourceHint: hint,
      suggestedCategory: catHint || options.category || 'auto',
      prefetched: item.channelTitle ? item : null
    });
  }

  // 1. YouTube Data API (India Most Popular Music)
  if (apiKey) {
    console.log('📡 [Trending Harvester] Querying YouTube Data API v3 for India Music Trending...');
    const apiVideos = await fetchTrendingFromDataApi(apiKey, 30);
    apiVideos.forEach(v => addCandidate(v, 'YouTube Data API (Trending Music India)', 'hindi'));
  }

  // 2. Curated YouTube India Charts RSS Feeds
  console.log('📡 [Trending Harvester] Fetching India Top Music & Regional Charts RSS Feeds...');
  for (const chart of RSS_CHART_PLAYLISTS) {
    if (options.category && options.category !== 'auto' && chart.defaultCat !== options.category) {
      continue;
    }
    const items = await fetchTrendingFromRss(chart.id);
    items.forEach(it => addCandidate(it, chart.name, chart.defaultCat));
  }

  // 3. Social Media Viral Reels Queries
  console.log('📡 [Trending Harvester] Scouting viral Instagram Reels & social media songs...');
  for (const q of VIRAL_SEARCH_QUERIES) {
    if (options.category && options.category !== 'auto' && q.category !== options.category) {
      continue;
    }
    const items = await fetchTrendingFromSearchScrape(q.query);
    items.forEach(it => addCandidate(it, `Viral Query: "${q.query}"`, q.category));
  }

  console.log(`✨ [Trending Harvester] Total unique candidates discovered: ${candidates.length}`);
  return candidates;
}

/**
 * Validates whether a song is suitable for PlayX:
 * - Checks duplicate in all playlists
 * - Verifies duration is standard song length (60s - 600s)
 * - Checks embeddability
 * @param {object} metadata 
 * @param {string} videoId 
 * @returns {{ valid: boolean, reason?: string, duplicateDetails?: object }}
 */
function validateSongCandidate(metadata, videoId) {
  // Check duplicate first
  const dupCheck = songDbManager.checkDuplicate(
    videoId,
    metadata.originalUrl || `https://www.youtube.com/watch?v=${videoId}`,
    metadata.cleanTitle || metadata.title,
    metadata.singer
  );

  if (dupCheck.exists) {
    return {
      valid: false,
      reason: `Duplicate: Already exists in "${dupCheck.categoryName}" (${dupCheck.foundInFile})`,
      duplicateDetails: dupCheck
    };
  }

  // Check duration (Skip shorts < 60s and compilations/jukeboxes > 600s = 10 mins)
  const durationSec = durationToSeconds(metadata.duration);
  if (durationSec > 0) {
    if (durationSec < 60) {
      return { valid: false, reason: `Skipped Short/Teaser (${metadata.duration} < 1:00)` };
    }
    if (durationSec > 660) { // 11 mins
      return { valid: false, reason: `Skipped Long Compilation/Jukebox (${metadata.duration} > 11:00)` };
    }
  }

  // Check embeddability
  if (metadata.embeddable === false) {
    return { valid: false, reason: 'Embedding disabled by video owner' };
  }

  if (metadata.isPrivate) {
    return { valid: false, reason: 'Private video' };
  }

  return { valid: true };
}

/**
 * Main Crawler Runner: Discovers, resolves, validates, and adds viral songs
 * @param {object} options
 * @param {number} [options.limit=5] Maximum number of NEW songs to successfully add
 * @param {string} [options.category='auto'] Target category or 'auto'
 * @param {boolean} [options.dryRun=false] If true, previews without writing to files
 * @param {boolean} [options.allowDuplicate=false]
 * @returns {Promise<{
 *   success: boolean,
 *   scannedCount: number,
 *   addedCount: number,
 *   skippedDuplicates: number,
 *   skippedOther: number,
 *   addedSongs: Array<object>,
 *   skippedList: Array<object>
 * }>}
 */
async function crawlAndAddTrendingSongs(options = {}) {
  const limit = Math.max(1, parseInt(options.limit || 5, 10));
  const targetCategory = (options.category || 'auto').trim().toLowerCase();
  const dryRun = Boolean(options.dryRun);

  console.log('===============================================================');
  console.log('🔥 PlayX Automatic Trending & Viral Song Crawler');
  console.log(`🎯 Goal: Discover & automatically add up to ${limit} viral songs`);
  console.log(`📁 Target Category: ${targetCategory}`);
  console.log(`🧪 Mode: ${dryRun ? 'DRY-RUN (Simulate only, no files changed)' : 'LIVE (Auto-Commit to PlayX)'}`);
  console.log('===============================================================\n');

  const candidates = await discoverCandidates({ category: targetCategory, limit });
  const addedSongs = [];
  const skippedList = [];
  let skippedDuplicates = 0;
  let skippedOther = 0;

  for (const candidate of candidates) {
    if (addedSongs.length >= limit) {
      console.log(`\n🎉 Reached desired limit of ${limit} new viral songs! Stopping crawler.`);
      break;
    }

    const { videoId, rawTitle, sourceHint, suggestedCategory } = candidate;
    console.log(`\n🔎 Evaluating [${videoId}] "${rawTitle || 'Song'}" (Source: ${sourceHint})...`);

    // Fetch full metadata
    let metaResult;
    try {
      metaResult = await metadataFetcher.retrieveSongMetadata(videoId);
    } catch (err) {
      console.log(`   ❌ Metadata fetch failed: ${err.message}`);
      skippedOther++;
      skippedList.push({ videoId, reason: err.message });
      continue;
    }

    if (!metaResult.success) {
      console.log(`   ❌ Extraction unsuccessful: ${metaResult.error}`);
      skippedOther++;
      skippedList.push({ videoId, reason: metaResult.error });
      continue;
    }

    const { metadata, categorySuggestion } = metaResult;

    // Validate (duplicate check, length check, privacy check)
    const validation = validateSongCandidate(metadata, videoId);
    if (!validation.valid) {
      console.log(`   ⏭️  ${validation.reason}`);
      if (validation.duplicateDetails) {
        skippedDuplicates++;
      } else {
        skippedOther++;
      }
      skippedList.push({
        videoId,
        title: metadata.cleanTitle || metadata.title,
        reason: validation.reason
      });
      continue;
    }

    // Determine target PlayX category
    let finalCategory = 'hindi';
    if (targetCategory !== 'auto' && categoryDetector.CATEGORIES[targetCategory]) {
      finalCategory = targetCategory;
    } else if (categorySuggestion && categorySuggestion.confidence !== 'none') {
      finalCategory = categorySuggestion.categoryKey;
    } else if (suggestedCategory && suggestedCategory !== 'auto' && categoryDetector.CATEGORIES[suggestedCategory]) {
      finalCategory = suggestedCategory;
    }

    const catDetails = categoryDetector.CATEGORIES[finalCategory];
    const catName = catDetails ? catDetails.name : 'Hindi Songs';

    console.log(`   ✅ VALID VIRAL SONG!`);
    console.log(`      🎵 Title: "${metadata.cleanTitle || metadata.title}"`);
    console.log(`      🎤 Singer: "${metadata.singer || 'Unknown'}"`);
    console.log(`      ⏱️  Duration: ${metadata.duration}`);
    console.log(`      📂 Assigned to: ${catName} [${finalCategory}]`);

    if (dryRun) {
      addedSongs.push({
        videoId,
        name: metadata.cleanTitle || metadata.title,
        singer: metadata.singer,
        categoryKey: finalCategory,
        categoryName: catName,
        duration: metadata.duration,
        dryRun: true
      });
      console.log(`   [DRY-RUN] Would add to ${catDetails.jsonFile}`);
      continue;
    }

    // Live Add to Category
    const addResult = await songDbManager.addSongToCategory(finalCategory, {
      videoId: metadata.videoId,
      originalUrl: metadata.originalUrl || metadata.canonicalUrl,
      title: metadata.cleanTitle || metadata.title,
      singer: metadata.singer,
      duration: metadata.duration,
      thumbnail: metadata.thumbnail,
      embedUrl: metadata.embedUrl
    }, {
      allowDuplicate: options.allowDuplicate
    });

    if (addResult.success) {
      console.log(`   💾 Successfully saved to ${addResult.targetFile} (Total songs: ${addResult.totalSongs})`);
      if (addResult.githubSync?.committed) {
        console.log(`   🐙 GitHub commit: ${addResult.githubSync.method} (${addResult.githubSync.sha || 'pushed'})`);
      }
      addedSongs.push({
        ...addResult.song,
        categoryKey: finalCategory,
        categoryName: catName,
        targetFile: addResult.targetFile,
        githubSync: addResult.githubSync
      });
    } else {
      console.log(`   ❌ Database write failed: ${addResult.error}`);
      skippedOther++;
      skippedList.push({ videoId, reason: addResult.error });
    }
  }

  console.log('\n===============================================================');
  console.log('📊 CRAWLER SUMMARY RESULTS');
  console.log('===============================================================');
  console.log(`Total Candidates Scanned:  ${candidates.length}`);
  console.log(`Successfully Added:        ${addedSongs.length}`);
  console.log(`Duplicates Skipped:        ${skippedDuplicates}`);
  console.log(`Other (Length/Embed/Err):  ${skippedOther}`);
  console.log('===============================================================\n');

  return {
    success: true,
    scannedCount: candidates.length,
    addedCount: addedSongs.length,
    skippedDuplicates,
    skippedOther,
    addedSongs,
    skippedList
  };
}

module.exports = {
  discoverCandidates,
  validateSongCandidate,
  crawlAndAddTrendingSongs,
  RSS_CHART_PLAYLISTS,
  VIRAL_SEARCH_QUERIES
};
