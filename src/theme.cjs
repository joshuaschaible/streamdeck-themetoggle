const { execFile } = require('node:child_process');
const path = require('node:path');

// Reading NSUserDefaults does not send Apple Events or request Automation access.
const MAC_READ = `ObjC.import('Foundation');
var style = ObjC.unwrap($.NSUserDefaults.standardUserDefaults.stringForKey('AppleInterfaceStyle'));
if (style !== undefined && style !== null && style !== '' && style !== 'Light' && style !== 'Dark') {
  throw new Error('Unexpected macOS appearance preference');
}
style === 'Dark' ? 0 : 1;`;

// Only a user press sends Apple Events. Read the actual result, never assume success.
const MAC_TOGGLE = `tell application "System Events"
  tell appearance preferences
    set requestedDark to not dark mode
    set dark mode to requestedDark
    if dark mode is not requestedDark then error "macOS did not apply the requested appearance"
    if dark mode then
      return 0
    else
      return 1
    end if
  end tell
end tell`;

function createThemeRunner({platform = process.platform, execute = execFile,
  binDir = __dirname, systemRoot = process.env.SystemRoot || 'C:\\Windows'} = {}) {
  return async mode => {
    if (mode !== 'Read' && mode !== 'Toggle') throw new Error('Invalid theme operation');
    let executable, args;
    if (platform === 'win32') {
      executable = path.win32.join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
      args = ['-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(binDir, 'theme.ps1'), '-Mode', mode];
    } else if (platform === 'darwin') {
      executable = '/usr/bin/osascript';
      args = mode === 'Read' ? ['-l', 'JavaScript', '-e', MAC_READ] : ['-l', 'AppleScript', '-e', MAC_TOGGLE];
    } else {
      throw new Error(`Unsupported operating system: ${platform}`);
    }
    return new Promise((resolve, reject) => {
      execute(executable, args, {windowsHide: true, timeout: 15000, maxBuffer: 65536, encoding: 'utf8'}, (error, stdout, stderr) => {
        if (error) {
          const denied = platform === 'darwin' && /-1743|not authorized|not permitted/i.test(`${error.message}\n${stderr || ''}`);
          const detail = denied
            ? 'macOS Automation access to System Events was denied. Review the request manually in System Settings > Privacy & Security > Automation.'
            : error.killed ? 'Theme command timed out after 15 seconds.' : `Theme command failed: ${error.message}`;
          return reject(new Error(detail, {cause: error}));
        }
        const value = stdout.trim();
        if (!/^[01]$/.test(value)) return reject(new Error('Unexpected theme response'));
        resolve(Number(value));
      });
    });
  };
}
module.exports = {createThemeRunner, MAC_READ, MAC_TOGGLE};
