/**
 * PlayX Auto Added Songs - CLI & GitHub Actions Trending Songs Runner
 * 
 * Command-line runner to discover, resolve, and automatically add viral
 * and trending songs from social media and YouTube charts to PlayX playlists.
 * 
 * Usage:
 *   node backend/cli-auto-trending.js [limit] [category] [--dry-run]
 * 
 * Examples:
 *   node backend/cli-auto-trending.js 5 auto
 *   node backend/cli-auto-trending.js 10 hindi
 *   node backend/cli-auto-trending.js 5 bhojpuri --dry-run
 */

const trendingService = require('./trending-service');

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = parseInt(process.env.INPUT_LIMIT || '5', 10);
  let category = (process.env.INPUT_CATEGORY || 'auto').trim().toLowerCase();
  let dryRun = process.env.INPUT_DRY_RUN === 'true';

  for (const arg of args) {
    if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10) || limit;
    } else if (arg.startsWith('--category=')) {
      category = arg.split('=')[1].trim().toLowerCase();
    } else if (/^\d+$/.test(arg)) {
      limit = parseInt(arg, 10);
    } else if (!arg.startsWith('-')) {
      category = arg.trim().toLowerCase();
    }
  }

  return { limit, category, dryRun };
}

async function main() {
  const { limit, category, dryRun } = parseArgs();

  try {
    const result = await trendingService.crawlAndAddTrendingSongs({
      limit,
      category,
      dryRun
    });

    if (result.addedCount > 0) {
      console.log(`\n🎉 Success! Added ${result.addedCount} new trending songs to PlayX.`);
      process.exit(0);
    } else {
      console.log('\nℹ️ No new songs were added (either all trending songs already exist in PlayX or limit reached).');
      process.exit(0);
    }
  } catch (err) {
    console.error('\n❌ Fatal error running trending crawler:', err);
    process.exit(1);
  }
}

main();
