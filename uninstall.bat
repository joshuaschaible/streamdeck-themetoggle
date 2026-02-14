@echo off
REM Uninstall Dark Mode Toggle Stream Deck Plugin

setlocal

set PLUGIN_NAME=com.custom.darkmodetoggle.sdPlugin
set DEST=%APPDATA%\Elgato\StreamDeck\Plugins\%PLUGIN_NAME%

echo.
echo  Uninstalling Dark Mode Toggle...
echo.

tasklist /FI "IMAGENAME eq StreamDeck.exe" 2>NUL | find /I /N "StreamDeck.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo  [!] Please close Stream Deck first.
    pause
    exit /b 1
)

if exist "%DEST%" (
    rmdir /S /Q "%DEST%"
    echo  [✓] Plugin removed.
) else (
    echo  [*] Plugin not found — already uninstalled.
)
echo.
pause
