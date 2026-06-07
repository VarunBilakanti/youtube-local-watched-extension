# YouTube Local Watched

A Brave-compatible extension that tracks watched YouTube videos locally in this browser, without signing in to YouTube.

## Install in Brave

1. Open `brave://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `youtube-local-watched-extension`.

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
