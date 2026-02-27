import fs from 'fs';
import { parseStrings } from './parser.js';

/**
 * Find missing translations across all languages
 * @param {Array} localizationData - From detectLocalizationFiles()
 * @returns {{ base: string, missing: Array<{lang, lprojPath, stringsFile, stringsFilePath, missingKeys: Array<{key, baseValue}>}> }}
 */
export function findMissingTranslations(localizationData) {
  // Determine base language
  const baseLang = localizationData.find(l => l.lang === 'en')
    || localizationData.find(l => l.lang === 'Base')
    || localizationData[0];

  if (!baseLang) return { base: null, missing: [] };

  // Parse all .strings files for each language
  const parsedByLang = new Map();
  for (const langData of localizationData) {
    const parsedFiles = new Map();
    for (const sf of langData.stringsFiles) {
      try {
        const content = fs.readFileSync(sf.path, 'utf8');
        parsedFiles.set(sf.name, parseStrings(content));
      } catch (e) {
        parsedFiles.set(sf.name, new Map());
      }
    }
    parsedByLang.set(langData.lang, { langData, parsedFiles });
  }

  const baseParsed = parsedByLang.get(baseLang.lang);
  const missing = [];

  for (const [lang, { langData, parsedFiles }] of parsedByLang) {
    if (lang === baseLang.lang) continue;

    for (const [stringsFileName, baseTranslations] of baseParsed.parsedFiles) {
      const targetTranslations = parsedFiles.get(stringsFileName) || new Map();

      const missingKeys = [];
      for (const [key, baseValue] of baseTranslations) {
        if (!targetTranslations.has(key)) {
          missingKeys.push({ key, baseValue });
        }
      }

      if (missingKeys.length > 0) {
        // Find the path for this strings file in the target lang
        const targetStringsFile = langData.stringsFiles.find(sf => sf.name === stringsFileName);
        const stringsFilePath = targetStringsFile ? targetStringsFile.path
          : langData.lprojPath + '/' + stringsFileName;

        missing.push({
          lang,
          lprojPath: langData.lprojPath,
          stringsFile: stringsFileName,
          stringsFilePath,
          missingKeys,
        });
      }
    }
  }

  return { base: baseLang.lang, missing };
}
