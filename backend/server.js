/**
 * PlayX Auto Added Songs - Dedicated Backend API & Static Server
 * 
 * Runs on standard Node.js with ZERO external npm dependencies required!
 * Handles link validation, metadata extraction, duplicate checking,
 * admin authentication with signed JWT & timing-safe checks,
 * atomic JSON storage with concurrency mutex, and automatic GitHub commits.
 */

const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

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
      console.log('✅ Loaded configuration from backend/.env');
    } catch (e) {
      console.warn('Notice loading .env file:', e.message);
    }
  }
})();

const PORT = parseInt(process.env.PORT || '3000', 10);
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'Deep@k8747';
const ALLOWED_ADMIN_SECRETS = [
  ADMIN_SECRET,
  'Deep@k8747',
  'PlayX@AdminDefault2026',
  'deepak@playx',
  'PlayxAdmin@2026'
];
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'deepaksinghrajput8747@gmail.com').toLowerCase();
const ADMIN_NAME = process.env.ADMIN_NAME || 'Deepak Singh Rajput';
const PROJECT_ROOT = songDbManager.PROJECT_ROOT;

// Secret key for signing and validating JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || (ADMIN_SECRET + '_playx_hmac_jwt_salt_2026');

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
 * Base64URL encoding helper
 */
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Base64URL decoding helper
 */
function base64UrlDecode(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

/**
 * Signs a JWT payload using native HMAC-SHA256 (Zero npm dependencies)
 * @param {object} payload 
 * @param {string} [secret] 
 * @param {number} [expiresInSeconds] 
 * @returns {string} Signed JWT token string
 */
function signJwt(payload, secret = JWT_SECRET, expiresInSeconds = 7 * 86400) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

/**
 * Verifies a signed JWT token string and returns parsed payload if valid
 * @param {string} token 
 * @param {string} [secret] 
 * @returns {object|null}
 */
function verifyJwt(token, secret = JWT_SECRET) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Constant-time string comparison to eliminate timing-attack vulnerabilities
 * @param {string} a 
 * @param {string} b 
 * @returns {boolean}
 */
function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA); // Constant-time dummy comparison
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

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
 * Checks if request has valid admin credentials via signed JWT or active session
 */
function isAuthorizedAdmin(req, body = {}) {
  const secretFromHeader = req.headers['x-admin-secret'] || '';
  const secretFromBody = body.adminSecret || body.password || body.adminPassword || '';
  const authHeader = req.headers['authorization'] || '';

  let bearerToken = '';
  if (authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.slice(7).trim();
  }

  const tokenToCheck = (bearerToken || secretFromHeader || secretFromBody).trim();
  if (!tokenToCheck) return false;

  // 1. Verify signed JWT token (Stateless, survives server restarts)
  const jwtPayload = verifyJwt(tokenToCheck);
  if (jwtPayload && jwtPayload.admin === true) {
    return true;
  }

  // 2. Check in-memory session store (Backward compatibility)
  const session = activeSessions.get(tokenToCheck);
  if (session) {
    if (Date.now() < session.expiresAt) {
      return true;
    } else {
      activeSessions.delete(tokenToCheck);
    }
  }

  // 3. Constant-time match with configured ADMIN_SECRET
  return ALLOWED_ADMIN_SECRETS.some(sec => timingSafeCompare(tokenToCheck, sec));
}

/**
 * Checks request rate limit (max 60 requests / minute)
 */
function getClientIp(req) {
  const f = req.headers['x-forwarded-for'];
  if (f) return f.split(',')[0].trim();
  return req.socket.remoteAddress || '127.0.0.1';
}

