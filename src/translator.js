import { v2 } from '@google-cloud/translate';

const { Translate } = v2;

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

let client;

export function initTranslator(apiKey) {
  client = new Translate({ key: apiKey });
}

/**
 * Translate a single text string.
 */
export async function translateText(text, fromLang = 'en', toLang) {
  if (!client) throw new Error('Translator not initialized. Set an API key in Settings first.');

  const from = toGoogleLang(fromLang);
  const to = toGoogleLang(toLang);

  try {
    const [translation] = await client.translate(text, { from, to });
    return translation;
  } catch (err) {
    // Retry once after 1s
    await delay(1000);
    const [translation] = await client.translate(text, { from, to });
    return translation;
  }
}

/**
 * Translate multiple items with progress reporting.
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
      // Keep bare format specifiers as-is (e.g. "%d", "%@")
      if (baseValue.trim().match(/^%[@diouxefgcs]$/)) {
        results.set(key, baseValue);
      } else {
        const translated = await translateText(baseValue, fromLang, toLang);
        results.set(key, translated);
      }
    } catch (err) {
      // Fall back to the source value so the file stays valid
      results.set(key, baseValue);
    }

    if (onProgress) onProgress(i + 1, items.length);
  }

  return results;
}
