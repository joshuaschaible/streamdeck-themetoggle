# 🌗 Dark Mode Toggle — Stream Deck Plugin

Toggle Windows 10/11 **Light ⇄ Dark mode** with a single button press on your Stream Deck.

![Plugin preview](com.custom.darkmodetoggle.sdPlugin/images/pluginIcon@2x.png)

## Features

- **One-press toggle** between Light and Dark mode
- Changes **both** the app theme and system theme (taskbar, Start menu)
- **No admin rights** required — uses per-user registry keys (HKCU)
- **Instant** — Windows applies the change immediately
- **Auto-detect** — button state syncs with your current theme on startup
- Works on **Windows 10** and **Windows 11**

## Requirements

- **Stream Deck software** v6.5 or later (for Node.js plugin support)
- **Windows 10** or **Windows 11**
- **Stream Deck hardware** (any model)

## Installation

### Option A: Installer Script (Recommended)

1. **Close** the Stream Deck application (right-click system tray icon → Quit)
2. **Double-click** `install.bat`
3. **Start** the Stream Deck application
4. Find **"Dark Mode Toggle"** in the **System** category in the action list
5. **Drag** it onto any button — done!

### Option B: Manual Install

1. **Close** the Stream Deck application
2. Copy the `com.custom.darkmodetoggle.sdPlugin` folder to:
   ```
   %APPDATA%\Elgato\StreamDeck\Plugins\
   ```
3. **Start** the Stream Deck application

## Usage

Just press the button! It will:

1. Detect your current Windows theme (Light or Dark)
2. Switch to the opposite theme
3. Update the button icon and label to reflect the new state

| Button State | Icon | Meaning |
|---|---|---|
| State 0 | ☀️ Sun on dark bg | Currently in **Light** mode (press to go Dark) |
| State 1 | 🌙 Moon on light bg | Currently in **Dark** mode (press to go Light) |

## How It Works

The plugin modifies two Windows registry values (per-user, no admin needed):

```
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize
  ├─ AppsUseLightTheme     (0 = Dark, 1 = Light)
  └─ SystemUsesLightTheme  (0 = Dark, 1 = Light)
```

Windows listens for changes to these values and applies the new theme instantly.

## Architecture

```
Button Press
  → Stream Deck sends keyDown via WebSocket
  → plugin.js receives the event
  → Node.js child_process reads current registry value (reg query)
  → Flips the value and writes it back (reg add)
  → Windows applies theme change instantly
  → Button state updates to reflect new mode
```

## Uninstall

1. **Close** the Stream Deck application
2. **Double-click** `uninstall.bat`
   — or manually delete the folder from `%APPDATA%\Elgato\StreamDeck\Plugins\`
3. **Start** the Stream Deck application

## Troubleshooting

**Plugin doesn't appear in Stream Deck:**
- Make sure the folder name is exactly `com.custom.darkmodetoggle.sdPlugin`
- Check it's in the correct path: `%APPDATA%\Elgato\StreamDeck\Plugins\`
- Restart the Stream Deck application

**Theme doesn't change:**
- Open Registry Editor and verify the keys exist at the path shown above
- Try running `reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize"` in a terminal

**Button state is wrong after startup:**
- Press the button once to resync — it reads the actual registry value on each press

## Project Structure

```
streamdeck-darkmode-toggle/
├── install.bat                          # One-click installer
├── uninstall.bat                        # One-click uninstaller
├── README.md                            # This file
└── com.custom.darkmodetoggle.sdPlugin/  # The plugin
    ├── manifest.json                    # Plugin metadata
    ├── plugin.js                        # Node.js backend (theme toggle logic)
    ├── property-inspector.html          # Settings panel UI
    └── images/                          # Icons
        ├── pluginIcon.png / @2x.png
        ├── categoryIcon.png / @2x.png
        ├── actionIcon.png / @2x.png
        ├── lightMode.png / @2x.png
        └── darkMode.png / @2x.png
```

## License

MIT — use freely, modify as you like.
