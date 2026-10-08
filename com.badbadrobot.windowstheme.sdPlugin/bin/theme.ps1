param([ValidateSet('Read','Toggle')][string]$Mode = 'Read')
$ErrorActionPreference = 'Stop'
$trace = Join-Path $PSScriptRoot 'theme-diagnostic.log'
function Trace([string]$message) {
    if ($Mode -ne 'Toggle') { return }
    try {
        if ((Test-Path -LiteralPath $trace) -and (Get-Item -LiteralPath $trace).Length -gt 262144) { Clear-Content -LiteralPath $trace }
        Add-Content -LiteralPath $trace -Value "$(Get-Date -Format o) pid=$PID $message" -ErrorAction Stop
    } catch {}
}
Trace "START mode=$Mode"
trap { Trace "ERROR $($_.Exception.Message)"; break }
$key = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize'
$settings = Get-ItemProperty -LiteralPath $key -ErrorAction SilentlyContinue
$light = if ($null -eq $settings.AppsUseLightTheme) { 1 } else { [int]$settings.AppsUseLightTheme }
Trace "READ light=$light"
if ($Mode -eq 'Toggle') {
    $light = 1 - [int]($light -ne 0)
    if (-not (Test-Path -LiteralPath $key)) { New-Item -Path $key -Force | Out-Null }
    New-ItemProperty -LiteralPath $key -Name AppsUseLightTheme -Value $light -PropertyType DWord -Force | Out-Null
    New-ItemProperty -LiteralPath $key -Name SystemUsesLightTheme -Value $light -PropertyType DWord -Force | Out-Null
    Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class ThemeNotify {
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern IntPtr SendMessageTimeout(IntPtr hwnd, uint msg, UIntPtr wParam, string lParam, uint flags, uint timeout, out UIntPtr result);
}
'@
    $result = [UIntPtr]::Zero
    $sent = [ThemeNotify]::SendMessageTimeout([IntPtr]0xffff, 0x001A, [UIntPtr]::Zero, 'ImmersiveColorSet', 2, 1000, [ref]$result)
    $notifyError = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Trace "WM_SETTINGCHANGE sent=$sent error=$notifyError"
    $sent = [ThemeNotify]::SendMessageTimeout([IntPtr]0xffff, 0x031A, [UIntPtr]::Zero, $null, 2, 1000, [ref]$result)
    $notifyError = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    Trace "WM_THEMECHANGED sent=$sent error=$notifyError"
}
Write-Output ([int]($light -ne 0))
Trace "DONE light=$light"
