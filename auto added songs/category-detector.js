/**
 * PlayX Auto Added Songs - Intelligent Song Category Detector
 * 
 * Maps video metadata (title, artist, channel, tags, description) to the
 * 8 established PlayX categories using weighted linguistic and keyword analysis.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PlayXCategoryDetector = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const CATEGORIES = {
    chhath: {
      id: 'chhath',
      name: 'Chhath Puja Songs',
      hindiName: 'छठ पूजा महापर्व गीत',
      jsonFile: 'chhath-puja/youtube_songs.json',
      targetDir: 'chhath-puja',
      pageUrl: 'chhath-puja/chhath-puja.html',
      isFestivalPlayer: false,
      isDualMode: true,
      defaultTag: 'छठ महापर्व',
      icon: '🌅',
      weights: {
        keywords: [
          'chhath', 'chhathi', 'chhath puja', 'arghya', 'argha', 'soop', 'daura',
          'suruj', 'suraj', 'dina nath', 'dinanath', 'kelwa', 'bahangi', 'ghat',
          'surya dev', 'aditya', 'ug ho surujdev', 'kanch hi baans', 'kaanch hi baans',
          'छठ', 'छठी मइया', 'अर्घ्य', 'दउरा', 'सूप', 'सुरुजदेव', 'दीनानाथ', 'बहंगी', 'केलवा'
        ],
        strongKeywords: ['chhath', 'chhathi', 'छठ', 'छठी मइया', 'दीनानाथ'],
        channels: ['sharda sinha', 'anuradha paudwal chhath', 'wave bhakti chhath']
      }
    },
    hindi: {
      id: 'hindi',
      name: 'Hindi Songs',
      hindiName: 'हिंदी सुपरहिट बॉलीवुड गीत',
      jsonFile: 'hindi-songs/hindi_songs.json',
      targetDir: 'hindi-songs',
      pageUrl: 'hindi-songs/hindi-songs.html',
      isFestivalPlayer: false,
      defaultTag: 'Bollywood Hits',
      icon: '🎵',
      weights: {
        keywords: [
          'bollywood', 'hindi song', 'hindi movie', 'arijit singh', 'sonu nigam',
          'kumar sanu', 'alka yagnik', 'lata mangeshkar', 'udit narayan', 'shreya ghoshal',
          'jubin nautiyal', 'neha kakkar', 'mohit chauhan', 'atif aslam', 'kk',
          't-series', 'tips official', 'zee music company', 'sony music india', 'yrf',
          'हिंदी', 'बॉलीवुड', 'रोमांटिक', 'सदाबहार'
        ],
        strongKeywords: ['bollywood', 'arijit singh', 'kumar sanu', 'sonu nigam', 'बॉलीवुड'],
        channels: ['t-series', 'zee music company', 'sony music india', 'yrf', 'tips official']
      }
    },
    saawan: {
      id: 'saawan',
      name: 'Saawan Songs',
      hindiName: 'सावन शिव भजन व बोल बम',
      jsonFile: 'saawan-songs/saawan_songs.json',
      targetDir: 'saawan-songs',
      pageUrl: 'saawan-songs/saawan-songs.html',
      isFestivalPlayer: true,
      defaultTag: 'बोल बम भजन',
      icon: '🔱',
      weights: {
        keywords: [
          'saawan', 'sawan', 'shiv', 'shiva', 'mahadev', 'bholenath', 'bol bam',
          'kanwar', 'kanwariya', 'shankar', 'har har mahadev', 'shiv tandav',
          'ujjain', 'kedarnath', 'somnath', 'kashi', 'trishul', 'damru', 'jalabhishek',
          'सावन', 'शिव', 'महादेव', 'भोलेनाथ', 'बोल बम', 'कांवड़', 'शिव भजन', 'हर हर महादेव'
        ],
        strongKeywords: ['saawan', 'sawan', 'bol bam', 'kanwar', 'सावन', 'बोल बम', 'महादेव', 'भोलेनाथ'],
        channels: ['gulshan kumar shiv bhajan', 't-series bhakti sagar shiv']
      }
    },
    durga: {
      id: 'durga',
      name: 'Durga Puja Songs',
      hindiName: 'दुर्गा पूजा व नवरात्रि भक्ति',
      jsonFile: 'durga-puja-songs/durga_puja_songs.json',
      targetDir: 'durga-puja-songs',
      pageUrl: 'durga-puja-songs/durga-puja-songs.html',
      isFestivalPlayer: true,
      defaultTag: 'नवरात्रि स्पेशल',
      icon: '🪔',
      weights: {
        keywords: [
          'durga', 'durga puja', 'navratri', 'maiya', 'sherawali', 'bhavani',
          'ambe', 'jagdamba', 'garba', 'dandiya', 'vaishno devi', 'chandi',
          'kali mata', 'ashtami', 'navami', 'vijayadashami', 'mata ke bhajan',
          'दुर्गा', 'नवरात्रि', 'मैया', 'शेरावाली', 'अम्बे', 'जगदम्बा', 'गरबा', 'डांडिया'
        ],
        strongKeywords: ['durga', 'navratri', 'sherawali', 'दुर्गा', 'नवरात्रि', 'शेरावाली', 'गरबा'],
        channels: ['narendra chanchal', 'mata bhajan']
      }
    },
    holi: {
      id: 'holi',
      name: 'Holi Songs',
      hindiName: 'होली के रंग-बिरंगे गाने',
      jsonFile: 'holi-songs/holi_songs.json',
      targetDir: 'holi-songs',
      pageUrl: 'holi-songs/holi-songs.html',
      isFestivalPlayer: true,
      defaultTag: 'होली उत्सव',
      icon: '🎨',
      weights: {
        keywords: [
          'holi', 'fagua', 'phag', 'gulal', 'abir', 'pichkari', 'rang barse',
          'bura na mano holi hai', 'holi khele raghubira', 'jogira', 'holika',
          'रंग', 'होली', 'फाग', 'फागुन', 'गुलाल', 'पिचकारी', 'रंग बरसे', 'जोगिरा'
        ],
        strongKeywords: ['holi', 'fagua', 'phag', 'गुलाल', 'होली', 'फागुन'],
        channels: []
      }
    },
    bhojpuri: {
      id: 'bhojpuri',
      name: 'Bhojpuri Songs',
      hindiName: 'भोजपुरी सुपरहिट गाने',
      jsonFile: 'bhojpuri-songs/bhojpuri_songs.json',
      targetDir: 'bhojpuri-songs',
      pageUrl: 'bhojpuri-songs/bhojpuri-songs.html',
      isFestivalPlayer: true,
      defaultTag: 'देसी हिट्स',
      icon: '🪕',
      weights: {
        keywords: [
          'bhojpuri', 'pawan singh', 'khesari lal', 'shilpi raj', 'dinesh lal',
          'nirahua', 'samar singh', 'pramod premi', 'ankush raja', 'arvind akela kallu',
          'gunjan singh', 'neelkamal singh', 'akshara singh', 'amrapali dubey',
          'bideshiya', 'desi hits', 'bhojpuri song', 'bhojpuri video',
          'भोजपुरी', 'पवन सिंह', 'खेसारी लाल', 'शिल्पी राज', 'निरहुआ', 'समर सिंह'
        ],
        strongKeywords: ['bhojpuri', 'भोजपुरी', 'khesari lal', 'pawan singh', 'shilpi raj', 'पवन सिंह', 'खेसारी लाल'],
        channels: ['wave music', 'worldwide records bhojpuri', 'saregama hum bhojpuri', 'adishakti films']
      }
    },
    haryanvi: {
      id: 'haryanvi',
      name: 'Haryanvi Songs',
      hindiName: 'हरियाणवी सुपरहिट गाने',
      jsonFile: 'haryanvi-songs/haryanvi_songs.json',
      targetDir: 'haryanvi-songs',
      pageUrl: 'haryanvi-songs/haryanvi-songs.html',
      isFestivalPlayer: true,
      defaultTag: 'डीजे हिट्स',
      icon: '⚡',
      weights: {
        keywords: [
          'haryanvi', 'sapna choudhary', 'diler kharkiya', 'amit saini rohtakiya',
          'gulzaar chhaniwala', 'renuka panwar', 'sumit goswami', 'haryana',
          '52 gaj ka daman', 'desi desi na bolya kar', 'ragni', 'haryanvi ragni',
          'haryanvi song', 'haryanvi dj', 'haryana music',
          'हरियाणवी', 'सपना चौधरी', 'दलेर खरकिया', 'रेणुका पंवार', 'रागनी'
        ],
        strongKeywords: ['haryanvi', 'हरियाणवी', 'haryana', 'sapna choudhary', 'renuka panwar', 'रेणुका पंवार'],
        channels: ['sonotek', 'mor music', 'nav haryanvi', 'white hill dhaakad']
      }
    },
    punjabi: {
      id: 'punjabi',
      name: 'Punjabi Songs',
      hindiName: 'पंजाबी सुपरहिट गाने',
      jsonFile: 'punjabi-songs/punjabi_songs.json',
      targetDir: 'punjabi-songs',
      pageUrl: 'punjabi-songs/punjabi-songs.html',
      isFestivalPlayer: true,
      defaultTag: 'भांगड़ा बीट्स',
      icon: '🥁',
      weights: {
        keywords: [
          'punjabi', 'diljit dosanjh', 'sidhu moosewala', 'ap dhillon', 'karan aujla',
          'guru randhawa', 'b praak', 'hardy sandhu', 'sharry mann', 'amrit maan',
          'jass manak', 'sunanda sharma', 'bhangra', 'giddha', 'punjab', 'jatt',
          'punjabi song', 'punjabi video', 'speed records',
          'पंजाबी', 'दिलजीत दोसांझ', 'सिद्धू मूसेवाला', 'भांगड़ा'
        ],
        strongKeywords: ['punjabi', 'पंजाबी', 'sidhu moosewala', 'diljit dosanjh', 'bhangra', 'punjab', 'भांगड़ा', 'दिलजीत दोसांझ'],
        channels: ['speed records', 'geet mp3', 'single track studios', 'jass records']
      }
    }
  };

  /**
   * Cleans and normalizes text for keyword matching
   * @param {string} str 
   * @returns {string}
   */
  function normalizeText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[\-_/\\|,.]/g, ' ').replace(/\s+/g, ' ');
  }

  /**
   * Analyzes metadata to recommend the most fitting PlayX song category.
   * @param {{
   *   title?: string,
   *   artist?: string,
   *   channelTitle?: string,
   *   description?: string,
   *   tags?: string[]
   * }} metadata 
   * @returns {{
   *   suggestedCategory: string,
   *   categoryDetails: object,
   *   confidence: 'high' | 'medium' | 'low',
   *   score: number,
   *   reason: string,
   *   allScores: Record<string, number>
   * }}
   */
  function detectCategory(metadata = {}) {
    const title = normalizeText(metadata.title || '');
    const artist = normalizeText(metadata.artist || metadata.channelTitle || '');
    const description = normalizeText(metadata.description || '').slice(0, 1000); // limit for efficiency
    const tags = Array.isArray(metadata.tags)
      ? metadata.tags.map(t => normalizeText(t)).join(' ')
      : '';

    const combined = `${title} ${title} ${artist} ${artist} ${tags} ${description}`;

    const scores = {};
    const matches = {};

    // Special Priority Hierarchy:
    // Chhath Puja / Saawan / Durga Puja / Holi are devotional/festival songs that frequently feature
    // Bhojpuri or Hindi artists (e.g. Pawan Singh singing a Chhath song or Shiv bhajan).
    // The specific festival takes precedence over regional language!

    for (const [catKey, cat] of Object.entries(CATEGORIES)) {
      let score = 0;
      const matchedTerms = [];

      // Strong keywords get 10 points
      for (const kw of cat.weights.strongKeywords) {
        if (combined.includes(kw)) {
          score += 10;
          matchedTerms.push(kw);
        }
      }

      // Standard keywords get 3 points
      for (const kw of cat.weights.keywords) {
        if (combined.includes(kw) && !cat.weights.strongKeywords.includes(kw)) {
          score += 3;
          matchedTerms.push(kw);
        }
      }

      // Channel matches get 8 points
      for (const ch of cat.weights.channels) {
        if (artist.includes(ch)) {
          score += 8;
          matchedTerms.push(`channel:${ch}`);
        }
      }

      scores[catKey] = score;
      matches[catKey] = matchedTerms;
    }

    // Resolve festivals vs general language:
    // If Chhath has any strong match, give Chhath +15 boost over general Bhojpuri
    if (scores.chhath >= 10) scores.chhath += 15;
    // If Saawan has strong match, boost over Bhojpuri/Hindi
    if (scores.saawan >= 10) scores.saawan += 15;
    // If Durga has strong match, boost
    if (scores.durga >= 10) scores.durga += 15;
    // If Holi has strong match, boost
    if (scores.holi >= 10) scores.holi += 15;

    // Find the highest score
    let highestCat = 'hindi'; // Safe default
    let maxScore = 0;

    for (const [catKey, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        highestCat = catKey;
      }
    }

    let confidence = 'low';
    let reason = 'Defaulted to Hindi Songs due to low keyword confidence.';

    if (maxScore >= 10) {
      confidence = 'high';
      reason = `Strong match found for ${CATEGORIES[highestCat].name} (matched: ${matches[highestCat].slice(0, 3).join(', ')}).`;
    } else if (maxScore >= 3) {
      confidence = 'medium';
      reason = `Moderate match for ${CATEGORIES[highestCat].name} (matched: ${matches[highestCat].slice(0, 2).join(', ')}).`;
    } else {
      confidence = 'low';
      reason = `Low keyword confidence. Selected ${CATEGORIES[highestCat].name} as best guess; please review before saving.`;
    }

    return {
      suggestedCategory: highestCat,
      categoryDetails: CATEGORIES[highestCat],
      confidence,
      score: maxScore,
      reason,
      allScores: scores,
      allCategories: CATEGORIES
    };
  }

  return {
    CATEGORIES,
    detectCategory,
    normalizeText
  };
}));
