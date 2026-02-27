import { execFileSync } from 'node:child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { password, select } from '@inquirer/prompts';
import chalk from 'chalk';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'ios-localizer');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const KEYCHAIN_SERVICE = 'ios-localizer';
const KEYCHAIN_ACCOUNT = os.userInfo().username;

// ── macOS Keychain helpers ────────────────────────────────────────────────────

function keychainSave(value) {
  // Delete any existing entry first so we can overwrite cleanly
  try {
    execFileSync('security', [
      'delete-generic-password',
      '-s', KEYCHAIN_SERVICE,
      '-a', KEYCHAIN_ACCOUNT,
    ], { stdio: 'ignore' });
  } catch { /* not found — fine */ }

  execFileSync('security', [
    'add-generic-password',
    '-s', KEYCHAIN_SERVICE,
    '-a', KEYCHAIN_ACCOUNT,
    '-w', value,
    '-T', '', // accessible only to this account
  ]);
}

function keychainLoad() {
  try {
    return execFileSync('security', [
      'find-generic-password',
      '-s', KEYCHAIN_SERVICE,
      '-a', KEYCHAIN_ACCOUNT,
      '-w',            // print password to stdout
    ], { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function keychainDelete() {
  try {
    execFileSync('security', [
      'delete-generic-password',
      '-s', KEYCHAIN_SERVICE,
      '-a', KEYCHAIN_ACCOUNT,
    ], { stdio: 'ignore' });
  } catch { /* not found — fine */ }
}

// ── Config I/O ────────────────────────────────────────────────────────────────

/**
 * Load settings. The API key is retrieved from the macOS Keychain — it is
 * never written to disk.
 */
export function loadSettings() {
  let fileSettings = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fileSettings = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch { /* ignore malformed config */ }

  const apiKey = keychainLoad();
  return { ...fileSettings, ...(apiKey ? { apiKey } : {}) };
}

/**
 * Save settings. The API key is stored in the macOS Keychain; everything else
 * goes to the config file (with mode 0o600).
 */
export function saveSettings(settings) {
  const { apiKey, ...rest } = settings;

  if (apiKey) {
    keychainSave(apiKey);
  } else {
    keychainDelete();
  }

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.chmodSync(CONFIG_DIR, 0o700);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(rest, null, 2) + '\n', {
    encoding: 'utf8',
    mode: 0o600,
  });
}

// ── Settings UI ───────────────────────────────────────────────────────────────

function maskKey(key) {
  if (!key || key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

export async function showSettingsMenu() {
  const settings = loadSettings();

  while (true) {
    console.log(chalk.bold('\n  Settings\n'));
    console.log(chalk.dim('  API key storage: ') + chalk.green('macOS Keychain') + chalk.dim(` (service: ${KEYCHAIN_SERVICE})`));
    console.log(
      chalk.dim('  Google Translate API key: ') +
      (settings.apiKey ? chalk.white(maskKey(settings.apiKey)) : chalk.yellow('not set')),
    );
    console.log('');

    const action = await select({
      message: 'Settings:',
      choices: [
        { name: '  Update API key', value: 'update' },
        { name: '  Remove API key', value: 'remove', disabled: !settings.apiKey },
        { name: '  Back', value: 'back' },
      ],
    });

    if (action === 'back') break;

    if (action === 'remove') {
      keychainDelete();
      settings.apiKey = null;
      console.log(chalk.yellow('\n  API key removed from Keychain.\n'));
    }

    if (action === 'update') {
      console.log('');
      if (!settings.apiKey) {
        console.log(chalk.dim('  Get an API key at:'));
        console.log(chalk.cyan('  https://console.cloud.google.com/apis/library/translate.googleapis.com'));
        console.log('');
      }

      const newKey = await password({
        message: settings.apiKey
          ? `New API key (enter to keep ${maskKey(settings.apiKey)}):`
          : 'Google Translate API key:',
        mask: '*',
      });

      if (newKey && newKey.trim()) {
        settings.apiKey = newKey.trim();
        keychainSave(settings.apiKey);
        console.log(chalk.green('\n  ✓ API key saved to Keychain.\n'));
      } else {
        console.log(chalk.dim('\n  No change.\n'));
      }
    }
  }

  return settings;
}
