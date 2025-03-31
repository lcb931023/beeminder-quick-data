# Beeminder Quick Data Firefox Extension

A Firefox extension that allows you to quickly add data points to your Beeminder goals directly from your browser.

## Features

- View all your Beeminder goals in a popup interface
- Quickly add data points with values and comments
- Simple configuration through the extension options

## Installation

Since this is a development version, you'll need to load it as a temporary extension in Firefox:

1. Open Firefox and navigate to `about:debugging`
2. Click on "This Firefox" in the sidebar
3. Click on "Load Temporary Add-on..."
4. Navigate to the extension folder and select the `manifest.json` file

## Configuration

Before using the extension, you need to configure your Beeminder credentials:

1. Click on the extension icon in the toolbar
2. Click "Open Options" in the popup
3. Enter your Beeminder username
4. Enter your Beeminder API token (found in your [Beeminder account settings](https://www.beeminder.com/settings/account) under "API Key")
5. Click "Save"

## Usage

1. Click on the extension icon in the Firefox toolbar
2. You'll see a list of all your Beeminder goals
3. Click on a goal to add a data point to it
4. Enter the value and an optional comment
5. Click "Submit" to add the data point

## Development

### File Structure

- `manifest.json`: Extension manifest file
- `popup/`: Contains the files for the popup UI
  - `popup.html`: HTML structure of the popup
  - `popup.css`: Styling for the popup
  - `popup.js`: JavaScript for popup functionality
- `options/`: Contains the files for the options page
  - `options.html`: HTML structure of the options page
  - `options.css`: Styling for the options page
  - `options.js`: JavaScript for options functionality
- `background.js`: Background script for the extension
- `icons/`: Contains the extension icons

### Testing

To test changes during development:

1. Make your changes to the code
2. Go to `about:debugging` in Firefox
3. Find your extension in the list and click "Reload"

## Notes

- This extension only works with Firefox
- Your Beeminder credentials are stored in your browser's local storage
- The extension requires permission to access the Beeminder API
