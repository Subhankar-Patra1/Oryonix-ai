#!/bin/bash

# ==============================================================================
# Configuration
# Change DOWNLOAD_URL to the actual URL where your zip file is hosted.
# NOTE: Ensure the zip contains the extension files directly, not inside a subfolder.
# ==============================================================================
DOWNLOAD_URL="https://oryonix-ai-downloads.s3.us-east-1.amazonaws.com/oryonix-ai-1.0.1-chrome.zip"
INSTALL_DIR="$HOME/Oryonix AI"
ZIP_FILE="/tmp/oryonix-ai-1.0.1-chrome.zip"

echo "=========================================="
echo "  Oryonix AI Beta Extension Installer (Linux)"
echo "=========================================="
echo ""

# Create install directory if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    echo "[*] Creating installation directory at $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
fi

echo "[*] Downloading extension from server..."
if command -v curl >/dev/null 2>&1; then
    curl -s -L -o "$ZIP_FILE" "$DOWNLOAD_URL"
elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$ZIP_FILE" "$DOWNLOAD_URL"
else
    echo "[!] Error: curl or wget is required to download the extension."
    exit 1
fi

echo "[*] Extracting extension to $INSTALL_DIR..."
if command -v unzip >/dev/null 2>&1; then
    unzip -o "$ZIP_FILE" -d "$INSTALL_DIR" > /dev/null
elif command -v python3 >/dev/null 2>&1; then
    python3 -m zipfile -e "$ZIP_FILE" "$INSTALL_DIR"
else
    echo "[!] Error: unzip or python3 is required to extract the extension."
    exit 1
fi

# Clean up temporary files
rm -f "$ZIP_FILE"

echo "[*] Launching Browser with Oryonix AI..."
# Find available chromium-based browsers in Linux
LAUNCHED=false

# Check if browser is running
if pgrep -f "chrome|brave|edge" >/dev/null; then
    echo ""
    echo "[!] WARNING: A browser appears to be currently running."
    echo "    To load the extension into your default profile, please CLOSE all browser windows."
    echo "    Otherwise, press [Enter] to launch in a separate clean browser session with the extension..."
    echo ""
    read -r
fi

# Check again if still running
STILL_RUNNING=false
if pgrep -f "chrome|brave|edge" >/dev/null; then
    STILL_RUNNING=true
fi

# Try to launch standard chromium-based browsers
if command -v google-chrome >/dev/null 2>&1; then
    echo "[+] Using browser: Google Chrome"
    if [ "$STILL_RUNNING" = true ]; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        google-chrome --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com" &
    else
        echo "[*] Launching browser with default profile..."
        google-chrome --load-extension="$INSTALL_DIR" "https://google.com" &
    fi
    LAUNCHED=true
elif command -v google-chrome-stable >/dev/null 2>&1; then
    echo "[+] Using browser: Google Chrome Stable"
    if [ "$STILL_RUNNING" = true ]; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        google-chrome-stable --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com" &
    else
        echo "[*] Launching browser with default profile..."
        google-chrome-stable --load-extension="$INSTALL_DIR" "https://google.com" &
    fi
    LAUNCHED=true
elif command -v brave-browser >/dev/null 2>&1; then
    echo "[+] Using browser: Brave Browser"
    if [ "$STILL_RUNNING" = true ]; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        brave-browser --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com" &
    else
        echo "[*] Launching browser with default profile..."
        brave-browser --load-extension="$INSTALL_DIR" "https://google.com" &
    fi
    LAUNCHED=true
elif command -v chromium-browser >/dev/null 2>&1; then
    echo "[+] Using browser: Chromium Browser"
    if [ "$STILL_RUNNING" = true ]; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        chromium-browser --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com" &
    else
        echo "[*] Launching browser with default profile..."
        chromium-browser --load-extension="$INSTALL_DIR" "https://google.com" &
    fi
    LAUNCHED=true
elif command -v chromium >/dev/null 2>&1; then
    echo "[+] Using browser: Chromium"
    if [ "$STILL_RUNNING" = true ]; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        chromium --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com" &
    else
        echo "[*] Launching browser with default profile..."
        chromium --load-extension="$INSTALL_DIR" "https://google.com" &
    fi
    LAUNCHED=true
elif command -v microsoft-edge >/dev/null 2>&1; then
    echo "[+] Using browser: Microsoft Edge"
    if [ "$STILL_RUNNING" = true ]; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        microsoft-edge --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com" &
    else
        echo "[*] Launching browser with default profile..."
        microsoft-edge --load-extension="$INSTALL_DIR" "https://google.com" &
    fi
    LAUNCHED=true
elif command -v firefox >/dev/null 2>&1; then
    echo "[+] Using browser: Firefox (Directing to debugging page)"
    firefox "about:debugging#/runtime/this-firefox" &
    LAUNCHED=true
fi

if [ "$LAUNCHED" = false ]; then
    echo "[!] No default browser could be launched automatically."
    echo "[!] Please open your browser and load the extension manually."
fi

echo ""
echo "======================================================================"
echo "[!] Installation complete! Your browser should open shortly."
echo "[!] The extension files are saved permanently in: $INSTALL_DIR"
echo ""
echo "[i] IMPORTANT SECURITY NOTE: Terminal-launched extensions are TEMPORARY"
echo "    and will disappear whenever you close the browser window. To install"
echo "    it PERMANENTLY so it remains in your browser profile:"
echo "    1. Open your browser and go to chrome://extensions (or edge://extensions / brave://extensions)."
echo "    2. Toggle \"Developer mode\" in the top right to ON."
echo "    3. Click the \"Load unpacked\" button in the top left."
echo "    4. Select the permanent folder path: $INSTALL_DIR"
echo ""
echo "    - Firefox:"
echo "      1. Type about:debugging in your URL bar and click \"This Firefox\" on the left."
echo "      2. Click the \"Load Temporary Add-on...\" button."
echo "      3. Select the manifest.json file inside: $INSTALL_DIR"
echo "======================================================================"
echo ""
echo "[!] You can now safely close this window."
