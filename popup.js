const SETTINGS_KEY = "ytLocalWatchedSettings";

const defaults = {
  autoEnabled: true,
  threshold: 80
};

const autoEnabled = document.querySelector("#autoEnabled");
const threshold = document.querySelector("#threshold");
const thresholdLabel = document.querySelector("#thresholdLabel");
const clearWatched = document.querySelector("#clearWatched");
const toggleWatched = document.querySelector("#toggleWatched");
const openWatched = document.querySelector("#openWatched");
const refreshWatched = document.querySelector("#refreshWatched");
const popupPageSize = document.querySelector("#popupPageSize");
const popupRecordSummary = document.querySelector("#popupRecordSummary");
const popupPrevPage = document.querySelector("#popupPrevPage");
const popupNextPage = document.querySelector("#popupNextPage");
const popupPageInfo = document.querySelector("#popupPageInfo");
const watchedPanel = document.querySelector("#watchedPanel");
const watchedList = document.querySelector("#watchedList");
const emptyList = document.querySelector("#emptyList");
const status = document.querySelector("#status");

let watchedVideos = [];
let currentPage = 1;

async function readSettings() {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return { ...defaults, ...(result[SETTINGS_KEY] || {}) };
}

async function writeSettings(settings) {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

function showStatus(message) {
  status.textContent = message;
  window.clearTimeout(showStatus.timer);
  showStatus.timer = window.setTimeout(() => {
    status.textContent = "";
  }, 1800);
}

async function render() {
  const settings = await readSettings();
  autoEnabled.checked = settings.autoEnabled;
  threshold.value = String(settings.threshold);
  thresholdLabel.textContent = `${settings.threshold}%`;
}

async function getActiveYouTubeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://www.youtube.com/")) {
    return null;
  }
  return tab;
}

async function sendToYouTube(message) {
  const tab = await getActiveYouTubeTab();
  if (!tab) {
    throw new Error("NO_YOUTUBE_TAB");
  }
  return chrome.tabs.sendMessage(tab.id, message);
}

function formatDate(value) {
  if (!value) return "Marked locally";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Marked locally";
  return `Marked ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

async function renderWatchedList() {
  watchedList.innerHTML = "";

  try {
    const response = await sendToYouTube({ type: "YLW_GET_WATCHED" });
    watchedVideos = Object.entries(response?.watched || {})
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => String(b.markedAt || "").localeCompare(String(a.markedAt || "")));

    renderWatchedPage();
  } catch {
    watchedVideos = [];
    updatePagingControls(0, 1, 0);
    emptyList.textContent = "Open or reload a YouTube tab to view the local list.";
    emptyList.hidden = false;
  }
}

function updatePagingControls(totalRecords, totalPages, pageSize) {
  const startRecord = totalRecords ? (currentPage - 1) * pageSize + 1 : 0;
  const endRecord = totalRecords ? Math.min(startRecord + pageSize - 1, totalRecords) : 0;
  popupRecordSummary.textContent =
    totalRecords > 0
      ? `Showing ${startRecord}-${endRecord} of ${totalRecords} records`
      : "Total records: 0";
  popupPageInfo.textContent = `Page ${totalRecords ? currentPage : 1} of ${totalPages}`;
  popupPrevPage.disabled = currentPage <= 1 || totalRecords === 0;
  popupNextPage.disabled = currentPage >= totalPages || totalRecords === 0;
}

function renderWatchedPage() {
  watchedList.innerHTML = "";

  const pageSize = Number(popupPageSize.value);
  const totalRecords = watchedVideos.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  updatePagingControls(totalRecords, totalPages, pageSize);

  if (!totalRecords) {
    emptyList.textContent = "No watched videos marked yet.";
    emptyList.hidden = false;
    return;
  }

  emptyList.hidden = true;
  const start = (currentPage - 1) * pageSize;
  const pageVideos = watchedVideos.slice(start, start + pageSize);

  for (const video of pageVideos) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const time = document.createElement("time");

    link.href = `https://www.youtube.com/watch?v=${video.id}`;
    link.target = "_blank";
    link.textContent = video.title || video.id;
    time.textContent = formatDate(video.markedAt);

    item.append(link, time);
    watchedList.append(item);
  }
}

autoEnabled.addEventListener("change", async () => {
  const settings = await readSettings();
  settings.autoEnabled = autoEnabled.checked;
  await writeSettings(settings);
  showStatus("Saved");
});

threshold.addEventListener("input", () => {
  thresholdLabel.textContent = `${threshold.value}%`;
});

threshold.addEventListener("change", async () => {
  const settings = await readSettings();
  settings.threshold = Number(threshold.value);
  await writeSettings(settings);
  showStatus("Saved");
});

clearWatched.addEventListener("click", async () => {
  try {
    await sendToYouTube({ type: "YLW_CLEAR_WATCHED" });
    await renderWatchedList();
    showStatus("Cleared");
  } catch (error) {
    if (error.message === "NO_YOUTUBE_TAB") {
      showStatus("Open a YouTube tab first");
      return;
    }
    showStatus("Reload YouTube and try again");
  }
});

refreshWatched.addEventListener("click", renderWatchedList);

popupPageSize.addEventListener("change", () => {
  currentPage = 1;
  renderWatchedPage();
});

popupPrevPage.addEventListener("click", () => {
  currentPage -= 1;
  renderWatchedPage();
});

popupNextPage.addEventListener("click", () => {
  currentPage += 1;
  renderWatchedPage();
});

toggleWatched.addEventListener("click", async () => {
  const isOpening = watchedPanel.hidden;
  watchedPanel.hidden = !isOpening;
  toggleWatched.textContent = isOpening ? "Collapse" : "Expand";
  toggleWatched.setAttribute("aria-expanded", String(isOpening));
  if (isOpening) {
    await renderWatchedList();
  }
});

openWatched.addEventListener("click", async () => {
  await chrome.tabs.create({ url: chrome.runtime.getURL("list.html") });
});

render();