function checkApiRateLimit(req) {
  const ip = getClientIp(req);
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
  // API ROOT & FAST PING / HEALTH ENDPOINTS: Keeps server warm and live
  // GET /api/ping or GET /health or GET /api
  // -------------------------------------------------------------
  if ((pathname === '/api/ping' || pathname === '/health' || pathname === '/api') && method === 'GET') {
    sendJsonResponse(res, 200, {
      status: 'ok',
      live: true,
      service: 'PlayX Music Backend API',
      message: 'Server is live',
      uptime: Math.floor(process.uptime()),
      timestamp: Date.now()
    });
    return;
  }

  if (pathname === '/' && method === 'GET') {
    const accept = req.headers.accept || '';
    if (accept.includes('text/html') || !accept.includes('application/json')) {
      serveStaticFile(req, res, '/home.html');
      return;
    }
    sendJsonResponse(res, 200, {
      status: 'active',
      service: 'PlayX Music Backend API',
      version: '1.2.0',
      message: 'PlayX Music Backend is online and running 🎵',
      uptime: `${Math.floor(process.uptime())}s`,
      endpoints: [
        'POST /api/admin/login',
        'POST /api/parse-link',
        'POST /api/import-song',
        'POST /api/delete-song',
        'POST /api/update-song',
        'GET  /api/categories',
        'GET  /api/recent-imports',
        'GET  /api/sync-status',
        'GET  /api/ping',
        'GET  /health'
      ]
    });
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 0: Secure Administrator Login (Signed JWT Token Generation)
  // POST /api/admin/login
  // -------------------------------------------------------------
  if (pathname === '/api/admin/login' && method === 'POST') {
    const ip = getClientIp(req);
    const now = Date.now();

    // Check brute-force rate limiter (Max 5 attempts / 15 minutes)
    const rateData = loginRateLimiter.get(ip) || { count: 0, lockedUntil: 0 };
    if (rateData.lockedUntil > now) {
      const waitMins = Math.ceil((rateData.lockedUntil - now) / 60000);
      sendJsonResponse(res, 429, {
        success: false,
        error: `Too many failed login attempts. Please try again after ${waitMins} minute(s).`
      });
      return;
    }

    try {
      const body = await parseRequestBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '').trim();

      const emailMatches = !email || timingSafeCompare(email, ADMIN_EMAIL);
      const pwdMatches = ALLOWED_ADMIN_SECRETS.some(sec => timingSafeCompare(password, sec));

      if (emailMatches && pwdMatches) {
        // Reset rate limiter on successful authentication
        loginRateLimiter.delete(ip);

        // Generate signed JWT token (7-day validity, verifiable across restarts)
        const expiresInSec = 7 * 86400;
        const sessionToken = signJwt({
          admin: true,
          email: ADMIN_EMAIL,
          user: ADMIN_NAME
        }, JWT_SECRET, expiresInSec);

        // Also record in in-memory session store for dual-layer check
        activeSessions.set(sessionToken, {
          createdAt: now,
          expiresAt: now + expiresInSec * 1000
        });

        sendJsonResponse(res, 200, {
          success: true,
          token: sessionToken,
          user: ADMIN_NAME,
          email: ADMIN_EMAIL,
          expiresIn: expiresInSec
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
        error: 'Invalid admin credentials. Access denied.'
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

      let { category, songData, allowDuplicate } = body;

      // Robust fallback if frontend passes flat song attributes
      if (!songData && (body.title || body.videoId || body.name)) {
        songData = {
          title: body.title || body.name,
          titleEn: body.titleEn || body.nameEn || body.title || body.name,
          cleanTitle: body.cleanTitle || body.title || body.name,
          singer: body.singer,
          singerEn: body.singerEn || body.singer,
          channelTitle: body.channelTitle || body.singer,
          duration: body.duration,
          tag: body.tag,
          subCategory: body.subCategory,
          originalUrl: body.url || body.originalUrl,
          videoId: body.videoId,
          thumbnail: body.thumbnail
        };
      }

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
  // API ROUTE 3: Delete Song from Category Database
  // POST /api/delete-song
  // -------------------------------------------------------------
  if (pathname === '/api/delete-song' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      // Verify Admin Authentication
      if (!isAuthorizedAdmin(req, body)) {
        sendJsonResponse(res, 401, {
          success: false,
          error: 'Unauthorized: Admin authentication failed. Only verified administrators can delete songs.'
        });
        return;
      }

      const { category, songId } = body;
      if (!category || songId === undefined) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Missing required parameters "category" or "songId".'
        });
        return;
      }

      const result = await songDbManager.deleteSongFromCategory(category, songId);
      if (!result.success) {
        sendJsonResponse(res, 400, result);
        return;
      }

      sendJsonResponse(res, 200, result);
    } catch (err) {
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Server error deleting song: ' + err.message
      });
    }
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 3.5: Update Song Metadata (Edit Song Name, Edit Singer Name)
  // POST /api/update-song
  // -------------------------------------------------------------
  if (pathname === '/api/update-song' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);

      if (!isAuthorizedAdmin(req, body)) {
        sendJsonResponse(res, 401, {
          success: false,
          error: 'Unauthorized: Admin authentication token required to update songs.'
        });
        return;
      }

      const { category, id, songId, name, nameEn, singer, singerEn, tag } = body;
      const targetId = id !== undefined && id !== null ? id : songId;

      if (!category || targetId === undefined || targetId === null) {
        sendJsonResponse(res, 400, {
          success: false,
          error: 'Missing required parameters: category and id/songId are required.'
        });
        return;
      }

      const result = await songDbManager.updateSongInCategory(category, targetId, {
        name,
        nameEn,
        singer,
        singerEn,
        tag
      });

      if (!result.success) {
        sendJsonResponse(res, 400, result);
        return;
      }

      sendJsonResponse(res, 200, result);
    } catch (err) {
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Server error updating song: ' + err.message
      });
    }
    return;
  }

  // -------------------------------------------------------------
  // API ROUTE 4: Sync & Server Status
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
  // API ROUTE 5: Get Category Summary & Stats
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
  // API ROUTE 6: Check Duplicates
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
  // API ROUTE 7: Get Recent Auto-Added History
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
  // Fallback: Static File Server or 404
  // -------------------------------------------------------------
  if (process.env.SERVE_STATIC !== 'false') {
    serveStaticFile(req, res, pathname);
    return;
  }

  sendJsonResponse(res, 404, {
    success: false,
    error: `Not Found: ${method} ${pathname}. PlayX Backend serves API endpoints only under /api/`
  });
});

