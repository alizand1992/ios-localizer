import { glob } from 'glob';
import fs from 'fs';
import path from 'path';

/**
 * Find all .lproj directories and their .strings files
 * @param {string} rootPath - Root directory to search from
 * @returns {Array<{lang, lprojPath, stringsFiles: Array<{name, path}>}>}
 */
export async function detectLocalizationFiles(rootPath) {
  // Find all *.lproj directories
  const lprojDirs = await glob('**/*.lproj', {
    cwd: rootPath,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/Pods/**', '**/build/**', '**/DerivedData/**'],
    onlyDirectories: true,
  });

  if (lprojDirs.length === 0) return [];

  const result = [];

  for (const lprojPath of lprojDirs) {
    const dirName = path.basename(lprojPath);
    const lang = dirName.replace('.lproj', '');

    // Find .strings files in this .lproj directory
    let stringsFiles = [];
    try {
      const entries = fs.readdirSync(lprojPath);
      stringsFiles = entries
        .filter(f => f.endsWith('.strings'))
        .map(f => ({ name: f, path: path.join(lprojPath, f) }));
    } catch (e) {
      // skip unreadable dirs
    }

    if (stringsFiles.length > 0) {
      result.push({ lang, lprojPath, stringsFiles });
    }
  }

  // Sort: base languages first
  const baseFirst = ['en', 'Base'];
  result.sort((a, b) => {
    const aIdx = baseFirst.indexOf(a.lang);
    const bIdx = baseFirst.indexOf(b.lang);
    if (aIdx !== -1 && bIdx === -1) return -1;
    if (aIdx === -1 && bIdx !== -1) return 1;
    return a.lang.localeCompare(b.lang);
  });

  return result;
}
