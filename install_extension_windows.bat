@echo off
setlocal

:: ==============================================================================
:: Configuration
:: Change DOWNLOAD_URL to the actual URL where your zip file is hosted.
:: NOTE: Ensure the zip contains the extension files directly, not inside a subfolder.
:: ==============================================================================
set "DOWNLOAD_URL=https://oryonix-ai-downloads.s3.us-east-1.amazonaws.com/oryonix-ai-1.0.1-chrome.zip"
set "INSTALL_DIR=C:\Oryonix AI"
set "ZIP_FILE=%TEMP%\oryonix-ai-1.0.1-chrome.zip"

echo ==========================================
echo   Oryonix AI Beta Extension Installer (Windows)
echo ==========================================
echo.

:: Create install directory if it doesn't exist
if not exist "%INSTALL_DIR%" (
    echo [*] Creating installation directory at %INSTALL_DIR%...
    mkdir "%INSTALL_DIR%"
)

echo [*] Downloading extension from server...
curl -s -L -o "%ZIP_FILE%" "%DOWNLOAD_URL%"

echo [*] Extracting extension to %INSTALL_DIR%...
powershell -command "Expand-Archive -Force -Path '%ZIP_FILE%' -DestinationPath '%INSTALL_DIR%'"

echo [*] Cleaning up temporary files...
del "%ZIP_FILE%"

echo [*] Launching Browser with Oryonix AI...
:: This PowerShell script finds the default browser from the Windows Registry and launches it.
:: NOTE: Firefox does not support this Chrome extension loading method. It works for Chrome, Edge, Brave, Opera, etc.
powershell -NoProfile -ExecutionPolicy Bypass -Command "$INSTALL_DIR=$env:INSTALL_DIR; $q=[char]34; $Browser=$null; $ProgId=(Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice' -ErrorAction SilentlyContinue).ProgId; if($ProgId){ $Cmd=(Get-ItemProperty ('Registry::HKEY_CLASSES_ROOT\'+$ProgId+'\shell\open\command') -ErrorAction SilentlyContinue).'(default)'; if($Cmd){ if($Cmd -match ($q+'(.*?)'+$q)){ $Browser=$matches[1] } else { $Browser=$Cmd.Split(' ')[0] } } }; if(-not $Browser){ $Paths=@($env:ProgramFiles+'\Google\Chrome\Application\chrome.exe', ${env:ProgramFiles(x86)}+'\Google\Chrome\Application\chrome.exe', $env:LocalAppData+'\Google\Chrome\Application\chrome.exe', $env:ProgramFiles+'\BraveSoftware\Brave-Browser\Application\brave.exe', ${env:ProgramFiles(x86)}+'\BraveSoftware\Brave-Browser\Application\brave.exe', $env:LocalAppData+'\BraveSoftware\Brave-Browser\Application\brave.exe', $env:ProgramFiles+'\Microsoft\Edge\Application\msedge.exe', ${env:ProgramFiles(x86)}+'\Microsoft\Edge\Application\msedge.exe'); foreach($p in $Paths){ if(Test-Path $p){ $Browser=$p; break } } }; if(-not $Browser){ $Browser='msedge.exe' }; $ProcName='chrome'; if($Browser -match 'msedge'){$ProcName='msedge'}elseif($Browser -match 'brave'){$ProcName='brave'}; $IsRunning=Get-Process $ProcName -ErrorAction SilentlyContinue; if($IsRunning){ Write-Host ''; Write-Host ('[!] WARNING: '+$ProcName+' is currently running.') -ForegroundColor Yellow; Write-Host ('    To load the extension into your default profile, please CLOSE all windows of '+$ProcName+'.') -ForegroundColor Yellow; Write-Host '    Otherwise, press any key to launch in a separate clean browser session with the extension...' -ForegroundColor Gray; Write-Host ''; $null=$Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown') }; $StillRunning=Get-Process $ProcName -ErrorAction SilentlyContinue; Write-Host ('[+] Using browser: '+$Browser); if($StillRunning){ Write-Host '[*] Launching browser with a temporary profile (default is currently in use)...'; $ProfileDir=Join-Path $INSTALL_DIR 'Profile'; Start-Process -FilePath $Browser -ArgumentList ('--load-extension='+$q+$INSTALL_DIR+$q), ('--user-data-dir='+$q+$ProfileDir+$q), '--no-first-run', '--no-default-browser-check', 'https://google.com' }else{ Write-Host '[*] Launching browser with default profile...'; Start-Process -FilePath $Browser -ArgumentList ('--load-extension='+$q+$INSTALL_DIR+$q), 'https://google.com' }"

echo.
echo ======================================================================
echo [!] Installation complete! Your browser should open shortly.
echo [!] The extension files are saved permanently in: %INSTALL_DIR%
echo.
echo [i] IMPORTANT SECURITY NOTE: Terminal-launched extensions are TEMPORARY
echo     and will disappear whenever you close the browser window. To install
echo     it PERMANENTLY so it remains in your browser profile:
echo     1. Open your browser and go to chrome://extensions (or edge://extensions / brave://extensions).
echo     2. Toggle "Developer mode" in the top right to ON.
echo     3. Click the "Load unpacked" button in the top left.
echo     4. Select the permanent folder path: %INSTALL_DIR%
echo ======================================================================
echo.
echo [!] You can now safely close this window.
pause
