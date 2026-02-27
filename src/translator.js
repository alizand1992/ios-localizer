import { translate } from '@vitalets/google-translate-api';

// Map iOS language codes to Google Translate codes
const LANG_MAP = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  'es-419': 'es',
  'Base': 'en',
};

function toGoogleLang(iosLang) {
  return LANG_MAP[iosLang] || iosLang;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Translate a single text
 */
export async function translateText(text, fromLang = 'en', toLang) {
  const from = toGoogleLang(fromLang);
  const to = toGoogleLang(toLang);

  try {
    const result = await translate(text, { from, to });
    return result.text;
  } catch (err) {
    // Retry once after 1s
    await delay(1000);
    try {
      const result = await translate(text, { from, to });
      return result.text;
    } catch (retryErr) {
      throw new Error(`Translation failed for "${text.substring(0, 30)}...": ${retryErr.message}`);
    }
  }
}

/**
 * Translate multiple texts with rate limiting
 * @param {Array<{key, baseValue}>} items
 * @param {string} fromLang
 * @param {string} toLang
 * @param {function} onProgress - callback(completed, total)
 * @returns {Map<string, string>} key -> translated value
 */
export async function translateBatch(items, fromLang, toLang, onProgress) {
  const results = new Map();

  for (let i = 0; i < items.length; i++) {
    const { key, baseValue } = items[i];

    try {
      // Skip format strings that are mostly placeholders
      if (baseValue.trim().match(/^%[@diouxefgcs]$/)) {
        results.set(key, baseValue); // keep as-is
      } else {
        const translated = await translateText(baseValue, fromLang, toLang);
        results.set(key, translated);
      }
    } catch (err) {
      // On failure, use original value as fallback
      results.set(key, baseValue);
    }

    if (onProgress) onProgress(i + 1, items.length);

    // Rate limiting: 150ms between requests
    if (i < items.length - 1) {
      await delay(150);
    }
  }

  return results;
}
