@echo off
REM ═══════════════════════════════════════════════════════════════════
REM  Dark Mode Toggle — Stream Deck Plugin Installer
REM ═══════════════════════════════════════════════════════════════════
REM  This script copies the plugin to the Stream Deck plugins folder.
REM  Run this AFTER closing the Stream Deck application.
REM ═══════════════════════════════════════════════════════════════════

setlocal

set PLUGIN_NAME=com.custom.darkmodetoggle.sdPlugin
set DEST=%APPDATA%\Elgato\StreamDeck\Plugins\%PLUGIN_NAME%

echo.
echo  ╔══════════════════════════════════════╗
echo  ║   Dark Mode Toggle - SD Installer    ║
echo  ╚══════════════════════════════════════╝
echo.

REM Check if Stream Deck is running
tasklist /FI "IMAGENAME eq StreamDeck.exe" 2>NUL | find /I /N "StreamDeck.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo  [!] Stream Deck is running. Please close it first.
    echo      Right-click the Stream Deck icon in the system tray
    echo      and select "Quit Stream Deck".
    echo.
    pause
    exit /b 1
)

REM Remove old version if present
if exist "%DEST%" (
    echo  [*] Removing previous installation...
    rmdir /S /Q "%DEST%"
)

REM Copy plugin
echo  [*] Installing plugin to:
echo      %DEST%
echo.

xcopy /E /I /Y "%~dp0%PLUGIN_NAME%" "%DEST%" >NUL

if "%ERRORLEVEL%"=="0" (
    echo  [✓] Plugin installed successfully!
    echo.
    echo  Next steps:
    echo    1. Start the Stream Deck application
    echo    2. Look for "Dark Mode Toggle" in the "System" category
    echo    3. Drag it onto a button — done!
    echo.
) else (
    echo  [✗] Installation failed. Please try running as Administrator.
    echo.
)

pause
