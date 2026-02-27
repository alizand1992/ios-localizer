# iOS Localizer

A CLI tool that automatically detects missing translations in your iOS app's localization files and fills them in using Google Translate.

## Features

- **Interactive directory browser** — navigate to your iOS project without typing paths
- **Auto-detection** — finds all `.lproj` directories and `.strings` files automatically
- **Missing translation report** — compares all languages against your base language (`en`) and lists gaps
- **Google Translate integration** — free, no API key required
- **Safe writes** — creates `.strings.bak` backups before modifying any file
- **Selective translation** — choose which languages to translate or translate all at once

## Installation

```bash
cd ios-localizer
npm install
npm link   # makes `ios-translate` available globally
```

## Usage

```bash
ios-translate
```

Or without installing globally:

```bash
npm start
```

## How It Works

1. **Navigate** to your iOS project root using the interactive file browser
2. The tool scans for `*.lproj` directories (e.g., `en.lproj`, `fr.lproj`, `de.lproj`)
3. It parses all `.strings` files and identifies keys present in `en.lproj` but missing in other languages
4. You choose whether to translate all, select specific languages, or just view the report
5. Missing translations are fetched from Google Translate and appended to the target `.strings` files

## Supported Formats

- `Localizable.strings` — main app strings
- `InfoPlist.strings` — app name and permissions descriptions
- Any other `.strings` files inside `.lproj` directories

## iOS Language Codes

iOS uses language codes like `zh-Hans`, `zh-Hant`, `pt-BR` which are automatically mapped to the correct Google Translate codes.

## Notes

- Google Translate is free but rate-limited. Large projects may take a few minutes.
- Translations are appended to files, never overwriting existing translations.
- Always review auto-translated strings before shipping — machine translations may need adjustment for tone and context.
- Original files are backed up as `*.strings.bak` before any changes.

## Project Structure

```
├── bin/
│   └── ios-translate.js     # CLI entry point
├── src/
│   ├── index.js             # Main orchestration
│   ├── explorer.js          # Interactive directory browser
│   ├── translator.js        # Google Translate integration
│   ├── writer.js            # .strings file writer
│   ├── localization/
│   │   ├── detector.js      # .lproj directory scanner
│   │   ├── parser.js        # .strings file parser
│   │   └── diff.js          # Missing translation finder
│   └── ui/
│       └── display.js       # Terminal UI helpers
└── package.json
```
