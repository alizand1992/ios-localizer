/**
 * Parse a .strings file content into a Map of key -> value
 * @param {string} content - File content
 * @returns {Map<string, string>}
 */
export function parseStrings(content) {
  const map = new Map();

  // Remove block comments /* ... */
  let cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove line comments // ...
  cleaned = cleaned.replace(/\/\/[^\n]*/g, '');

  // Match "key" = "value"; patterns
  // Handle escaped quotes inside strings
  const regex = /"((?:[^"\\]|\\.)*)"\s*=\s*"((?:[^"\\]|\\.)*)"\s*;/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const key = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const value = match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
    map.set(key, value);
  }

  return map;
}

/**
 * Serialize a Map of translations to .strings format
 * @param {Map<string, string>} translations
 * @returns {string}
 */
export function serializeStrings(translations) {
  const lines = [];
  for (const [key, value] of translations) {
    const escapedKey = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const escapedValue = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
    lines.push(`"${escapedKey}" = "${escapedValue}";`);
  }
  return lines.join('\n');
}
