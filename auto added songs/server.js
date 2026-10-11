/**
 * PlayX Auto Added Songs - Dedicated Backend API & Static Server
 * 
 * Runs on standard Node.js with ZERO external npm dependencies required!
 * Handles link validation, metadata extraction, duplicate checking,
 * admin authentication, atomic JSON storage, and optional GitHub commits.
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Local modules
const urlParser = require('./url-parser');
const metadataFetcher = require('./metadata-fetcher');
const categoryDetector = require('./category-detector');
const songDbManager = require('./song-db-manager');

// Load environment variables from .env file if present
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
      console.log('✅ Loaded configuration from auto added songs/.env');
    } catch (e) {
      console.warn('Notice loading .env file:', e.message);
    }
  }
})();

const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'PlayX@AdminDefault2026';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'deepaksinghrajput8747@gmail.com').toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME || 'Deepak Singh Rajput';
const PROJECT_ROOT = songDbManager.PROJECT_ROOT;

// Security: In-memory session store & rate limiters
// activeSessions: token -> { createdAt, expiresAt }
const activeSessions = new Map();
// loginRateLimiter: ip -> { count, lockedUntil }
const loginRateLimiter = new Map();
// apiRateLimiter: ip -> { count, resetTime }
const apiRateLimiter = new Map();

// Standard Security HTTP Headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// MIME types for serving static files
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=UTF-8'
};

/**
 * Sends JSON HTTP response with CORS and security headers
 */
function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret',
    ...SECURITY_HEADERS
  });
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Reads POST body JSON safely with size limit
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1024 * 1024) { // 1MB limit
        reject(new Error('Request body too large.'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Malformed JSON request body.'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Checks if request has valid admin credentials or active session
 */
function isAuthorizedAdmin(req, body = {}) {
  const secretFromHeader = req.headers['x-admin-secret'] || '';
  const secretFromBody = body.adminSecret || '';
  const authHeader = req.headers['authorization'] || '';

  let bearerToken = '';
  if (authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const tokenToCheck = (bearerToken || secretFromHeader || secretFromBody).trim();
  if (!tokenToCheck) return false;

  // 1. Check if token is an active valid session
  const session = activeSessions.get(tokenToCheck);
  if (session) {
    if (Date.now() < session.expiresAt) {
      return true;
    } else {
      activeSessions.delete(tokenToCheck);
    }
  }

  // 2. Direct match with configured ADMIN_SECRET
  return tokenToCheck === ADMIN_SECRET;
}

/**
 * Checks request rate limit (max 60 requests / minute)
 */
function checkApiRateLimit(req) {
  const ip = req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const limit = apiRateLimiter.get(ip) || { count: 0, resetTime: now + 60000 };

  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + 60000;
  } else {
    limit.count += 1;
  }

  apiRateLimiter.set(ip, limit);
  return limit.count <= 60;
}

/**
 * Serves static files from the PlayX project workspace securely
 */
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? '/home.html' : pathname;
  
  // Prevent directory traversal
  const safePath = path.normalize(decodeURIComponent(relativePath)).replace(/^(\.\.[\/\\])+/, '');

  // Security 1: Block all dotfiles (.env, .git, .gitignore, etc.)
  const normalizedParts = safePath.split(/[\/\\]/);
  if (normalizedParts.some(part => part.startsWith('.'))) {
    res.writeHead(403, { 
      'Content-Type': 'text/plain; charset=UTF-8',
      ...SECURITY_HEADERS 
    });
    res.end('403 Forbidden: Access to sensitive or configuration files is strictly denied.');
    return;
  }

  // Security 2: Prevent access outside PROJECT_ROOT
  const absolutePath = path.join(PROJECT_ROOT, safePath);
  if (!absolutePath.startsWith(PROJECT_ROOT)) {
    res.writeHead(403, { 
      'Content-Type': 'text/plain; charset=UTF-8',
      ...SECURITY_HEADERS 
    });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  fs.stat(absolutePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 
        'Content-Type': 'text/plain; charset=UTF-8',
        ...SECURITY_HEADERS 
      });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });

    const stream = fs.createReadStream(absolutePath);
    stream.pipe(res);
  });
}

