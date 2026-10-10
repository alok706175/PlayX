/**
 * PlayX Auto Added Songs - Metadata Fetcher
 * 
 * Fetches video metadata using:
 * 1. Official YouTube Data API v3 (when YOUTUBE_API_KEY is configured in .env)
 * 2. YouTube oEmbed API fallback (Zero-Config, no API key required)
 * 
 * Extracts video title, channel, duration, thumbnail, embed status,
 * and cleans music video title strings for beautiful display in PlayX.
 */

const https = require('https');
const urlParser = require('./url-parser');
const categoryDetector = require('./category-detector');

/**
 * Parses ISO 8601 duration (e.g. "PT4M15S" or "PT1H2M30S") to readable "M:SS" or "H:MM:SS"
 * @param {string} isoDuration 
 * @returns {string} Formatted duration string
 */
function parseISO8601Duration(isoDuration) {
  if (!isoDuration || typeof isoDuration !== 'string') return '--:--';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '--:--';

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (hours > 0) {
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minStr}:${secStr}`;
  }
  return `${minutes}:${secStr}`;
}

/**
 * Performs an HTTPS GET request and parses JSON response
 * @param {string} requestUrl 
 * @returns {Promise<any>}
 */
function fetchJson(requestUrl) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'PlayX-Music-Importer/1.0 (Node.js)'
      }
    };

    https.get(requestUrl, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse response JSON: ${e.message}`));
          }
        } else if (res.statusCode === 404) {
          reject(new Error('Video not found. It may be deleted, private, or the link is invalid.'));
        } else if (res.statusCode === 403) {
          reject(new Error('Access forbidden. The YouTube API quota may have been exceeded or the video is restricted.'));
        } else {
          reject(new Error(`YouTube request failed with status code ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Network error connecting to YouTube: ${err.message}`));
    });
  });
}

/**
 * Cleans YouTube titles (removes "[Official 4K Video]", "(Lyrical)", etc.)
 * @param {string} rawTitle 
 * @returns {{ cleanTitle: string, detectedSinger: string }}
 */
function cleanSongTitle(rawTitle = '') {
  let title = rawTitle;

  // Remove common YouTube music promotional fluff in brackets/parentheses
  title = title.replace(/\s*[([{\b](?:official\s*(?:video|audio|music\s*video|lyric\s*video|hd|4k|song)?|full\s*song|video\s*song|lyrical|audio\s*song|remix|hd\s*video|original\s*video|4k\s*ultra\s*hd|special\s*edition)[)\]}\b]/gi, '');
  title = title.replace(/\|\s*official\s*(?:video|music\s*video|audio|song)/gi, '');
  title = title.replace(/\s*\|\s*T-Series/gi, '');

  let detectedSinger = '';

  // Check for common title format "Singer - Title" or "Title | Singer"
  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length === 2) {
      detectedSinger = parts[0].trim();
      title = parts[1].trim();
    }
  } else if (title.includes(' | ')) {
    const parts = title.split(' | ');
    if (parts.length >= 2) {
      title = parts[0].trim();
      detectedSinger = parts[1].trim();
    }
  }

  return {
    cleanTitle: title.trim() || rawTitle.trim(),
    detectedSinger: detectedSinger.trim()
  };
}

/**
 * Fetches metadata via YouTube Data API v3
 * @param {string} videoId 
 * @param {string} apiKey 
 * @returns {Promise<object>}
 */
async function fetchViaDataApi(videoId, apiKey) {
  const endpoint = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(endpoint);

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found in YouTube Data API. It may have been deleted, set to private, or does not exist.');
  }

  const item = data.items[0];
  const snippet = item.snippet || {};
  const contentDetails = item.contentDetails || {};
  const status = item.status || {};

  const embeddable = status.embeddable !== false;
  const isPrivate = status.privacyStatus === 'private';

  const thumbnails = snippet.thumbnails || {};
  const bestThumbnail = (thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default || {}).url
    || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  const durationStr = parseISO8601Duration(contentDetails.duration);
  const { cleanTitle, detectedSinger } = cleanSongTitle(snippet.title || '');

  return {
    videoId,
    rawTitle: snippet.title || '',
    cleanTitle,
    channelTitle: snippet.channelTitle || '',
    singer: detectedSinger || snippet.channelTitle || 'Unknown Artist',
    description: snippet.description || '',
    tags: snippet.tags || [],
    duration: durationStr,
    publishedAt: snippet.publishedAt || '',
    thumbnail: bestThumbnail,
    embeddable,
    isPrivate,
    sourceApi: 'YouTube Data API v3'
  };
}

