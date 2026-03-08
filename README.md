# iOS Localizer

A CLI tool that automatically detects missing translations in your iOS app's Xcode String Catalog files and fills them in using the Google Cloud Translation API.

## Features

- **Interactive directory browser** — navigate to your iOS project without typing paths
- **Auto-detection** — finds all `.xcstrings` (Xcode String Catalog) files automatically
- **Missing translation report** — compares all languages against your base language and lists gaps
- **Google Cloud Translation** — powered by the official Google Translate API v2
- **Safe writes** — creates `.xcstrings.bak` backups before modifying any file
- **Selective translation** — choose which languages to translate or translate all at once
- **Secure API key storage** — your API key is stored in the macOS Keychain, never on disk

## Requirements

- **macOS** (Keychain integration is macOS-only)
- **Node.js** v18+
- A **Google Cloud Translation API key** — see [Getting an API Key](#getting-an-api-key) below

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

## Getting an API Key

This tool uses the [Google Cloud Translation API](https://cloud.google.com/translate), which requires an API key and is a paid service (with a free monthly quota).

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/library/translate.googleapis.com)
2. Enable the **Cloud Translation API** for your project
3. Create an API key under **APIs & Services → Credentials**
4. Add the key in the tool via **Settings → Update API key**

Your API key is stored securely in the macOS Keychain and is never written to disk.

## How It Works

1. **Configure** your Google Translate API key via the Settings menu (first-time setup)
2. **Navigate** to your iOS project root using the interactive file browser
3. The tool scans for `*.xcstrings` files (Xcode String Catalogs)
4. It parses each catalog and identifies keys present in the source language but missing in other languages
5. You choose to translate all missing entries, select specific languages, or return to the menu
6. Missing translations are fetched from Google Translate and written back into the `.xcstrings` file

## Supported Format

- `.xcstrings` — Xcode String Catalog (introduced in Xcode 15)

> **Note:** This tool does not support the legacy `.strings` / `.lproj` format.

## iOS Language Codes

iOS uses language codes like `zh-Hans`, `zh-Hant`, `pt-BR` which are automatically mapped to the correct Google Translate codes.

## Notes

- Google Cloud Translation API usage is billed per character after the free monthly quota.
- Translations are merged into the existing catalog — existing translations are never overwritten.
- Always review auto-translated strings before shipping — machine translations may need adjustment for tone and context.
- Original files are backed up as `*.xcstrings.bak` before any changes.
- Format specifiers (e.g. `%@`, `%d`) are passed through untranslated.
- Keys using plural variations are skipped (only simple `stringUnit` entries are translated).

## Project Structure

```
├── bin/
│   └── ios-translate.js     # CLI entry point
├── src/
│   ├── index.js             # Main orchestration
│   ├── explorer.js          # Interactive directory browser
│   ├── translator.js        # Google Cloud Translation API integration
│   ├── writer.js            # .xcstrings file writer
│   ├── settings.js          # API key management (macOS Keychain)
│   ├── localization/
│   │   ├── detector.js      # .xcstrings file scanner
│   │   ├── parser.js        # .xcstrings file parser
│   │   └── diff.js          # Missing translation finder
│   └── ui/
│       └── display.js       # Terminal UI helpers
└── package.json
```
