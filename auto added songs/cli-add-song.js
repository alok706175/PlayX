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

  console.log('===============================================================');
  console.log('🎵 PlayX GitHub Actions Song Importer');
  console.log('===============================================================');
  console.log(`📡 Input URL: ${inputUrl}`);

  // Step 1: Retrieve Metadata
  console.log('🔍 Fetching video metadata and detecting category...');
  const metaResult = await metadataFetcher.retrieveSongMetadata(inputUrl);

  if (!metaResult.success) {
    console.error(`❌ Metadata extraction failed: ${metaResult.error}`);
    process.exit(1);
  }

  const { metadata, categorySuggestion } = metaResult;

  // Apply overrides if provided
  if (titleOverride) metadata.cleanTitle = titleOverride;
  if (singerOverride) metadata.singer = singerOverride;

  // Determine category
  let targetCategory = categorySuggestion ? categorySuggestion.categoryKey : 'hindi';
  if (categoryArg && categoryArg !== 'auto' && categoryDetector.CATEGORIES[categoryArg]) {
    targetCategory = categoryArg;
  }

  console.log(`✅ Metadata retrieved:`);
  console.log(`   - Title:    ${metadata.cleanTitle}`);
  console.log(`   - Singer:   ${metadata.singer}`);
  console.log(`   - Duration: ${metadata.duration}`);
  console.log(`   - Category: ${targetCategory} (${categoryDetector.CATEGORIES[targetCategory]?.name || targetCategory})`);

  // Step 2: Check Duplicates
  const dup = songDbManager.checkDuplicate(metadata.videoId);
  if (dup.exists) {
    console.warn(`⚠️ Warning: Duplicate detected! Song already exists in "${dup.categoryName}" (${dup.foundInFile}).`);
    const allowDup = (process.env.INPUT_ALLOW_DUPLICATE || '').toLowerCase() === 'true';
    if (!allowDup) {
      console.error('❌ Aborting: Duplicate song not allowed.');
      process.exit(1);
    }
  }

  // Step 3: Add Song to Database
  console.log(`💾 Writing song to ${categoryDetector.CATEGORIES[targetCategory]?.jsonFile}...`);
  const result = await songDbManager.addSongToCategory(targetCategory, metadata, {
    allowDuplicate: true
  });

  if (!result.success) {
    console.error(`❌ Failed to save song: ${result.error}`);
    process.exit(1);
  }

  console.log('===============================================================');
  console.log(`🎉 SUCCESS: Song added to ${result.categoryName}!`);
  console.log(`📁 File updated: ${result.targetFile}`);
  console.log(`📊 Total songs in category: ${result.totalSongs}`);
  console.log('===============================================================');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
