const WATCHED_MIRROR_KEY = "ytLocalWatchedVideosMirror";

const list = document.querySelector("#list");
const empty = document.querySelector("#empty");
const refresh = document.querySelector("#refresh");
const pageSize = document.querySelector("#pageSize");
const recordSummary = document.querySelector("#recordSummary");
const prevPage = document.querySelector("#prevPage");
const nextPage = document.querySelector("#nextPage");
const pageInfo = document.querySelector("#pageInfo");

let watchedVideos = [];
let currentPage = 1;

function formatDate(value) {
  if (!value) return "Marked locally";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Marked locally";
  return `Marked ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}

async function render() {
  const result = await chrome.storage.local.get(WATCHED_MIRROR_KEY);
  watchedVideos = Object.entries(result[WATCHED_MIRROR_KEY] || {})
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => String(b.markedAt || "").localeCompare(String(a.markedAt || "")));

  renderPage();
}

function updatePagingControls(totalRecords, totalPages, recordsPerPage) {
  const startRecord = totalRecords ? (currentPage - 1) * recordsPerPage + 1 : 0;
  const endRecord = totalRecords ? Math.min(startRecord + recordsPerPage - 1, totalRecords) : 0;
  recordSummary.textContent =
    totalRecords > 0
      ? `Showing ${startRecord}-${endRecord} of ${totalRecords} records`
      : "Total records: 0";
  pageInfo.textContent = `Page ${totalRecords ? currentPage : 1} of ${totalPages}`;
  prevPage.disabled = currentPage <= 1 || totalRecords === 0;
  nextPage.disabled = currentPage >= totalPages || totalRecords === 0;
}

function renderPage() {
  list.innerHTML = "";
  const recordsPerPage = Number(pageSize.value);
  const totalRecords = watchedVideos.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / recordsPerPage));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  updatePagingControls(totalRecords, totalPages, recordsPerPage);
  empty.hidden = totalRecords > 0;

  const start = (currentPage - 1) * recordsPerPage;
  const pageVideos = watchedVideos.slice(start, start + recordsPerPage);

  for (const video of pageVideos) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    const time = document.createElement("time");

    link.href = `https://www.youtube.com/watch?v=${video.id}`;
    link.target = "_blank";
    link.textContent = video.title || video.id;
    time.textContent = formatDate(video.markedAt);

    item.append(link, time);
    list.append(item);
  }
}

refresh.addEventListener("click", render);
pageSize.addEventListener("change", () => {
  currentPage = 1;
  renderPage();
});
prevPage.addEventListener("click", () => {
  currentPage -= 1;
  renderPage();
});
nextPage.addEventListener("click", () => {
  currentPage += 1;
  renderPage();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes[WATCHED_MIRROR_KEY]) {
    render();
  }
});

render();
