import fs from 'fs';
import { parseXCStrings, getLanguages } from './parser.js';

/**
 * Find missing translations across all .xcstrings files
 * @param {Array<{name: string, path: string}>} xcstringsFiles - From detectLocalizationFiles()
 * @returns {{ base: string, languages: string[], missing: Array<{xcstringsPath, xcstringsName, lang, missingKeys: Array<{key, baseValue}>}> }}
 */
export function findMissingTranslations(xcstringsFiles) {
  const missing = [];
  let base = 'en';
  const allLanguages = new Set();

  for (const file of xcstringsFiles) {
    let data;
    try {
      const content = fs.readFileSync(file.path, 'utf8');
      data = parseXCStrings(content);
    } catch (e) {
      continue;
    }

    base = data.sourceLanguage;
    const strings = data.strings;

    // Collect all languages mentioned in this file
    const fileLangs = getLanguages(strings);
    for (const lang of fileLangs) allLanguages.add(lang);

    // For each non-base language, find keys missing a localization
    const targetLangs = fileLangs.filter(l => l !== base);

    for (const lang of targetLangs) {
      const missingKeys = [];

      for (const [key, entry] of Object.entries(strings)) {
        const localizations = entry.localizations || {};

        // Skip keys that use plural variations (not a simple stringUnit)
        if (localizations[base] && !localizations[base].stringUnit) continue;

        const baseValue = localizations[base]?.stringUnit?.value ?? key;

        if (!localizations[lang]) {
          missingKeys.push({ key, baseValue });
        }
      }

      if (missingKeys.length > 0) {
        missing.push({
          xcstringsPath: file.path,
          xcstringsName: file.name,
          lang,
          missingKeys,
        });
      }
    }
  }

  return { base, languages: [...allLanguages].sort(), missing };
}
