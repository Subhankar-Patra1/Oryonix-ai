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
echo "  Oryonix AI Beta Extension Installer (macOS)"
echo "=========================================="
echo ""

# Create install directory if it doesn't exist
if [ ! -d "$INSTALL_DIR" ]; then
    echo "[*] Creating installation directory at $INSTALL_DIR..."
    mkdir -p "$INSTALL_DIR"
fi

echo "[*] Downloading extension from server..."
curl -s -L -o "$ZIP_FILE" "$DOWNLOAD_URL"

echo "[*] Extracting extension to $INSTALL_DIR..."
unzip -o "$ZIP_FILE" -d "$INSTALL_DIR" > /dev/null

echo "[*] Cleaning up temporary files..."
rm "$ZIP_FILE"

echo "[*] Launching Browser with Oryonix AI..."
# 1. Attempt to find the default HTTP handler on macOS.
BUNDLE_ID=$(defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers 2>/dev/null | grep -B 1 'LSHandlerURLScheme = http;' | grep LSHandlerRoleAll | awk -F'"' '{print $2}')

# Check if the default browser is a Chromium browser (Safari/Firefox don't support --load-extension)
IS_CHROMIUM=false
if [[ "$BUNDLE_ID" == *"chrome"* || "$BUNDLE_ID" == *"edge"* || "$BUNDLE_ID" == *"brave"* || "$BUNDLE_ID" == *"arc"* || "$BUNDLE_ID" == *"opera"* || "$BUNDLE_ID" == *"vivaldi"* ]]; then
    IS_CHROMIUM=true
fi

if [ -n "$BUNDLE_ID" ] && [ "$IS_CHROMIUM" = true ]; then
    BROWSER_NAME="Google Chrome"
    if [[ "$BUNDLE_ID" == *"edge"* ]]; then
        BROWSER_NAME="Microsoft Edge"
    elif [[ "$BUNDLE_ID" == *"brave"* ]]; then
        BROWSER_NAME="Brave Browser"
    fi

    if pgrep -x "$BROWSER_NAME" >/dev/null; then
        echo ""
        echo "[!] WARNING: $BROWSER_NAME is currently running."
        echo "    To load the extension into your default profile, please CLOSE all windows of $BROWSER_NAME."
        echo "    Otherwise, press [Enter] to launch in a separate clean browser session with the extension..."
        echo ""
        read -r
    fi

    echo "[+] Using default browser: $BUNDLE_ID"
    # Check if still running
    if pgrep -x "$BROWSER_NAME" >/dev/null; then
        echo "[*] Launching browser with a temporary profile (default is currently in use)..."
        open -n -b "$BUNDLE_ID" --args --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com"
    else
        echo "[*] Launching browser with default profile..."
        open -b "$BUNDLE_ID" --args --load-extension="$INSTALL_DIR" "https://google.com"
    fi
else
    # 2. Fallback to Chromium browsers if default is Safari/Firefox or unknown
    FALLBACK_BROWSER=""
    if [ -d "/Applications/Google Chrome.app" ] || [ -d "$HOME/Applications/Google Chrome.app" ]; then
        FALLBACK_BROWSER="Google Chrome"
    elif [ -d "/Applications/Microsoft Edge.app" ] || [ -d "$HOME/Applications/Microsoft Edge.app" ]; then
        FALLBACK_BROWSER="Microsoft Edge"
    elif [ -d "/Applications/Brave Browser.app" ] || [ -d "$HOME/Applications/Brave Browser.app" ]; then
        FALLBACK_BROWSER="Brave Browser"
    fi

    if [ -n "$FALLBACK_BROWSER" ]; then
        if pgrep -x "$FALLBACK_BROWSER" >/dev/null; then
            echo ""
            echo "[!] WARNING: $FALLBACK_BROWSER is currently running."
            echo "    To load the extension into your default profile, please CLOSE all windows of $FALLBACK_BROWSER."
            echo "    Otherwise, press [Enter] to launch in a separate clean browser session with the extension..."
            echo ""
            read -r
        fi
        echo "[+] Using fallback browser: $FALLBACK_BROWSER"
        # Check if still running
        if pgrep -x "$FALLBACK_BROWSER" >/dev/null; then
            echo "[*] Launching browser with a temporary profile (default is currently in use)..."
            open -n -a "$FALLBACK_BROWSER" --args --load-extension="$INSTALL_DIR" --user-data-dir="$INSTALL_DIR/Profile" --no-first-run --no-default-browser-check "https://google.com"
        else
            echo "[*] Launching browser with default profile..."
            open -a "$FALLBACK_BROWSER" --args --load-extension="$INSTALL_DIR" "https://google.com"
        fi
    else
        echo "[!] No Chromium-based browser found!"
        echo "[!] Please install Google Chrome, Edge, or Brave to use this extension."
    fi
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
echo "======================================================================"
echo ""
echo "[!] You can now safely close this window."
