$DownloadUrl = "https://oryonix-ai-downloads.s3.us-east-1.amazonaws.com/oryonix-ai-1.0.1-chrome.zip"
$InstallDir = "C:\Oryonix AI"
$ZipFile = Join-Path $env:TEMP "oryonix-ai-1.0.1-chrome.zip"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Oryonix AI Beta Extension Installer (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Create install directory if it doesn't exist
if (-not (Test-Path $InstallDir)) {
    Write-Host "[*] Creating installation directory at $InstallDir..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
}

Write-Host "[*] Downloading extension from server..." -ForegroundColor Gray
try {
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $ZipFile -UseBasicParsing
} catch {
    Write-Error "[!] Error: Failed to download the extension. Check your internet connection."
    exit 1
}

Write-Host "[*] Extracting extension to $InstallDir..." -ForegroundColor Gray
try {
    Expand-Archive -Path $ZipFile -DestinationPath $InstallDir -Force
} catch {
    Write-Error "[!] Error: Failed to extract extension."
    exit 1
}

# Clean up
if (Test-Path $ZipFile) {
    Write-Host "[*] Cleaning up temporary files..." -ForegroundColor Gray
    Remove-Item -Path $ZipFile -Force
}

Write-Host "[*] Launching Browser with Oryonix AI..." -ForegroundColor Gray
$BrowserPath = $null
$ProgId = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice' -ErrorAction SilentlyContinue).ProgId
if ($ProgId) {
    $Cmd = (Get-ItemProperty "Registry::HKEY_CLASSES_ROOT\$ProgId\shell\open\command" -ErrorAction SilentlyContinue).'(default)'
    if ($Cmd) {
        if ($Cmd -match '"(.*?)"') {
            $BrowserPath = $matches[1]
        } else {
            $BrowserPath = $Cmd.Split(' ')[0]
        }
    }
}

if (-not $BrowserPath) {
    $CommonPaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe",
        "${env:ProgramFiles(x86)}\BraveSoftware\Brave-Browser\Application\brave.exe",
        "$env:LocalAppData\BraveSoftware\Brave-Browser\Application\brave.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($path in $CommonPaths) {
        if (Test-Path $path) {
            $BrowserPath = $path
            break
        }
    }
}

if (-not $BrowserPath) {
    $BrowserPath = "msedge.exe"
}

$BrowserProcessName = "chrome"
if ($BrowserPath -match "msedge") {
    $BrowserProcessName = "msedge"
} elseif ($BrowserPath -match "brave") {
    $BrowserProcessName = "brave"
}

$IsRunning = Get-Process $BrowserProcessName -ErrorAction SilentlyContinue
if ($IsRunning) {
    Write-Host ""
    Write-Host "[!] WARNING: $BrowserProcessName is currently running." -ForegroundColor Yellow
    Write-Host "    To load the extension into your default profile, please CLOSE all windows of $BrowserProcessName." -ForegroundColor Yellow
    Write-Host "    Otherwise, press any key to launch in a separate clean browser session with the extension..." -ForegroundColor Gray
    Write-Host ""
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Check again if it's still running
$StillRunning = Get-Process $BrowserProcessName -ErrorAction SilentlyContinue

Write-Host "[+] Using browser: $BrowserPath" -ForegroundColor Green

if ($StillRunning) {
    Write-Host "[*] Launching browser with a temporary profile (default is currently in use)..." -ForegroundColor Gray
    $ProfileDir = Join-Path $InstallDir "Profile"
    Start-Process -FilePath $BrowserPath -ArgumentList "--load-extension=`"$InstallDir`"", "--user-data-dir=`"$ProfileDir`"", "--no-first-run", "--no-default-browser-check", "https://google.com"
} else {
    Write-Host "[*] Launching browser with your default profile..." -ForegroundColor Gray
    Start-Process -FilePath $BrowserPath -ArgumentList "--load-extension=`"$InstallDir`"", "https://google.com"
}

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host "[!] Installation complete! Your browser should open shortly." -ForegroundColor Green
Write-Host "[!] The extension files are saved permanently in: $InstallDir" -ForegroundColor Green
Write-Host ""
Write-Host "[i] IMPORTANT SECURITY NOTE: Terminal-launched extensions are TEMPORARY" -ForegroundColor Cyan
Write-Host "    and will disappear whenever you close the browser window. To install" -ForegroundColor Cyan
Write-Host "    it PERMANENTLY so it remains in your browser profile:" -ForegroundColor Cyan
Write-Host "    1. Open your browser and navigate to: chrome://extensions (or edge://extensions)" -ForegroundColor Gray
Write-Host "    2. Toggle 'Developer Mode' in the top-right corner to ON." -ForegroundColor Gray
Write-Host "    3. Click the 'Load Unpacked' button in the top-left." -ForegroundColor Gray
Write-Host "    4. Select the permanent folder path: $InstallDir" -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor Yellow
Write-Host ""
