import chalk from 'chalk';

export function showBanner() {
  console.log('');
  console.log(chalk.cyan('╔══════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.white.bold('        iOS Localizer  v1.0.0         ') + chalk.cyan('║'));
  console.log(chalk.cyan('║') + chalk.dim('  Auto-fill missing translations      ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚══════════════════════════════════════╝'));
  console.log('');
}

export function showLanguageTable(xcstringsFiles, languages, base) {
  console.log(chalk.bold('\n  Found .xcstrings files:\n'));
  for (const { name } of xcstringsFiles) {
    console.log(chalk.white(`    ${name}`));
  }

  console.log(chalk.bold('\n  Languages:\n'));
  for (const lang of languages) {
    const isBase = lang === base;
    const label = isBase
      ? chalk.green.bold(`  ${lang.padEnd(12)}`) + chalk.dim('(base)')
      : chalk.white(`  ${lang.padEnd(12)}`);
    console.log(label);
  }
  console.log('');
}

export function showMissingTranslations(missingData) {
  if (missingData.length === 0) {
    console.log(chalk.green('\n  ✓ All translations are complete!\n'));
    return;
  }

  console.log(chalk.yellow.bold('\n  Missing translations:\n'));

  // Group by language
  const byLang = new Map();
  for (const item of missingData) {
    if (!byLang.has(item.lang)) byLang.set(item.lang, []);
    byLang.get(item.lang).push(item);
  }

  for (const [lang, items] of byLang) {
    const totalMissing = items.reduce((sum, i) => sum + i.missingKeys.length, 0);
    console.log(chalk.yellow(`  ${lang}`) + chalk.dim(` — ${totalMissing} missing key(s)`));
    for (const item of items) {
      console.log(chalk.dim(`    ${item.xcstringsName}: ${item.missingKeys.length} keys`));
    }
  }
  console.log('');
}

export function showProgress(current, total, lang) {
  const pct = Math.round((current / total) * 100);
  const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
  process.stdout.write(`\r  ${chalk.cyan(lang)}: [${bar}] ${pct}% (${current}/${total})`);
  if (current === total) process.stdout.write('\n');
}

export function showSuccess(message) {
  console.log(chalk.green('  ✓ ') + message);
}

export function showError(message) {
  console.log(chalk.red('  ✗ ') + message);
}

export function showInfo(message) {
  console.log(chalk.cyan('  → ') + message);
}

export function showGoodbye() {
  console.log(chalk.dim('\n  Goodbye!\n'));
}