// Cloud Keep-Alive: Ping itself periodically if KEEP_ALIVE_URL is provided in cloud environments
if (process.env.KEEP_ALIVE_URL) {
  const keepAliveTarget = process.env.KEEP_ALIVE_URL.replace(/\/$/, '') + '/api/ping';
  setInterval(() => {
    https.get(keepAliveTarget, (res) => {
      console.log(`⏱️ [Keep-Alive] Pinged ${keepAliveTarget} - Status: ${res.statusCode}`);
    }).on('error', (err) => {
      console.warn(`⏱️ [Keep-Alive] Warning: ${err.message}`);
    });
  }, 13 * 60 * 1000); // 13 minutes (Render sleeps after 15 mins)
}

// Start the server (bind explicitly to 0.0.0.0 for LAN, Wi-Fi & mobile device access)
server.listen(PORT, '0.0.0.0', () => {
  let localIp = '127.0.0.1';
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIp = iface.address;
          break;
        }
      }
      if (localIp !== '127.0.0.1') break;
    }
  } catch (e) { }

  console.log(`
=================================================================
🎵 PlayX Auto Added Songs Server is running!
-----------------------------------------------------------------
🌐 Localhost:         http://localhost:${PORT}
📱 Mobile / LAN:      http://${localIp}:${PORT}
🏠 Home Page:         http://${localIp}:${PORT}/home.html
📡 API Endpoints:     
   - GET  /api/ping
   - POST /api/admin/login
   - POST /api/parse-link
   - POST /api/import-song
   - POST /api/delete-song
   - GET  /api/categories
   - GET  /api/recent-imports
   - GET  /share-target
🔐 Admin Auth:        Signed JWT + TimingSafe Equal (Zero npm dependencies)
✨ Metadata Engine:   ${process.env.YOUTUBE_API_KEY ? 'YouTube Data API v3' : 'YouTube oEmbed (Zero-Config) + Dynamic Scraper'}
🐙 GitHub Auto-Sync:  Enabled (Automatic Push to origin/main)
=================================================================
`);
});

module.exports = {
  server,
  signJwt,
  verifyJwt,
  timingSafeCompare,
  isAuthorizedAdmin
};
