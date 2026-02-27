#!/usr/bin/env node
import { run } from '../src/index.js';
import { showGoodbye } from '../src/ui/display.js';
import chalk from 'chalk';

// Ctrl+C outside of a prompt (e.g. during a spinner)
process.on('SIGINT', () => {
  showGoodbye();
  process.exit(0);
});

try {
  await run();
} catch (err) {
  // Inquirer throws ExitPromptError when the user presses Ctrl+C inside a prompt
  if (err.name === 'ExitPromptError') {
    showGoodbye();
    process.exit(0);
  }
  console.error(chalk.red('\n  Unexpected error: ') + err.message);
  process.exit(1);
}
