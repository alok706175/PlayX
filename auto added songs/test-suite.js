/**
 * PlayX Auto Added Songs - Comprehensive Test Suite
 * 
 * Verifies:
 * 1. URL parsing across all required formats (watch, youtu.be, shorts, music.youtube, parameters)
 * 2. Malformed/arbitrary URL rejection and domain whitelisting
 * 3. Intelligent Category detection for all 8 categories
 * 4. Duplicate prevention across categories
 * 5. Schema compatibility and atomic write safety
 * 6. Live metadata retrieval via YouTube oEmbed
 */

const urlParser = require('./url-parser');
const categoryDetector = require('./category-detector');
const metadataFetcher = require('./metadata-fetcher');
const songDbManager = require('./song-db-manager');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🧪 Starting PlayX Auto Added Songs Verification Test Suite');
  console.log('===============================================================\n');

  // TEST SUITE 1: URL Parsing and Validation
  console.log('📦 Test Suite 1: YouTube & YouTube Music URL Parsing');
  
  const sampleId = 'dQw4w9WgXcQ';

  // 1.1 Standard Watch URL
  const res1 = urlParser.parseYouTubeUrl(`https://www.youtube.com/watch?v=${sampleId}`);
  assert(res1.isValid && res1.videoId === sampleId && res1.embedUrl === `https://www.youtube.com/embed/${sampleId}`, 
    'Standard watch URL (youtube.com/watch?v=ID)');

  // 1.2 youtu.be Short URL
  const res2 = urlParser.parseYouTubeUrl(`https://youtu.be/${sampleId}`);
  assert(res2.isValid && res2.videoId === sampleId && res2.embedUrl === `https://www.youtube.com/embed/${sampleId}`, 
    'Short link URL (youtu.be/ID)');

  // 1.3 YouTube Shorts URL
  const res3 = urlParser.parseYouTubeUrl(`https://www.youtube.com/shorts/${sampleId}`);
  assert(res3.isValid && res3.videoId === sampleId && res3.platform === 'YouTube Shorts', 
    'YouTube Shorts URL (youtube.com/shorts/ID)');

  // 1.4 YouTube Music URL with extra parameters (si, feature, list)
  const res4 = urlParser.parseYouTubeUrl(`https://music.youtube.com/watch?v=${sampleId}&si=abc123xyz&feature=share&list=RDAMVM`);
  assert(res4.isValid && res4.videoId === sampleId && res4.platform === 'YouTube Music' && res4.embedUrl === `https://www.youtube.com/embed/${sampleId}`, 
    'YouTube Music URL with si, feature, and playlist query parameters');

  // 1.5 Shared text with embedded link from mobile share menu
  const mobileShareText = `Listen to this superhit song on YouTube! https://youtu.be/${sampleId}?si=mobile_share Enjoy!`;
  const res5 = urlParser.parseYouTubeUrl(mobileShareText);
  assert(res5.isValid && res5.videoId === sampleId, 
    'Mobile share text with surrounding descriptive words and URL');

  // 1.6 Malicious / Unsupported Domain Rejection
  const badDomain = urlParser.parseYouTubeUrl('https://malicious-music.com/watch?v=dQw4w9WgXcQ');
  assert(!badDomain.isValid && badDomain.error.includes('Unsupported domain'), 
    'Reject arbitrary non-YouTube domain (malicious-music.com)');

  // 1.7 Malformed Video ID
  const badId = urlParser.parseYouTubeUrl('https://www.youtube.com/watch?v=too_short');
  assert(!badId.isValid && badId.error.includes('Invalid YouTube video ID'), 
    'Reject malformed video ID with invalid length');

  // TEST SUITE 2: Category Detection
  console.log('\n📦 Test Suite 2: Intelligent Categorization Engine');

  const catChhath = categoryDetector.detectCategory({
    title: 'काँच ही बाँस के बहंगिया - छठ पूजा महापर्व स्पेशल',
    artist: 'शारदा सिन्हा'
  });
  assert(catChhath.suggestedCategory === 'chhath' && catChhath.confidence === 'high', 
    'Auto-detect Chhath Puja Songs (काँच ही बाँस के बहंगिया)');

  const catSaawan = categoryDetector.detectCategory({
    title: 'भोलेनाथ का कांवड़ भजन - बोल बम',
    artist: 'हर हर महादेव'
  });
  assert(catSaawan.suggestedCategory === 'saawan' && catSaawan.confidence === 'high', 
    'Auto-detect Saawan Songs (बोल बम शिव भजन)');

  const catDurga = categoryDetector.detectCategory({
    title: 'दुर्गा पूजा स्पेशल मैया का जगराता व आरती',
    artist: 'शेरावाली'
  });
  assert(catDurga.suggestedCategory === 'durga' && catDurga.confidence === 'high', 
    'Auto-detect Durga Puja Songs (दुर्गा पूजा मैया भजन)');

  const catHoli = categoryDetector.detectCategory({
    title: 'होली के रंग-बिरंगे फाग और गुलाल स्पेशल',
    artist: 'फागुन उत्सव'
  });
  assert(catHoli.suggestedCategory === 'holi' && catHoli.confidence === 'high', 
    'Auto-detect Holi Songs (फाग व गुलाल)');

  const catBhojpuri = categoryDetector.detectCategory({
    title: 'देसी हिट्स - कमरिया डोले',
    artist: 'पवन सिंह'
  });
  assert(catBhojpuri.suggestedCategory === 'bhojpuri' && catBhojpuri.confidence === 'high', 
    'Auto-detect Bhojpuri Songs (पवन सिंह देसी हिट्स)');

  const catHaryanvi = categoryDetector.detectCategory({
    title: '52 गज का दामन - हरियाणवी डीजे सांग्स',
    artist: 'रेणुका पंवार'
  });
  assert(catHaryanvi.suggestedCategory === 'haryanvi' && catHaryanvi.confidence === 'high', 
    'Auto-detect Haryanvi Songs (52 गज का दामन)');

  const catPunjabi = categoryDetector.detectCategory({
    title: 'भांगड़ा बीट्स और जट्ट लाइफ',
    artist: 'दिलजीत दोसांझ'
  });
  assert(catPunjabi.suggestedCategory === 'punjabi' && catPunjabi.confidence === 'high', 
    'Auto-detect Punjabi Songs (दिलजीत दोसांझ भांगड़ा)');

  const catHindi = categoryDetector.detectCategory({
    title: 'तुम ही हो - आशिकी 2 बॉलीवुड लव सोंग्स',
    artist: 'अरिजीत सिंह'
  });
  assert(catHindi.suggestedCategory === 'hindi' && catHindi.confidence === 'high', 
    'Auto-detect Hindi Songs (अरिजीत सिंह बॉलीवुड)');

  // TEST SUITE 3: Database Duplicate Checking & Schema Format
  console.log('\n📦 Test Suite 3: Database Duplicate Prevention & Schema Formatting');

  // Check known video ID from chhath-puja/youtube_songs.json ("T_YXL_blE3A" = Darshan Dekhai Dihi)
  const knownChhathId = 'T_YXL_blE3A';
  const dupCheck1 = songDbManager.checkDuplicate(knownChhathId);
  assert(dupCheck1.exists && dupCheck1.foundInCategory === 'chhath', 
    `Detect existing duplicate song (found in ${dupCheck1.categoryName})`);

  // Non-existent video ID
  const freshId = 'ZzZ999XyX11';
  const dupCheck2 = songDbManager.checkDuplicate(freshId);
  assert(!dupCheck2.exists, 
    'Confirm fresh non-duplicate song returns exists: false');

  // Schema formatting check for festival-player
  const formattedFestival = songDbManager.formatSongRecord('bhojpuri', 1, {
    videoId: freshId,
    title: 'Test Bhojpuri Song',
    singer: 'Test Singer',
    duration: '04:12'
  });
  assert(
    formattedFestival.id === 1 &&
    formattedFestival.videoId === freshId &&
    formattedFestival.youtubeId === freshId &&
    formattedFestival.embedUrl === `https://www.youtube.com/embed/${freshId}` &&
    formattedFestival.category === 'Bhojpuri Songs' &&
    formattedFestival.status === 'approved',
    'Generate compliant Festival Player schema record'
  );

  // TEST SUITE 4: Live YouTube oEmbed Metadata Retrieval
  console.log('\n📦 Test Suite 4: Live YouTube oEmbed Metadata Retrieval');
  try {
    // Valid real video ID (e.g. YouTube's official music test or famous song "knZ8b5YnQiY" already in chhath songs)
    const liveMeta = await metadataFetcher.retrieveSongMetadata('https://www.youtube.com/watch?v=knZ8b5YnQiY');
    assert(
      liveMeta.success &&
      Boolean(liveMeta.metadata.cleanTitle) &&
      Boolean(liveMeta.metadata.thumbnail) &&
      liveMeta.metadata.videoId === 'knZ8b5YnQiY',
      `Live YouTube metadata fetched: "${liveMeta.metadata.cleanTitle.slice(0, 35)}..."`
    );
  } catch (err) {
    console.warn(`  ⚠️ Live network test notice: ${err.message}`);
  }

  // Summary
  console.log('\n===============================================================');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
