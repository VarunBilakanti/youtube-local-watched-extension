(() => {
  const WATCHED_KEY = "ytLocalWatchedVideos";
  const SETTINGS_KEY = "ytLocalWatchedSettings";
  const WATCHED_MIRROR_KEY = "ytLocalWatchedVideosMirror";
  const BUTTON_CLASS = "ylw-thumb-button";
  const MARK_CLASS = "ylw-mark";
  const WATCH_BUTTON_ID = "ylw-watch-page-button";

  const defaultSettings = {
    autoEnabled: true,
    threshold: 80
  };

  let lastUrl = location.href;
  let watchedCache = readWatched();
  let settingsCache = defaultSettings;

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function readWatched() {
    const value = readJson(WATCHED_KEY, {});
    return value && typeof value === "object" ? value : {};
  }

  function mirrorWatched() {
    try {
      chrome.storage.local.set({ [WATCHED_MIRROR_KEY]: watchedCache });
    } catch {
      // The localStorage copy still works if extension storage is unavailable.
    }
  }

  async function syncSettings() {
    try {
      const result = await chrome.storage.local.get(SETTINGS_KEY);
      settingsCache = { ...defaultSettings, ...(result[SETTINGS_KEY] || {}) };
    } catch {
      settingsCache = defaultSettings;
    }
  }

  function normalizeVideoId(id) {
    return /^[a-zA-Z0-9_-]{6,}$/.test(id || "") ? id : null;
  }

  function getVideoIdFromUrl(urlText) {
    try {
      const url = new URL(urlText, location.origin);
      if (url.pathname === "/watch") {
        return normalizeVideoId(url.searchParams.get("v"));
      }
      if (url.pathname.startsWith("/shorts/")) {
        return normalizeVideoId(url.pathname.split("/")[2]);
      }
    } catch {
      return null;
    }
    return null;
  }

  function getCurrentVideoId() {
    return getVideoIdFromUrl(location.href);
  }

  function getCurrentVideoTitle(videoId) {
    const title =
      document.querySelector("ytd-watch-metadata h1 yt-formatted-string")?.textContent?.trim() ||
      document.querySelector("h1.title yt-formatted-string")?.textContent?.trim() ||
      document.title.replace(" - YouTube", "").trim();

    return title || videoId;
  }

  function isWatched(videoId) {
    return Boolean(videoId && watchedCache[videoId]);
  }

  function setWatched(videoId, watched) {
    if (!videoId) return;
    watchedCache = readWatched();

    if (watched) {
      watchedCache[videoId] = {
        markedAt: new Date().toISOString(),
        title: getCurrentVideoTitle(videoId)
      };
    } else {
      delete watchedCache[videoId];
    }

    writeJson(WATCHED_KEY, watchedCache);
    mirrorWatched();
    refreshUiSoon();
  }

  function makeWatchedMark() {
    const mark = document.createElement("span");
    mark.className = MARK_CLASS;
    mark.textContent = "Watched";
    return mark;
  }

  function ensureRelativeAnchor(element) {
    const style = window.getComputedStyle(element);
    if (style.position === "static") {
      element.classList.add("ylw-anchor");
    }
  }

  function enhanceThumbnail(anchor) {
    const videoId = getVideoIdFromUrl(anchor.href);
    if (!videoId) return;

    const thumbnail = anchor.closest("ytd-thumbnail") || anchor;
    ensureRelativeAnchor(thumbnail);

    let button = thumbnail.querySelector(`.${BUTTON_CLASS}`);
    if (!button) {
      button = document.createElement("button");
      button.className = BUTTON_CLASS;
      button.type = "button";
      button.textContent = "W";
      thumbnail.append(button);
    }

    button.dataset.videoId = videoId;
    button.title = isWatched(videoId) ? "Unmark local watched" : "Mark local watched";
    button.onclick = (event) => {
      const currentVideoId = button.dataset.videoId;
      event.preventDefault();
      event.stopPropagation();
      setWatched(currentVideoId, !isWatched(currentVideoId));
    };

    const mark = thumbnail.querySelector(`.${MARK_CLASS}`);
    if (isWatched(videoId)) {
      if (!mark) thumbnail.append(makeWatchedMark());
    } else {
      mark?.remove();
    }
  }

  function enhanceThumbnails() {
    document
      .querySelectorAll('a[href*="/watch?v="], a[href^="/shorts/"]')
      .forEach(enhanceThumbnail);
  }

  function ensureWatchPageButton() {
    const videoId = getCurrentVideoId();
    const existing = document.getElementById(WATCH_BUTTON_ID);

    if (!videoId) {
      existing?.remove();
      return;
    }

    const target =
      document.querySelector("#top-level-buttons-computed") ||
      document.querySelector("ytd-watch-metadata #actions");

    if (!target) return;

    const button = existing || document.createElement("button");
    button.id = WATCH_BUTTON_ID;
    button.className = "ylw-watch-button";
    button.type = "button";
    button.dataset.watched = String(isWatched(videoId));
    button.textContent = isWatched(videoId) ? "Watched locally" : "Mark watched";
    button.onclick = () => setWatched(videoId, !isWatched(videoId));

    if (!existing) {
      target.prepend(button);
    }
  }

  function maybeAutoMark() {
    if (!settingsCache.autoEnabled) return;

    const videoId = getCurrentVideoId();
    const video = document.querySelector("video");
    if (!videoId || !video || !Number.isFinite(video.duration) || video.duration <= 0) {
      return;
    }

    const percent = (video.currentTime / video.duration) * 100;
    if (percent >= settingsCache.threshold && !isWatched(videoId)) {
      setWatched(videoId, true);
    }
  }

  function refreshUi() {
    watchedCache = readWatched();
    mirrorWatched();
    enhanceThumbnails();
    ensureWatchPageButton();
    maybeAutoMark();
  }

  let refreshTimer = 0;
  function refreshUiSoon() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(refreshUi, 100);
  }

  const observer = new MutationObserver(refreshUiSoon);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  document.addEventListener("timeupdate", maybeAutoMark, true);
  window.addEventListener("yt-navigate-finish", refreshUiSoon);
  window.addEventListener("storage", refreshUiSoon);

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[SETTINGS_KEY]) {
      settingsCache = { ...defaultSettings, ...(changes[SETTINGS_KEY].newValue || {}) };
      refreshUiSoon();
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type === "YLW_GET_WATCHED") {
      watchedCache = readWatched();
      mirrorWatched();
      sendResponse({ watched: watchedCache });
      return;
    }

    if (message?.type === "YLW_CLEAR_WATCHED") {
      localStorage.removeItem(WATCHED_KEY);
      watchedCache = {};
      mirrorWatched();
      refreshUiSoon();
      sendResponse({ watched: watchedCache });
    }
  });

  window.setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      refreshUiSoon();
    }
  }, 500);

  syncSettings().then(refreshUi);
})();
