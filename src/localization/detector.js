import { glob } from 'glob';
import path from 'path';

/**
 * Find all .xcstrings files in an iOS project
 * @param {string} rootPath - Root directory to search from
 * @returns {Array<{name: string, path: string}>}
 */
export async function detectLocalizationFiles(rootPath) {
  const files = await glob('**/*.xcstrings', {
    cwd: rootPath,
    absolute: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/Pods/**', '**/build/**', '**/DerivedData/**'],
  });

  return files.map(p => ({ name: path.basename(p), path: p })).sort((a, b) => a.name.localeCompare(b.name));
}
