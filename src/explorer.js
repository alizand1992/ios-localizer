import { select } from '@inquirer/prompts';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function browseForDirectory(startDir) {
  const fallback = os.homedir();
  let currentDir =
    startDir && fs.existsSync(startDir) && fs.statSync(startDir).isDirectory()
      ? startDir
      : fallback;

  while (true) {
    console.log(chalk.cyan('\n  Current directory: ') + chalk.white.bold(currentDir));

    // Read subdirectories
    let subdirs = [];
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      subdirs = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => e.name)
        .sort();
    } catch (e) {
      console.log(chalk.red('  Cannot read directory: ') + e.message);
    }

    const choices = [
      { name: chalk.green('✓  Select this directory'), value: '__SELECT__' },
    ];

    const parentDir = path.dirname(currentDir);
    if (parentDir !== currentDir) {
      choices.push({ name: chalk.yellow('↑  Go up (..)'), value: '__UP__' });
    }

    for (const dir of subdirs) {
      choices.push({ name: '   ' + dir, value: dir });
    }

    choices.push({ name: chalk.red('✕  Exit'), value: '__EXIT__' });

    const answer = await select({
      message: 'Navigate to your iOS project directory:',
      choices,
      pageSize: 15,
    });

    if (answer === '__SELECT__') {
      return currentDir;
    } else if (answer === '__UP__') {
      currentDir = parentDir;
    } else if (answer === '__EXIT__') {
      return null;
    } else {
      currentDir = path.join(currentDir, answer);
    }
  }
}
