# ThemeToggle — Stream Deck Plugin

Toggle system-wide **Light/Dark mode** with a single button press on your Stream Deck.

Works on **Windows** and **macOS**.

## Features

- **One-press toggle** between Light and Dark mode
- **Cross-platform** — works on Windows 10/11 and macOS (Catalina+)
- **No admin rights** required
- **Instant** — theme changes are applied immediately
- **Auto-detect** — button icon syncs with your current theme on startup

## Requirements

- **Stream Deck software** v6.5 or later
- **Windows 10/11** or **macOS 10.15+**
- **Stream Deck hardware** (any model)

## Installation

### Developer Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the plugin:
   ```bash
   npm run build
   ```
3. Link to Stream Deck (requires the [Stream Deck CLI](https://www.npmjs.com/package/@elgato/cli)):
   ```bash
   streamdeck link com.custom.themetoggle.sdPlugin
   ```
4. Find **"Toggle Theme"** in the **System** category in the action list
5. Drag it onto any button

### Manual Install

1. Close the Stream Deck application
2. Build the plugin (see above)
3. Copy the `com.custom.themetoggle.sdPlugin` folder to:
   - **Windows:** `%APPDATA%\Elgato\StreamDeck\Plugins\`
   - **macOS:** `~/Library/Application Support/com.elgato.StreamDeck/Plugins/`
4. Start the Stream Deck application

## Usage

Just press the button! It will:

1. Detect your current system theme (Light or Dark)
2. Switch to the opposite theme
3. Update the button icon to reflect the new state

## How It Works

### Windows
Modifies two registry values (per-user, no admin needed):
```
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize
  AppsUseLightTheme     (0 = Dark, 1 = Light)
  SystemUsesLightTheme  (0 = Dark, 1 = Light)
```

### macOS
Uses AppleScript via `osascript` to toggle System Events appearance preferences. Reads the current mode with `defaults read -g AppleInterfaceStyle`.

## Project Structure

```
streamdeck-themetoggle/
  src/
    plugin.ts                         # Entry point
    actions/
      toggle-dark-mode.ts             # Toggle action logic
  com.custom.themetoggle.sdPlugin/
    manifest.json                     # Plugin manifest
    property-inspector.html           # Settings panel UI
    bin/
      plugin.js                       # Compiled output (built by Rollup)
    images/
      pluginIcon.png / @2x.png
      categoryIcon.png / @2x.png
      actionIcon.png / @2x.png
      lightMode.png / @2x.png
      darkMode.png / @2x.png
  package.json
  rollup.config.mjs
  tsconfig.json
```

## Uninstall

```bash
streamdeck unlink com.custom.themetoggle
```

Or manually delete the plugin folder from the Plugins directory and restart Stream Deck.

## License

MIT
