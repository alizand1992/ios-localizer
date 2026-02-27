import { browseForDirectory } from './explorer.js';
import { detectLocalizationFiles } from './localization/detector.js';
import { findMissingTranslations } from './localization/diff.js';
import { initTranslator, translateBatch } from './translator.js';
import { writeTranslations } from './writer.js';
import { showBanner, showLanguageTable, showMissingTranslations, showSuccess, showError, showInfo } from './ui/display.js';
import { loadSettings, showSettingsMenu } from './settings.js';
import { select, checkbox } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';

export async function run() {
  showBanner();

  // Main menu loop — allows returning to the menu from Settings
  while (true) {
    const settings = loadSettings();
    const hasApiKey = Boolean(settings.apiKey);

    const mainAction = await select({
      message: 'What would you like to do?',
      choices: [
        {
          name: hasApiKey
            ? '  Translate iOS App'
            : '  Translate iOS App  ' + chalk.yellow('[API key required]'),
          value: 'translate',
        },
        { name: '  Settings', value: 'settings' },
        { name: '  Exit', value: 'exit' },
      ],
    });

    if (mainAction === 'exit') {
      console.log('');
      process.exit(0);
    }

    if (mainAction === 'settings') {
      await showSettingsMenu();
      continue; // loop back to main menu
    }

    // — Translate flow —

    if (!hasApiKey) {
      showError('No API key set. Please configure one in Settings first.');
      continue;
    }

    initTranslator(settings.apiKey);

    // Navigate to iOS project, retry until .xcstrings files are found
    let localizationData;
    while (true) {
      showInfo('Navigate to your iOS project directory:');
      const projectDir = await browseForDirectory();
      console.log(chalk.dim(`\n  Selected: ${projectDir}\n`));

      const spinner = ora('Scanning for localization files...').start();
      try {
        localizationData = await detectLocalizationFiles(projectDir);
        spinner.stop();
      } catch (err) {
        spinner.fail('Failed to scan: ' + err.message);
        process.exit(1);
      }

      if (localizationData && localizationData.length > 0) break;

      showError('No .xcstrings files found in this directory or any subdirectory.');
      showInfo('Make sure you selected the root of an iOS project, then try again.\n');
    }

    // Parse and diff
    const { base, languages, missing } = findMissingTranslations(localizationData);
    showLanguageTable(localizationData, languages, base);
    showInfo(`Base language: ${chalk.bold(base)}`);
    showMissingTranslations(missing);

    if (missing.length === 0) {
      showSuccess('Nothing to do. All translations are complete!');
      console.log('');
      continue; // back to main menu
    }

    const totalMissing = missing.reduce((sum, m) => sum + m.missingKeys.length, 0);
    showInfo(`Found ${chalk.yellow.bold(totalMissing)} missing translation(s) across ${chalk.yellow.bold(missing.length)} file(s).`);

    // Action prompt
    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: '  Translate all missing entries automatically', value: 'all' },
        { name: '  Select which languages to translate', value: 'select' },
        { name: '  Back to main menu', value: 'back' },
      ],
    });

    if (action === 'back') continue;

    // Determine which items to process
    let toTranslate = missing;

    if (action === 'select') {
      const langSet = [...new Set(missing.map(m => m.lang))];
      const selectedLangs = await checkbox({
        message: 'Select languages to translate:',
        choices: langSet.map(lang => {
          const count = missing.filter(m => m.lang === lang).reduce((s, m) => s + m.missingKeys.length, 0);
          return { name: `${lang.padEnd(12)} (${count} missing)`, value: lang, checked: true };
        }),
      });

      if (selectedLangs.length === 0) {
        showInfo('No languages selected.\n');
        continue;
      }

      toTranslate = missing.filter(m => selectedLangs.includes(m.lang));
    }

    // Translate and write
    console.log('');
    let totalWritten = 0;
    let totalErrors = 0;

    for (const item of toTranslate) {
      const fileSpinner = ora(`Translating ${item.lang} / ${item.xcstringsName} (${item.missingKeys.length} keys)...`).start();

      try {
        const translations = await translateBatch(
          item.missingKeys,
          base,
          item.lang,
          (done, total) => {
            fileSpinner.text = `Translating ${item.lang} / ${item.xcstringsName}: ${done}/${total}`;
          },
        );

        await writeTranslations(item.xcstringsPath, item.lang, translations);
        fileSpinner.succeed(`${item.lang} / ${item.xcstringsName}: wrote ${translations.size} translation(s)`);
        totalWritten += translations.size;
      } catch (err) {
        fileSpinner.fail(`${item.lang} / ${item.xcstringsName}: ${err.message}`);
        totalErrors++;
      }
    }

    // Summary
    console.log('');
    if (totalWritten > 0) {
      showSuccess(`Done! Wrote ${chalk.bold(totalWritten)} translation(s).`);
      showInfo('Backups saved as .xcstrings.bak next to each modified file.');
    }
    if (totalErrors > 0) {
      showError(`${totalErrors} file(s) had errors. Check output above.`);
    }
    console.log('');
  }
}
