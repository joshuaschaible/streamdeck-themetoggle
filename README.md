THEME TOGGLE 1.1.0 - Stream Deck plugin

Toggle system and application light/dark appearance with one key. The sun shows
light mode, the moon shows dark mode. All visible keys follow external changes
within approximately five seconds. User presses are queued rather than dropped.

REQUIREMENTS AND STATUS
Stream Deck 6.6+ with its bundled Node.js 20 runtime.
Windows 10/11; macOS manifest minimum 10.15 on Intel (Apple silicon requires 11+).
The installed Stream Deck version must also support your OS.
Windows read behavior and the packaged protocol were tested on Windows.
macOS commands and failure paths have mocked tests only: real Mac verification
is still required before treating the Mac implementation as release-verified.

WINDOWS
The existing PowerShell helper is unchanged. It updates the current user's
AppsUseLightTheme and SystemUsesLightTheme settings and broadcasts a refresh.
No administrator access is required. Some apps may need to reopen.

MACOS
Polling reads AppleInterfaceStyle through Foundation/NSUserDefaults using
osascript JavaScript for Automation; polling sends no Apple Events.
A button press uses System Events appearance preferences to invert dark mode
and checks the result before updating the icon. macOS may request Automation
permission to control System Events. Review that request yourself; the plugin
does not change security settings. Denial, command failure, timeout, or an invalid
response produces an alert instead of a false success. Commands time out after
15 seconds. If the first permission prompt takes longer, respond and press again.
Automatic appearance scheduling may change the theme again later.

BUILD AND PACKAGE
Use Node.js 20 and a standard npm installation:
  npm install
  npm test
  npm run build
  npm run pack
The package is written to dist/1.1.0/com.badbadrobot.windowstheme.streamDeckPlugin.
Packing does not install or start the plugin. When ready, manually open the
package in Stream Deck and add Theme Toggle > Light / Dark Mode to a key.
Original 1.0.5 packages are retained locally in dist/.
A read-only native/protocol check is available with:
  node scripts/smoke-read.cjs
This launches the built plugin against a local test WebSocket server and reads
the actual appearance. It never sends a button press or toggles appearance.

IDENTITY AND PREDECESSOR
This implementation evolves the newer Windows Theme 1.0.5 project. It retains
com.badbadrobot.windowstheme and com.badbadrobot.windowstheme.toggle so existing
Windows Theme buttons keep working. The display name is now Theme Toggle.
The older repository implementation used com.custom.themetoggle and TypeScript/
Rollup. Its history remains in Git. This replacement uses CommonJS/esbuild and
is not an in-place identity upgrade for com.custom.themetoggle users: add the new
action manually if migrating from that predecessor. The obsolete batch installers
are not part of this implementation; package installation works on both systems.

ARTWORK
The existing generated 3D sun/moon masters and crop frames are retained under
assets/icons-3d. Builds generate 72px and 144px button icons and keep the original
line artwork for plugin/action/category icons. Generation prompts are recorded
in assets/icons-3d/metadata.json. No artwork was regenerated for macOS support.

MANUAL MAC VERIFICATION STILL REQUIRED
On a real supported Mac, preferably Intel and Apple silicon:
1. Build/package or transfer the packaged plugin; manually install when approved.
2. Confirm startup icon and external light/dark/Auto changes without permissions.
3. Press once, review Automation permission yourself, verify both toggle directions.
4. Deny permission and confirm an alert, no false icon update, and recovery after
   permission is manually enabled. Check a slow/dismissed prompt and retry.
5. Verify rapid presses, multiple keys, and Stream Deck restart behavior.
Record OS, CPU, Stream Deck version and results. Windows toggle behavior also
needs a user-approved live toggle check; this work did not change OS appearance.

REFERENCES
https://docs.elgato.com/streamdeck/sdk/references/manifest/
https://github.com/nodejs/node/blob/v20.x/BUILDING.md
https://developer.apple.com/library/archive/releasenotes/InterapplicationCommunication/RN-JavaScriptForAutomation/Articles/OSX10-10.html
