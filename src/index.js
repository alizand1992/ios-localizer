import { browseForDirectory } from './explorer.js';
import { detectLocalizationFiles } from './localization/detector.js';
import { findMissingTranslations } from './localization/diff.js';
import { translateBatch } from './translator.js';
import { writeTranslations } from './writer.js';
import { showBanner, showLanguageTable, showMissingTranslations, showProgress, showSuccess, showError, showInfo } from './ui/display.js';
import { select, checkbox } from '@inquirer/prompts';
import ora from 'ora';
import chalk from 'chalk';

export async function run() {
  showBanner();

  // Step 1: Navigate to iOS project
  showInfo('Navigate to your iOS project directory:');
  const projectDir = await browseForDirectory();
  console.log(chalk.dim(`\n  Selected: ${projectDir}\n`));

  // Step 2: Detect localization files
  const spinner = ora('Scanning for localization files...').start();
  let localizationData;
  try {
    localizationData = await detectLocalizationFiles(projectDir);
    spinner.stop();
  } catch (err) {
    spinner.fail('Failed to scan: ' + err.message);
    process.exit(1);
  }

  if (!localizationData || localizationData.length === 0) {
    showError('No .lproj localization directories found in this project.');
    showInfo('Make sure you selected the root of an iOS project.');
    process.exit(1);
  }

  // Step 3: Show found languages
  showLanguageTable(localizationData);

  // Step 4: Find missing translations
  const { base, missing } = findMissingTranslations(localizationData);
  showInfo(`Base language: ${chalk.bold(base)}`);
  showMissingTranslations(missing);

  if (missing.length === 0) {
    showSuccess('Nothing to do. All translations are complete!');
    process.exit(0);
  }

  const totalMissing = missing.reduce((sum, m) => sum + m.missingKeys.length, 0);
  showInfo(`Found ${chalk.yellow.bold(totalMissing)} missing translation(s) across ${chalk.yellow.bold(missing.length)} file(s).`);

  // Step 5: Ask what to do
  const action = await select({
    message: 'What would you like to do?',
    choices: [
      { name: '  Translate all missing entries automatically', value: 'all' },
      { name: '  Select which languages to translate', value: 'select' },
      { name: '  Just show the report, exit without translating', value: 'none' },
    ],
  });

  if (action === 'none') {
    showInfo('Exiting without changes. Tip: re-run to translate later.');
    process.exit(0);
  }

  // Step 6: Determine which missing items to process
  let toTranslate = missing;

  if (action === 'select') {
    // Group by language for selection
    const langSet = [...new Set(missing.map(m => m.lang))];
    const selectedLangs = await checkbox({
      message: 'Select languages to translate:',
      choices: langSet.map(lang => {
        const count = missing.filter(m => m.lang === lang).reduce((s, m) => s + m.missingKeys.length, 0);
        return { name: `${lang.padEnd(12)} (${count} missing)`, value: lang, checked: true };
      }),
    });

    if (selectedLangs.length === 0) {
      showInfo('No languages selected. Exiting.');
      process.exit(0);
    }

    toTranslate = missing.filter(m => selectedLangs.includes(m.lang));
  }

  // Step 7: Translate and write
  console.log('');
  let totalWritten = 0;
  let totalErrors = 0;

  for (const item of toTranslate) {
    const fileSpinner = ora(`Translating ${item.lang} / ${item.stringsFile} (${item.missingKeys.length} keys)...`).start();

    try {
      const translations = await translateBatch(
        item.missingKeys,
        base,
        item.lang,
        (done, total) => {
          fileSpinner.text = `Translating ${item.lang} / ${item.stringsFile}: ${done}/${total}`;
        }
      );

      await writeTranslations(item.stringsFilePath, translations, true);
      fileSpinner.succeed(`${item.lang} / ${item.stringsFile}: wrote ${translations.size} translation(s)`);
      totalWritten += translations.size;
    } catch (err) {
      fileSpinner.fail(`${item.lang} / ${item.stringsFile}: ${err.message}`);
      totalErrors++;
    }
  }

  // Step 8: Summary
  console.log('');
  if (totalWritten > 0) {
    showSuccess(`Done! Wrote ${chalk.bold(totalWritten)} translation(s).`);
    showInfo('Backups saved as .strings.bak next to each modified file.');
  }
  if (totalErrors > 0) {
    showError(`${totalErrors} file(s) had errors. Check output above.`);
  }
  console.log('');
}