/**
 * Fetches metadata via YouTube oEmbed API (No API Key Required)
 * @param {string} videoId 
 * @returns {Promise<object>}
 */
async function fetchViaOEmbed(videoId) {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`;
  
  const data = await fetchJson(endpoint);
  const rawTitle = data.title || '';
  const channelTitle = data.author_name || '';
  const { cleanTitle, detectedSinger } = cleanSongTitle(rawTitle);

  return {
    videoId,
    rawTitle,
    cleanTitle,
    channelTitle,
    singer: detectedSinger || channelTitle || 'Unknown Artist',
    description: '',
    tags: [],
    duration: '--:--', // oEmbed does not provide duration
    publishedAt: '',
    thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    embeddable: true,
    isPrivate: false,
    sourceApi: 'YouTube oEmbed (Zero-Config)'
  };
}

/**
 * Comprehensive Metadata Retriever
 * Validates link, extracts video ID, gets metadata, and detects category.
 * @param {string} inputUrl 
 * @param {string} [apiKeyOverride] 
 * @returns {Promise<{
 *   success: boolean,
 *   metadata?: object,
 *   categorySuggestion?: object,
 *   error?: string
 * }>}
 */
async function retrieveSongMetadata(inputUrl, apiKeyOverride) {
  // 1. URL Parse & Validation
  const parsed = urlParser.parseYouTubeUrl(inputUrl);
  if (!parsed.isValid) {
    return {
      success: false,
      error: parsed.error
    };
  }

  const videoId = parsed.videoId;
  const apiKey = apiKeyOverride || process.env.YOUTUBE_API_KEY || '';

  let meta = null;
  let fetchError = null;

  // 2. Try YouTube Data API v3 if key available
  if (apiKey) {
    try {
      meta = await fetchViaDataApi(videoId, apiKey);
    } catch (err) {
      console.warn(`YouTube Data API v3 failed for ID ${videoId}: ${err.message}. Falling back to oEmbed...`);
      fetchError = err.message;
    }
  }

  // 3. Fallback to oEmbed if no key or API failed
  if (!meta) {
    try {
      meta = await fetchViaOEmbed(videoId);
    } catch (err) {
      return {
        success: false,
        error: `Could not retrieve video details from YouTube: ${err.message}`
      };
    }
  }

  // 4. Check for embed playback warnings
  const warnings = [];
  if (meta.embeddable === false) {
    warnings.push('⚠️ Notice: The video owner has disabled embedding for this video. It may not play inside the iframe.');
  }
  if (meta.isPrivate) {
    warnings.push('⚠️ Notice: This video is private and cannot be played publicly.');
  }
  if (parsed.platform === 'YouTube Music') {
    warnings.push('ℹ️ YouTube Music Note: Playback uses the official YouTube player. Video availability depends on YouTube regional and account policies.');
  }

  // 5. Intelligent Category Suggestion
  const categorySuggestion = categoryDetector.detectCategory({
    title: meta.rawTitle || meta.cleanTitle,
    artist: meta.singer || meta.channelTitle,
    channelTitle: meta.channelTitle,
    description: meta.description,
    tags: meta.tags
  });

  return {
    success: true,
    metadata: {
      ...meta,
      platform: parsed.platform,
      originalUrl: parsed.originalUrl,
      canonicalUrl: parsed.canonicalUrl,
      embedUrl: parsed.embedUrl,
      warnings
    },
    categorySuggestion
  };
}

module.exports = {
  parseISO8601Duration,
  cleanSongTitle,
  fetchViaDataApi,
  fetchViaOEmbed,
  retrieveSongMetadata
};
