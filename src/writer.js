import fs from 'fs';
import path from 'path';

/**
 * Append new translations to a .strings file
 * @param {string} filePath - Path to .strings file
 * @param {Map<string, string>} translations - key -> translated value
 * @param {boolean} createIfMissing - Create the file if it doesn't exist
 */
export async function writeTranslations(filePath, translations, createIfMissing = true) {
  if (translations.size === 0) return;

  const date = new Date().toISOString().split('T')[0];

  let existingContent = '';
  if (fs.existsSync(filePath)) {
    existingContent = fs.readFileSync(filePath, 'utf8');
    // Make backup
    fs.writeFileSync(filePath + '.bak', existingContent, 'utf8');
  } else if (createIfMissing) {
    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  } else {
    throw new Error(`File not found: ${filePath}`);
  }

  const newLines = [
    '',
    `/* Added by ios-localizer on ${date} */`,
  ];

  for (const [key, value] of translations) {
    const escapedKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const escapedValue = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    newLines.push(`"${escapedKey}" = "${escapedValue}";`);
  }

  const appendContent = newLines.join('\n') + '\n';
  const finalContent = existingContent + appendContent;

  // Write to temp file then rename (atomic write)
  const tempPath = filePath + '.tmp';
  fs.writeFileSync(tempPath, finalContent, 'utf8');
  fs.renameSync(tempPath, filePath);
}
