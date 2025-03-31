# Beeminder Quick Data Firefox Extension

Firefox extension for one-click Beeminder data entry directly from your browser.

## Features

- One-click data entry with customizable default values
- Goals sorted by urgency with color-coded indicators
- Checkmarks for goals that have met daily rate
- Auto-includes current tab title in comments

## Setup

1. Load as temporary add-on in Firefox via `about:debugging`
2. Click the extension icon and select "Open Options"
3. Enter your Beeminder username and API token
4. Set default values for goals (optional)
5. Click "Save"

## Usage

1. Click the extension icon
2. Click "+X" next to any goal to instantly log data
3. The current tab's title will be included in the comment

## Structure

- `manifest.json`: Extension configuration
- `popup/`: UI files (HTML, JS, CSS)
- `options/`: Settings page files
- `background.js`: Background script
- `icons/`: Extension icons
