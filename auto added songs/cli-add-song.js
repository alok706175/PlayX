/**
 * PlayX Auto Added Songs - CLI & GitHub Actions Runner
 * 
 * Used by GitHub Actions to parse a YouTube link, extract metadata,
 * detect the appropriate category, and update the JSON playlist database.
 * Runs on standard Node.js without any npm dependencies!
 */

const metadataFetcher = require('./metadata-fetcher');
const categoryDetector = require('./category-detector');
const songDbManager = require('./song-db-manager');

async function main() {
  const inputUrl = process.env.INPUT_YOUTUBE_URL || process.argv[2];
  const categoryArg = (process.env.INPUT_CATEGORY || process.argv[3] || 'auto').trim().toLowerCase();
  const titleOverride = process.env.INPUT_CUSTOM_TITLE || process.argv[4] || '';
  const singerOverride = process.env.INPUT_CUSTOM_SINGER || process.argv[5] || '';

  if (!inputUrl) {
    console.error('❌ Error: YouTube URL is required.');
    console.error('Usage: node cli-add-song.js "<YouTube_URL>" [category] [title] [singer]');
    process.exit(1);
  }

  const urlParser = require('./url-parser');
  const cleanInputUrl = urlParser.extractUrlFromText(inputUrl);

  console.log('===============================================================');
  console.log('🎵 PlayX GitHub Actions - Automatic Song Importer');
  console.log('===============================================================');
  console.log(`📡 Song Link: ${cleanInputUrl}`);

  // Step 1: Auto-Fetch Metadata & Auto-Detect Category
  console.log('\n🔍 Auto-fetching metadata from YouTube...');
  const metaResult = await metadataFetcher.retrieveSongMetadata(cleanInputUrl);

  if (!metaResult.success) {
    console.error(`❌ Metadata extraction failed: ${metaResult.error}`);
    process.exit(1);
  }

  const { metadata, categorySuggestion } = metaResult;

  // Apply overrides only if user explicitly provided them
  if (titleOverride) {
    metadata.cleanTitle = titleOverride;
    metadata.title = titleOverride;
  }
  if (singerOverride) {
    metadata.singer = singerOverride;
  }

  // Determine category (auto-detect if 'auto' or not provided)
  let targetCategory = categorySuggestion
    ? (categorySuggestion.suggestedCategory || categorySuggestion.categoryKey || 'hindi')
    : 'hindi';
  let categoryDetectionNote = categorySuggestion 
    ? `${categorySuggestion.categoryDetails?.name || targetCategory} (${categorySuggestion.confidence.toUpperCase()} confidence: ${categorySuggestion.reason})`
    : 'Default (Hindi Songs)';

  if (categoryArg && categoryArg !== 'auto' && categoryDetector.CATEGORIES[categoryArg]) {
    targetCategory = categoryArg;
    categoryDetectionNote = `Manually selected by user: ${categoryDetector.CATEGORIES[targetCategory].name}`;
  }

  console.log('\n✨ [AUTO-FETCH SUCCESSFUL]');
  console.log(`   📌 Video ID:        ${metadata.videoId}`);
  console.log(`   🎵 Song Title:      ${metadata.cleanTitle || metadata.rawTitle}`);
  console.log(`   🎤 Singer / Artist:  ${metadata.singer}`);
  console.log(`   ⏱️ Duration:        ${metadata.duration || '03:45'}`);
  console.log(`   📁 Category:        ${categoryDetector.CATEGORIES[targetCategory]?.name || targetCategory} (${targetCategory})`);
  console.log(`   🎯 Categorization:  ${categoryDetectionNote}`);
  console.log(`   🖼️ Thumbnail:       ${metadata.thumbnail}`);
  console.log(`   🎬 Embed Player:    ${metadata.embedUrl}`);
  console.log(`   🌐 Source API:      ${metadata.sourceApi || 'YouTube'}`);

  // Step 2: Check Duplicates Across Playlists
  const allowDup = (process.env.INPUT_ALLOW_DUPLICATE || '').toString().toLowerCase() === 'true';
  const dup = songDbManager.checkDuplicate(metadata.videoId);
  if (dup.exists) {
    console.warn(`\n⚠️ Warning: Duplicate detected! Song already exists in "${dup.categoryName}" (${dup.foundInFile}).`);
    if (!allowDup) {
      console.error('❌ Aborting: Duplicate song not allowed. (Set allow_duplicate: true in workflow if you wish to add anyway).');
      process.exit(1);
    } else {
      console.log('ℹ️ Duplicate allowed by user flag. Proceeding...');
    }
  }

  // Step 3: Add Song to Database
  console.log(`\n💾 Writing song to ${categoryDetector.CATEGORIES[targetCategory]?.jsonFile}...`);
  const result = await songDbManager.addSongToCategory(targetCategory, metadata, {
    allowDuplicate: allowDup || dup.exists
  });

  if (!result.success) {
    console.error(`❌ Failed to save song: ${result.error}`);
    process.exit(1);
  }

  console.log('===============================================================');
  console.log(`🎉 SUCCESS: Song successfully auto-added to PlayX!`);
  console.log(`📁 Category:        ${result.categoryName}`);
  console.log(`💾 File Updated:    ${result.targetFile}`);
  console.log(`📊 Total Songs:     ${result.totalSongs}`);
  console.log('===============================================================');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
