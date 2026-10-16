const platformSelect = document.querySelector("#platform-select");
const methodSelect = document.querySelector("#method-select");
const platformGrid = document.querySelector("#platform-grid");
const form = document.querySelector("#scrape-form");
const urlInput = document.querySelector("#url-input");
const notice = document.querySelector("#notice");
const submitButton = document.querySelector("#submit-button");
const buttonLabel = document.querySelector("#button-label");
const resultSection = document.querySelector("#result-section");
const resultCard = document.querySelector("#result-card");
const historyList = document.querySelector("#history-list");
const historyCount = document.querySelector("#history-count");
const clearHistoryButton = document.querySelector("#clear-history");

const platformNames = {
  applemusic: "Apple Music",
  bandcamp: "Bandcamp",
  bilibili: "Bilibili",
  douyin: "Douyin",
  facebook: "Facebook",
  instagram: "Instagram",
  pinterest: "Pinterest",
  pixiv: "Pixiv",
  reddit: "Reddit",
  rednote: "RedNote",
  resolver: "Link Resolver",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  terabox: "TeraBox",
  threads: "Threads",
  tiktok: "TikTok",
  twitter: "X / Twitter",
  youtube: "YouTube",
};

const platformMarks = {
  applemusic: "♪", bandcamp: "bc", bilibili: "bili", douyin: "抖", facebook: "f",
  instagram: "ig", pinterest: "p", pixiv: "px", reddit: "r/", rednote: "rn",
  resolver: "↗", soundcloud: "sc", spotify: "s", terabox: "tb", threads: "@",
  tiktok: "♪", twitter: "𝕏", youtube: "▶",
};

let availablePlatforms = [];
let sessionHistory = [];
let lastResultJson = "";

function readablePlatform(id) {
  return platformNames[id] || id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (letter) => letter.toUpperCase());
}

function showNotice(message, kind) {
  notice.textContent = message;
  notice.dataset.kind = kind;
  notice.hidden = !message;
}

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  select.append(option);
}

function populateMethods(platformId) {
  const platform = availablePlatforms.find((entry) => entry.id === platformId);
  methodSelect.replaceChildren();
  if (!platform) {
    addOption(methodSelect, "", "Choose a platform first");
    methodSelect.disabled = true;
    return;
  }
  addOption(methodSelect, "", "Choose a scraper method");
  for (const method of platform.methods) addOption(methodSelect, method, method);
  methodSelect.disabled = false;
  if (platform.methods.length === 1) methodSelect.value = platform.methods[0];
}

function createPlatformCard(platform) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "platform-card";
  button.dataset.platform = platform.id;
  button.setAttribute("aria-pressed", String(platformSelect.value === platform.id));

  const mark = document.createElement("span");
  mark.className = "platform-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = platformMarks[platform.id] || platform.id.slice(0, 2).toUpperCase();

  const label = document.createElement("span");
  label.className = "platform-name";
  label.textContent = readablePlatform(platform.id);

  const methods = document.createElement("span");
  methods.className = "platform-methods";
  methods.textContent = `${platform.methods.length} ${platform.methods.length === 1 ? "method" : "methods"}`;

  button.append(mark, label, methods);
  button.addEventListener("click", () => {
    platformSelect.value = platform.id;
    platformSelect.dispatchEvent(new Event("change"));
    document.querySelector("#workspace").scrollIntoView({ behavior: "smooth" });
    methodSelect.focus({ preventScroll: true });
  });
  return button;
}

async function loadPlatforms() {
  try {
    const response = await fetch("/api/platforms");
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.platforms)) {
      throw new Error(payload.message || "Could not load platform list.");
    }

    availablePlatforms = payload.platforms;
    platformSelect.replaceChildren();
    addOption(platformSelect, "", "Choose a platform");
    for (const platform of availablePlatforms) {
      addOption(platformSelect, platform.id, readablePlatform(platform.id));
    }
    platformSelect.disabled = false;
    populateMethods("");
    platformGrid.replaceChildren(...availablePlatforms.map(createPlatformCard));
    document.querySelector("#method-count").textContent =
      `${availablePlatforms.reduce((sum, item) => sum + item.methods.length, 0)} METHODS READY`;
  } catch (error) {
    platformSelect.replaceChildren();
    addOption(platformSelect, "", "Platform list unavailable");
    methodSelect.replaceChildren();
    addOption(methodSelect, "", "Start the local server to continue");
    platformGrid.replaceChildren();
    const message = document.createElement("p");
    message.className = "platform-loading";
    message.textContent = error.message || "Could not connect to the local scraper server.";
    platformGrid.append(message);
    showNotice("Could not connect to the local scraper server. Check that it is running, then refresh this page.", "error");
  }
}

function safeHttpUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function addText(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function getAuthor(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.name || value.username || value.title || "";
  return "";
}

function createMediaLink(url, label) {
  const safeUrl = safeHttpUrl(url);
  if (!safeUrl) return null;
  const link = document.createElement("a");
  link.href = safeUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

function appendMediaGroup(parent, heading, entries) {
  if (!Array.isArray(entries) || entries.length === 0) return;
  addText(parent, "h3", "result-subheading", `${heading} (${entries.length})`);
  const list = document.createElement("div");
  list.className = "media-list";
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object") continue;
    const row = document.createElement("div");
    row.className = "media-row";
    const rowMain = document.createElement("div");
    rowMain.className = "media-row-main";
    const title = entry.title || entry.name || entry.track || `${heading.slice(0, -1)} ${index + 1}`;
    addText(rowMain, "span", "media-row-title", String(title));
    const details = [entry.author, entry.artist, entry.quality, entry.type, entry.duration]
      .filter((value) => typeof value === "string" || typeof value === "number")
      .join(" · ");
    if (details) addText(rowMain, "span", "media-row-detail", details);
    row.append(rowMain);
    const imageUrl = safeHttpUrl(entry.thumbnail || entry.cover);
    if (imageUrl) {
      const image = document.createElement("img");
      image.className = "media-thumb";
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      row.prepend(image);
    }
    const link = createMediaLink(entry.url || entry.download || entry.link, "OPEN ↗");
    if (link) row.append(link);
    list.append(row);
  }
  if (list.childElementCount) parent.append(list);
}

function renderResult(payload, sourceUrl) {
  if (!payload || typeof payload !== "object") throw new Error("The scraper returned an unexpected response.");
  if (payload.status === false) throw new Error(payload.message || "The scraper could not resolve this link.");
  const result = payload.result;
  if (!result || typeof result !== "object") throw new Error(payload.message || "The response did not contain a result.");
  resultCard.replaceChildren();

  const summary = document.createElement("div");
  summary.className = "result-summary";
  const thumbnailUrl = safeHttpUrl(result.thumbnail || result.cover || result.image);
  if (thumbnailUrl) {
    const thumbnail = document.createElement("img");
    thumbnail.className = "result-thumbnail";
    thumbnail.src = thumbnailUrl;
    thumbnail.alt = result.title ? `Artwork for ${result.title}` : "Scraped content artwork";
    thumbnail.loading = "lazy";
    summary.append(thumbnail);
  }

  const summaryText = document.createElement("div");
  const title = result.title || result.name || "Scrape completed";
  addText(summaryText, "h3", "result-title", String(title));
  const tags = document.createElement("div");
  tags.className = "result-meta";
  const author = getAuthor(result.author || result.artist || result.creator || result.channel);
  if (author) addText(tags, "span", "meta-tag", author);
  for (const value of [result.type, result.itemCount ? `${result.itemCount} items` : ""]) {
    if (typeof value === "string" && value) addText(tags, "span", "meta-tag", value);
  }
  if (tags.childElementCount) summaryText.append(tags);
  if (typeof result.description === "string" && result.description) {
    addText(summaryText, "p", "result-description", result.description);
  }
  summary.append(summaryText);
  resultCard.append(summary);

  const sourceRow = document.createElement("div");
  sourceRow.className = "source-row";
  addText(sourceRow, "strong", "", "SOURCE URL");
  const sourceLink = createMediaLink(sourceUrl, sourceUrl);
  if (sourceLink) {
    sourceRow.append(document.createElement("br"), sourceLink);
  } else {
    addText(sourceRow, "div", "", sourceUrl);
  }
  resultCard.append(sourceRow);

  appendMediaGroup(resultCard, "Downloads", result.downloads);
  appendMediaGroup(resultCard, "Tracks", result.tracks);
  appendMediaGroup(resultCard, "Items", result.items);
  const directUrl = safeHttpUrl(result.download || result.url);
  if (directUrl) {
    addText(resultCard, "h3", "result-subheading", "Direct link");
    const directRow = document.createElement("div");
    directRow.className = "media-row";
    addText(directRow, "span", "media-row-title", "Open the resolved link");
    const directLink = createMediaLink(directUrl, "OPEN ↗");
    if (directLink) directRow.append(directLink);
    resultCard.append(directRow);
  }

  const knownFields = new Set([
    "title", "name", "author", "artist", "creator", "channel", "type", "itemCount",
    "thumbnail", "cover", "image", "description", "downloads", "tracks", "items", "download", "url",
  ]);
  const fields = Object.entries(result).filter(([key, value]) => !knownFields.has(key) && value != null);
  if (fields.length) {
    const definitionList = document.createElement("dl");
    definitionList.className = "generic-fields";
    for (const [key, value] of fields) {
      const field = document.createElement("div");
      field.className = "generic-field";
      addText(field, "dt", "", key.replace(/([A-Z])/g, " $1"));
      addText(field, "dd", "", typeof value === "object" ? JSON.stringify(value) : String(value));
      definitionList.append(field);
    }
    resultCard.append(definitionList);
  }

  lastResultJson = JSON.stringify(payload, null, 2);
  document.querySelector("#copy-result").disabled = false;
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateHistory() {
  historyCount.textContent = String(sessionHistory.length);
  clearHistoryButton.disabled = sessionHistory.length === 0;
  historyList.replaceChildren();
  if (!sessionHistory.length) {
    const empty = document.createElement("div");
    empty.className = "empty-history";
    addText(empty, "span", "", "↗").setAttribute("aria-hidden", "true");
    addText(empty, "p", "", "Your completed scrapes will show up here.");
    historyList.append(empty);
    return;
  }

  for (const item of sessionHistory) {
    const row = document.createElement("div");
    row.className = "history-item";
    const mark = addText(row, "span", "platform-mark", platformMarks[item.platform] || item.platform.slice(0, 2));
    mark.setAttribute("aria-hidden", "true");
    const info = document.createElement("div");
    info.className = "history-info";
    addText(info, "span", "history-title", item.title);
    addText(info, "span", "history-url", item.url);
    row.append(info);
    addText(row, "time", "history-time", item.time);
    historyList.append(row);
  }
}

platformSelect.addEventListener("change", () => {
  populateMethods(platformSelect.value);
  for (const card of platformGrid.querySelectorAll(".platform-card")) {
    card.setAttribute("aria-pressed", String(card.dataset.platform === platformSelect.value));
  }
});

document.querySelector("#clear-url").addEventListener("click", () => {
  urlInput.value = "";
  urlInput.focus();
});

document.querySelector("#clear-history").addEventListener("click", () => {
  sessionHistory = [];
  updateHistory();
});

document.querySelector("#copy-result").addEventListener("click", async (event) => {
  if (!lastResultJson) return;
  const button = event.currentTarget;
  try {
    await navigator.clipboard.writeText(lastResultJson);
    button.textContent = "COPIED!";
    window.setTimeout(() => { button.textContent = "COPY RESULT JSON"; }, 1500);
  } catch {
    showNotice("Could not access the clipboard. Select and copy the result manually.", "error");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showNotice("", "");
  resultSection.hidden = true;
  document.querySelector("#result-heading").textContent = "Here’s what we found.";
  lastResultJson = "";
  document.querySelector("#copy-result").disabled = true;
  const request = {
    url: urlInput.value.trim(),
    platform: platformSelect.value,
    method: methodSelect.value,
  };
  if (!request.url || !request.platform || !request.method) {
    showNotice("Add a URL and choose both a platform and scraper method.", "error");
    return;
  }

  submitButton.disabled = true;
  buttonLabel.textContent = "WORKING…";
  try {
    const response = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || "The request could not be completed.");
    renderResult(payload, request.url);
    const resultTitle = payload.result && (payload.result.title || payload.result.name);
    sessionHistory.unshift({
      platform: request.platform,
      title: resultTitle ? String(resultTitle) : "Scrape completed",
      url: request.url,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    sessionHistory = sessionHistory.slice(0, 8);
    updateHistory();
    showNotice("Scrape completed successfully.", "success");
  } catch (error) {
    const message = error instanceof TypeError && error.message === "Failed to fetch"
      ? "Tidak dapat terhubung ke server Linkora. Pastikan terminal yang menjalankan npm start masih terbuka, lalu muat ulang halaman."
      : error.message || "Something went wrong while scraping this link.";
    showNotice(message, "error");
    resultSection.hidden = false;
    resultCard.replaceChildren();
    addText(resultCard, "p", "result-description", message);
    document.querySelector("#result-heading").textContent = "This one didn’t work.";
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } finally {
    submitButton.disabled = false;
    buttonLabel.textContent = "SCRAPE LINK";
  }
});

loadPlatforms();
updateHistory();
