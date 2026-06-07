# YouTube Local Watched

A Brave-compatible extension that tracks watched YouTube videos locally in this browser, without signing in to YouTube.

## Prerequisites

- Brave Browser installed.
- Git installed if you want to clone the repository from the command line.
- No npm, build step, or package install is required. This is a plain unpacked Manifest V3 extension.

## Clone the repository

```bash
git clone https://github.com/VarunBilakanti/youtube-local-watched-extension.git
cd youtube-local-watched-extension
```

The extension folder you load into Brave is:

```text
youtube-local-watched-extension/youtube-local-watched-extension
```

## Install in Brave

1. Open `brave://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `youtube-local-watched-extension/youtube-local-watched-extension`.

## Open Brave extensions by OS

You can always paste this into Brave's address bar:

```text
brave://extensions
```

Or open it from a terminal.

### Windows PowerShell

```powershell
Start-Process "brave://extensions"
```

If that does not open Brave, launch Brave directly:

```powershell
Start-Process "$env:LOCALAPPDATA\BraveSoftware\Brave-Browser\Application\brave.exe" "brave://extensions"
```

### macOS

```bash
open -a "Brave Browser" "brave://extensions"
```

### Linux

```bash
brave-browser "brave://extensions"
```

Some Linux installs use a different binary name:

```bash
brave "brave://extensions"
```

## Load or reload the extension

1. In `brave://extensions`, enable **Developer mode**.
2. Click **Load unpacked**.
3. Select the nested extension folder:

   ```text
   youtube-local-watched-extension/youtube-local-watched-extension
   ```

4. Open or reload a YouTube tab.
5. Pin the extension from Brave's extensions menu if you want quick access to settings and the watched list.

After pulling new changes, go back to `brave://extensions` and click the extension's reload button, then reload any open YouTube tabs.

## What it does

- Adds a manual watched toggle on YouTube video pages.
- Adds a hover button on YouTube video thumbnails.
- Shows a local "Watched" label on videos you marked.
- Auto-marks the current video after your configured watch percentage.
- Shows the watched list in a collapsible popup section when your active tab is YouTube.
- Opens a full-page watched list from the popup.
- Adds pagination controls, record count, and records-per-page options for watched lists.
- Stores watched video IDs in YouTube page `localStorage` on this browser only.
- Mirrors the watched list into extension storage so the full-page list can display it.
- Stores extension settings in Brave extension storage so the popup can configure the content script.

## Configure

Click the extension icon in Brave to:

- Turn auto-marking on or off.
- Choose the percentage watched before auto-marking.
- Expand the dropdown to view watched videos from the active YouTube tab.
- Open the watched list in a new extension tab.
- Choose how many watched videos to show per page and see the total record count.
- Clear the local watched list.

## Notes

This does not update YouTube's account watch history. It only adds local browser-side watched state.

Watched video IDs are stored locally in YouTube page `localStorage` for the current Brave profile. If you clear site data for YouTube, the watched list is cleared too.
