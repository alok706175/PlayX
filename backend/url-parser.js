/**
 * PlayX Auto Added Songs - URL Parser & Validator
 * 
 * Safely parses, validates, and normalizes YouTube and YouTube Music URLs.
 * Extracts canonical video IDs, verifies approved domains, and generates
 * standard embed URLs.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // Node.js
    module.exports = factory();
  } else {
    // Browser
    root.PlayXUrlParser = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Approved YouTube domain names
  const APPROVED_HOSTNAMES = new Set([
    'youtube.com',
    'www.youtube.com',
    'm.youtube.com',
    'music.youtube.com',
    'gaming.youtube.com',
    'youtu.be',
    'www.youtu.be'
  ]);

  // Valid YouTube 11-character video ID regex (alphanumeric, dash, underscore)
  const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

  /**
   * Extracts URL from potentially rich text (e.g. Android/iOS share target text
   * containing "Check out this video https://youtu.be/xyz shared via YouTube")
   * @param {string} input 
   * @returns {string} Clean URL string or original trimmed string
   */
  function extractUrlFromText(input) {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    
    // Check if input contains an embedded HTTP/HTTPS URL
    const urlMatch = trimmed.match(/https?:\/\/[^\s<>"'`]+/i);
    if (urlMatch) {
      return urlMatch[0];
    }
    return trimmed;
  }

  /**
   * Parses and validates a YouTube or YouTube Music URL.
   * @param {string} rawInput 
   * @returns {{
   *   isValid: boolean,
   *   error?: string,
   *   videoId?: string,
   *   platform?: 'YouTube' | 'YouTube Music' | 'YouTube Shorts',
   *   canonicalUrl?: string,
   *   embedUrl?: string,
   *   originalUrl?: string,
   *   hostname?: string
   * }}
   */
  function parseYouTubeUrl(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') {
      return {
        isValid: false,
        error: 'Please enter a valid YouTube or YouTube Music link.'
      };
    }

    const cleanInput = extractUrlFromText(rawInput);
    if (!cleanInput) {
      return {
        isValid: false,
        error: 'Input string does not contain a valid URL.'
      };
    }

    let parsedUrl;
    try {
      // Add protocol if user pasted youtube.com/... without https://
      const withProtocol = /^https?:\/\//i.test(cleanInput)
        ? cleanInput
        : `https://${cleanInput}`;
      parsedUrl = new URL(withProtocol);
    } catch (e) {
      return {
        isValid: false,
        error: 'Malformed URL structure. Please provide a complete link.'
      };
    }

    const hostname = parsedUrl.hostname.toLowerCase();

    // 1. Domain Validation
    if (!APPROVED_HOSTNAMES.has(hostname)) {
      return {
        isValid: false,
        error: `Unsupported domain "${hostname}". Only official YouTube and YouTube Music links are accepted.`
      };
    }

    let videoId = null;
    let platform = 'YouTube';

    if (hostname === 'music.youtube.com') {
      platform = 'YouTube Music';
    }

    const pathname = parsedUrl.pathname;

    // 2. Extract Video ID based on format
    if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
      // Format: https://youtu.be/VIDEO_ID
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        videoId = pathSegments[0];
      }
    } else if (pathname.startsWith('/shorts/')) {
      // Format: https://www.youtube.com/shorts/VIDEO_ID
      platform = 'YouTube Shorts';
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2) {
        videoId = pathSegments[1];
      }
    } else if (pathname.startsWith('/embed/')) {
      // Format: https://www.youtube.com/embed/VIDEO_ID
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2) {
        videoId = pathSegments[1];
      }
    } else if (pathname.startsWith('/v/')) {
      // Format: https://www.youtube.com/v/VIDEO_ID
      const pathSegments = pathname.split('/').filter(Boolean);
      if (pathSegments.length >= 2) {
        videoId = pathSegments[1];
      }
    } else {
      // Format: https://www.youtube.com/watch?v=VIDEO_ID or https://music.youtube.com/watch?v=VIDEO_ID
      videoId = parsedUrl.searchParams.get('v');
    }

    // 3. ID Validation
    if (!videoId) {
      return {
        isValid: false,
        error: 'Could not extract a YouTube video ID from the provided link.'
      };
    }

    // Clean any trailing query parameters or anchors if accidentally attached
    videoId = videoId.split('?')[0].split('&')[0].split('#')[0].trim();

    if (!YOUTUBE_ID_REGEX.test(videoId)) {
      return {
        isValid: false,
        error: `Invalid YouTube video ID "${videoId}". Video IDs must be exactly 11 characters.`
      };
    }

    // 4. Construct canonical and embed URLs
    const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    const musicUrl = `https://music.youtube.com/watch?v=${videoId}`;

    return {
      isValid: true,
      videoId,
      platform,
      hostname,
      originalUrl: cleanInput,
      canonicalUrl,
      embedUrl,
      musicUrl,
      defaultThumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      maxresThumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
    };
  }

  return {
    APPROVED_HOSTNAMES: Array.from(APPROVED_HOSTNAMES),
    YOUTUBE_ID_REGEX,
    extractUrlFromText,
    parseYouTubeUrl
  };
}));