// Create HTTP Server
const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost:3000'));
  const pathname = reqUrl.pathname;
  const method = req.method.toUpperCase();

  console.log(`📡 [${new Date().toLocaleTimeString()}] ${method} ${pathname}`);

  // Handle CORS preflight OPTIONS request
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-secret, *'
    });
    res.end();
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 0: Secure Administrator Login & Session Generation
  // POST /api/admin/login
  // -------------------------------------------------------------
  if (pathname === '/api/admin/login' && method === 'POST') {
    const ip = req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();

    // Check brute-force rate limiter (Max 5 attempts / 15 minutes)
    const rateData = loginRateLimiter.get(ip) || { count: 0, lockedUntil: 0 };
    if (rateData.lockedUntil > now) {
      const waitMins = Math.ceil((rateData.lockedUntil - now) / 60000);
      sendJsonResponse(res, 429, {
        success: false,
        error: `बहुत अधिक असफल प्रयास (Too many failed login attempts). कृपया ${waitMins} मिनट बाद पुनः प्रयास करें।`
      });
      return;
    }

    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      const emailMatches = !email || email === ADMIN_EMAIL;
      const pwdMatches = password === ADMIN_SECRET;

      if (emailMatches && pwdMatches) {
        // Reset rate limiter on successful authentication
        loginRateLimiter.delete(ip);

        // Generate cryptographically secure random session token (64 hex characters)
        const sessionToken = crypto.randomBytes(32).toString('hex');
        activeSessions.set(sessionToken, {
          createdAt: now,
          expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours
        });

        sendJsonResponse(res, 200, {
          success: true,
          token: sessionToken,
          user: ADMIN_NAME,
          email: ADMIN_EMAIL
        });
        return;
      }

      // Record failed attempt
      rateData.count += 1;
      if (rateData.count >= 5) {
        rateData.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
      }
      loginRateLimiter.set(ip, rateData);

      sendJsonResponse(res, 401, {
        success: false,
        error: 'अमान्य एडमिन क्रेडेंशियल (Invalid admin credentials). एक्सेस अस्वीकृत।'
      });
    } catch (err) {
      sendJsonResponse(res, 500, {
        success: false,
        error: `Login error: ${err.message}`
      });
    }
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 1: Parse Link & Retrieve Metadata Preview
  // POST /api/parse-link
  // -------------------------------------------------------------
  if (pathname === '/api/parse-link' && method === 'POST') {
    if (!checkApiRateLimit(req)) {
      sendJsonResponse(res, 429, { success: false, error: 'Too many requests. Please slow down.' });
      return;
    }
    try {
      const body = await parseRequestBody(req);
      const inputUrl = body.url;

      if (!inputUrl) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Missing required field "url". Please provide a YouTube or YouTube Music link.'
        });
        return;
      }

      // Parse, extract metadata, and detect category
      const metaResult = await metadataFetcher.retrieveSongMetadata(inputUrl);

      if (!metaResult.success) {
        sendJsonResponse(res, 400, {
          success: false,
          error: metaResult.error
        });
        return;
      }

      // Check duplicates in database
      const videoId = metaResult.metadata.videoId;
      const dupCheck = songDbManager.checkDuplicate(videoId, metaResult.metadata.originalUrl);

      sendJsonResponse(res, 200, {
        success: true,
        metadata: metaResult.metadata,
        categorySuggestion: metaResult.categorySuggestion,
        duplicateCheck: dupCheck
      });
    } catch (err) {
      sendJsonResponse(res, 500, {
        success: false,
        error: `Server error processing link: ${err.message}`
      });
    }
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 2: Approve & Save Song to JSON Database
  // POST /api/import-song
  // -------------------------------------------------------------
  if (pathname === '/api/import-song' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      // Verify Admin Authentication
      if (!isAuthorizedAdmin(req, body)) {
        sendJsonResponse(res, 401, {
          success: false,
          error: 'Unauthorized: Admin authentication failed. Only verified administrators can approve song imports.'
        });
        return;
      }

      const { category, songData, allowDuplicate } = body;

      if (!category || !songData) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Missing required parameters "category" or "songData".'
        });
        return;
      }

      const result = await songDbManager.addSongToCategory(category, songData, {
        allowDuplicate: Boolean(allowDuplicate)
      });

      if (!result.success) {
        sendJsonResponse(res, 400, result);
        return;
      }

      sendJsonResponse(res, 200, result);
    } catch (err) {
      sendJsonResponse(res, 500, {
        success: false,
        error: `Server error saving song: ${err.message}`
      });
    }
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE: Sync & Server Status
  // GET /api/sync-status
  // -------------------------------------------------------------
  if (pathname === '/api/sync-status' && method === 'GET') {
    const hasToken = Boolean(process.env.PLAYX_TOKEN || process.env.GITHUB_TOKEN);
    sendJsonResponse(res, 200, {
      success: true,
      server: 'active',
      hasGithubToken: hasToken,
      repo: process.env.PLAYX_REPO || process.env.GITHUB_REPO || 'alok706175/PlayX',
      branch: process.env.PLAYX_BRANCH || process.env.GITHUB_BRANCH || 'main'
    });
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 3: Get Category Summary & Stats
  // GET /api/categories
  // -------------------------------------------------------------
  if (pathname === '/api/categories' && method === 'GET') {
    try {
      const summary = songDbManager.getAllCategoriesSummary();
      sendJsonResponse(res, 200, {
        success: true,
        categories: summary
      });
    } catch (err) {
      sendJsonResponse(res, 500, {
        success: false,
        error: `Error retrieving categories: ${err.message}`
      });
    }
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 4: Check Duplicates
  // GET /api/duplicates?videoId=...
  // -------------------------------------------------------------
  if (pathname === '/api/duplicates' && method === 'GET') {
    const videoId = reqUrl.searchParams.get('videoId');
    if (!videoId) {
      sendJsonResponse(res, 400, {
        success: false,
        error: 'Missing query parameter "videoId".'
      });
      return;
    }

    const dup = songDbManager.checkDuplicate(videoId);
    sendJsonResponse(res, 200, {
      success: true,
      duplicate: dup
    });
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 5: Get Recent Auto-Added History
  // GET /api/recent-imports
  // -------------------------------------------------------------
  if (pathname === '/api/recent-imports' && method === 'GET') {
    const history = songDbManager.getRecentAutoAddedSongs();
    sendJsonResponse(res, 200, {
      success: true,
      history
    });
    return;
  }

  // -------------------------------------------------------------
  // Web Share Target Redirect Handler
  // GET /share-target?title=...&text=...&url=...
  // -------------------------------------------------------------
  if (pathname === '/share-target' && method === 'GET') {
    const sharedUrl = reqUrl.searchParams.get('url') || reqUrl.searchParams.get('text') || '';
    const cleanUrl = urlParser.extractUrlFromText(sharedUrl);
    
    // Redirect user to home.html with the shared URL parameter
    const redirectTarget = `/home.html?share_url=${encodeURIComponent(cleanUrl || sharedUrl)}`;
    res.writeHead(302, {
      'Location': redirectTarget,
      'Content-Type': 'text/html; charset=UTF-8'
    });
    res.end(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${redirectTarget}"></head><body>Redirecting to PlayX Song Importer...</body></html>`);
    return;
  }

  // -------------------------------------------------------------
  // Static Files Server (Fallback for everything else)
  // -------------------------------------------------------------
  serveStaticFile(req, res, pathname);
});

// Start the server
server.listen(PORT, () => {
  console.log(`
=================================================================
🎵 PlayX Auto Added Songs Server is running!
-----------------------------------------------------------------
🌐 Local URL:         http://localhost:${PORT}
🏠 Home Page:         http://localhost:${PORT}/home.html
📡 API Endpoints:     
   - POST /api/parse-link
   - POST /api/import-song
   - GET  /api/categories
   - GET  /api/recent-imports
   - GET  /share-target
🔐 Admin Auth:        Ready (${process.env.ADMIN_SECRET ? 'Custom Secret' : 'Default PlayX Admin'})
✨ Metadata Engine:   ${process.env.YOUTUBE_API_KEY ? 'YouTube Data API v3' : 'YouTube oEmbed (Zero-Config)'}
🐙 GitHub Auto-Sync:  Enabled (Automatic Push to origin/main)
=================================================================
`);
});

module.exports = server;
