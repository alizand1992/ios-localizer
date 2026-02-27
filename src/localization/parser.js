/**
 * Parse an .xcstrings file (Xcode String Catalog — JSON format)
 * @param {string} content - File content
 * @returns {{ sourceLanguage: string, strings: object, version: string }}
 */
export function parseXCStrings(content) {
  const data = JSON.parse(content);
  return {
    sourceLanguage: data.sourceLanguage || 'en',
    strings: data.strings || {},
    version: data.version || '1.0',
  };
}

/**
 * Collect all languages present in an .xcstrings strings object
 * @param {object} strings - The parsed strings object
 * @returns {string[]}
 */
export function getLanguages(strings) {
  const langs = new Set();
  for (const entry of Object.values(strings)) {
    for (const lang of Object.keys(entry.localizations || {})) {
      langs.add(lang);
    }
  }
  return [...langs].sort();
}
