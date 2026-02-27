import fs from 'fs';

/**
 * Write translated strings into an .xcstrings file for a specific language.
 * Reads the existing JSON, injects translations, and writes back atomically.
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

  const tempPath = filePath + '.tmp';
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  fs.renameSync(tempPath, filePath);
}
