import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { execSync } from "child_process";
import { platform } from "os";

const IS_MAC = platform() === "darwin";

// ── Windows registry constants ───────────────────────────────────────
const REG_PATH = "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
const REG_APPS = "AppsUseLightTheme";
const REG_SYSTEM = "SystemUsesLightTheme";

// ── Windows implementation ───────────────────────────────────────────

function isDarkModeWindows(): boolean {
  try {
    const result = execSync(`reg query "${REG_PATH}" /v ${REG_APPS}`, {
      encoding: "utf-8",
      windowsHide: true,
    });
    const match = result.match(/REG_DWORD\s+0x([0-9a-fA-F]+)/);
    if (match) {
      return parseInt(match[1], 16) === 0; // 0 = dark mode
    }
  } catch (e) {
    // Default to light mode on error
  }
  return false;
}

function toggleThemeWindows(): boolean {
  const currentlyDark = isDarkModeWindows();
  const newValue = currentlyDark ? 1 : 0;

  try {
    execSync(`reg add "${REG_PATH}" /v ${REG_APPS} /t REG_DWORD /d ${newValue} /f`, {
      encoding: "utf-8",
      windowsHide: true,
    });
    execSync(`reg add "${REG_PATH}" /v ${REG_SYSTEM} /t REG_DWORD /d ${newValue} /f`, {
      encoding: "utf-8",
      windowsHide: true,
    });
    return !currentlyDark;
  } catch (e) {
    return currentlyDark;
  }
}

// ── macOS implementation ─────────────────────────────────────────────

function isDarkModeMac(): boolean {
  try {
    const result = execSync("defaults read -g AppleInterfaceStyle", {
      encoding: "utf-8",
    });
    return result.trim().toLowerCase() === "dark";
  } catch (e) {
    // Command fails when in light mode (key doesn't exist)
    return false;
  }
}

function toggleThemeMac(): boolean {
  const currentlyDark = isDarkModeMac();

  try {
    execSync(
      `osascript -e 'tell application "System Events" to tell appearance preferences to set dark mode to ${currentlyDark ? "false" : "true"}'`,
      { encoding: "utf-8" }
    );
    return !currentlyDark;
  } catch (e) {
    return currentlyDark;
  }
}

// ── Cross-platform wrappers ──────────────────────────────────────────

function isDarkMode(): boolean {
  return IS_MAC ? isDarkModeMac() : isDarkModeWindows();
}

function toggleTheme(): boolean {
  return IS_MAC ? toggleThemeMac() : toggleThemeWindows();
}

// ── Stream Deck action ───────────────────────────────────────────────

@action({ UUID: "com.custom.themetoggle.toggle" })
export class ToggleDarkMode extends SingletonAction {
  /**
   * Called when the button appears on the Stream Deck.
   * Sets initial state to match current system theme.
   */
  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    const dark = isDarkMode();
    if ("setState" in ev.action) {
      await ev.action.setState(dark ? 1 : 0);
    }
  }

  /**
   * Called when the user presses the button.
   * Toggles the system theme and updates the button.
   */
  override async onKeyDown(ev: KeyDownEvent): Promise<void> {
    try {
      const nowDark = toggleTheme();
      await ev.action.setState(nowDark ? 1 : 0);
      await ev.action.showOk();
    } catch (e) {
      await ev.action.showAlert();
    }
  }
}
