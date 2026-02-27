import fs from 'fs';

/**
 * Scan all localizations objects in the file and return languages in the order
 * they first appear. This is the canonical ordering used by the existing file.
 */
function detectLangOrder(strings) {
  const seen = new Set();
  const order = [];
  for (const entry of Object.values(strings)) {
    for (const lang of Object.keys(entry.localizations || {})) {
      if (!seen.has(lang)) {
        seen.add(lang);
        order.push(lang);
      }
    }
  }
  return order;
}

/**
 * Return a copy of a localizations object with keys sorted according to
 * langOrder. Languages not yet in langOrder are appended at the end.
 */
function sortedLocalizations(localizations, langOrder) {
  const result = {};
  for (const lang of langOrder) {
    if (lang in localizations) result[lang] = localizations[lang];
  }
  for (const lang of Object.keys(localizations)) {
    if (!(lang in result)) result[lang] = localizations[lang];
  }
  return result;
}

/**
 * Write translated strings into an .xcstrings file for a specific language.
 * Reads the existing JSON, injects translations, and writes back atomically.
 * Language key ordering within each localizations object is preserved.
 * @param {string} filePath - Path to the .xcstrings file
 * @param {string} lang - Target language code (e.g. "fr", "de")
 * @param {Map<string, string>} translations - key -> translated value
 */
export async function writeTranslations(filePath, lang, translations) {
  if (translations.size === 0) return;

  const content = fs.readFileSync(filePath, 'utf8');

  // Backup before first write (overwrite any stale backup)
  fs.writeFileSync(filePath + '.bak', content, 'utf8');

  const data = JSON.parse(content);

  // Capture ordering from the file before we touch anything
  const langOrder = detectLangOrder(data.strings);

  // Insert new translations
  for (const [key, value] of translations) {
    if (!data.strings[key]) data.strings[key] = {};
    if (!data.strings[key].localizations) data.strings[key].localizations = {};

    data.strings[key].localizations[lang] = {
      stringUnit: {
        state: 'translated',
        value,
      },
    };
  }

  // Re-sort localizations for every key we touched, using the detected order
  // (the new lang slots in at wherever it sits in langOrder, or end if new)
  const effectiveLangOrder = langOrder.includes(lang) ? langOrder : [...langOrder, lang];
  for (const key of translations.keys()) {
    if (data.strings[key]?.localizations) {
      data.strings[key].localizations = sortedLocalizations(
        data.strings[key].localizations,
        effectiveLangOrder,
      );
    }
  }

  const tempPath = filePath + '.tmp';
  const json = JSON.stringify(data, null, 2).replace(/": /g, '" : ') + '\n';
  fs.writeFileSync(tempPath, json, 'utf8');
  fs.renameSync(tempPath, filePath);
}
