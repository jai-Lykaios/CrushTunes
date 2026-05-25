"use strict";

const audioTypes = new Set(["mp3", "m4a", "aac", "ogg", "opus", "flac", "wav", "webm"]);
const coverNames = new Set(["cover", "folder", "album", "front"]);
const libraryDbName = "crushtunes-library";
const libraryStoreName = "folders";
const uploadStoreName = "uploadedFiles";
const state = {
  tracks: [],
  filtered: [],
  playlists: new Map(),
  selectedPlaylist: "all",
  currentIndex: -1,
  objectUrls: new Set(),
  shuffled: false,
  savedFolders: [],
  nextTrackId: "",
  currentUser: "",
  shuffleQueue: [],
  shuffleHistory: [],
  repeating: false,
  likedKeys: new Set()
};

const $ = (id) => document.getElementById(id);
const els = {
  loginScreen: $("loginScreen"),
  loginForm: $("loginForm"),
  loginUser: $("loginUser"),
  loginPassword: $("loginPassword"),
  appShell: $("appShell"),
  userBadge: $("userBadge"),
  logoutButton: $("logoutButton"),
  audio: $("audio"),
  preloadAudio: $("preloadAudio"),
  pickFolderButton: $("pickFolderButton"),
  folderInput: $("folderInput"),
  refreshButton: $("refreshButton"),
  searchInput: $("searchInput"),
  libraryMeta: $("libraryMeta"),
  folderList: $("folderList"),
  trackList: $("trackList"),
  folderEyebrow: $("folderEyebrow"),
  playlistTitle: $("playlistTitle"),
  shuffleButton: $("shuffleButton"),
  miniPlayer: document.querySelector(".mini-player"),
  miniShuffleButton: $("miniShuffleButton"),
  miniPreviousButton: $("miniPreviousButton"),
  miniPlayButton: $("miniPlayButton"),
  miniNextButton: $("miniNextButton"),
  fullShuffleButton: $("fullShuffleButton"),
  repeatButton: $("repeatButton"),
  nowLikeButton: $("nowLikeButton"),
  playerPane: $("playerPane"),
  playerToggle: $("playerToggle"),
  playerCollapseButton: $("playerCollapseButton"),
  coverArt: $("coverArt"),
  coverPlaceholder: $("coverPlaceholder"),
  miniCoverArt: $("miniCoverArt"),
  miniCoverPlaceholder: $("miniCoverPlaceholder"),
  miniTitle: $("miniTitle"),
  miniArtist: $("miniArtist"),
  nowAlbum: $("nowAlbum"),
  nowTitle: $("nowTitle"),
  nowArtist: $("nowArtist"),
  progressSlider: $("progressSlider"),
  progressArcBar: $("progressArcBar"),
  currentTime: $("currentTime"),
  durationTime: $("durationTime"),
  wheelPrevTime: $("wheelPrevTime"),
  wheelPrevTitle: $("wheelPrevTitle"),
  wheelPrevArtist: $("wheelPrevArtist"),
  wheelCurrentTime: $("wheelCurrentTime"),
  wheelCurrentTitle: $("wheelCurrentTitle"),
  wheelCurrentArtist: $("wheelCurrentArtist"),
  wheelNextTime: $("wheelNextTime"),
  wheelNextTitle: $("wheelNextTitle"),
  wheelNextArtist: $("wheelNextArtist"),
  previousButton: $("previousButton"),
  playButton: $("playButton"),
  nextButton: $("nextButton")
};

const icons = {
  folder: '<path d="M3 7.5V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1.5"/><path d="M3 7.5h18l-1.7 9.8a2 2 0 0 1-2 1.7H6.7a2 2 0 0 1-2-1.7L3 7.5Z"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  refresh: '<path d="M20 6v5h-5"/><path d="M4 18v-5h5"/><path d="M18 9a7 7 0 0 0-11.9-3.3L4 8"/><path d="M6 15a7 7 0 0 0 11.9 3.3L20 16"/>',
  shuffle: '<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  previous: '<path d="M19 20 9 12l10-8v16Z"/><path d="M5 19V5"/>',
  play: '<path d="M8 5v14l11-7L8 5Z"/>',
  pause: '<path d="M8 5h4v14H8z"/><path d="M16 5h4v14h-4z"/>',
  next: '<path d="m5 4 10 8-10 8V4Z"/><path d="M19 5v14"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/>',
  "chevron-up": '<path d="m18 15-6-6-6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>'
};

function paintIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((node) => {
    const name = node.dataset.icon;
    node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || ""}</svg>`;
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeUser(value) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function setLoggedIn(user) {
  state.currentUser = user;
  loadLikedTracks();
  localStorage.setItem("crushtunes-user", user);
  els.userBadge.textContent = `@${user}`;
  els.loginScreen.classList.add("hidden");
  els.appShell.classList.remove("app-locked");
  bootLibrary();
}

function resetLibraryState() {
  els.audio.pause();
  els.audio.removeAttribute("src");
  els.preloadAudio.removeAttribute("src");
  revokeUrls();
  state.tracks = [];
  state.filtered = [];
  state.playlists = new Map();
  state.selectedPlaylist = "all";
  state.currentIndex = -1;
  state.savedFolders = [];
  state.nextTrackId = "";
  state.shuffleQueue = [];
  state.shuffleHistory = [];
  state.repeating = false;
  els.audio.loop = false;
  els.folderList.innerHTML = "";
  els.trackList.innerHTML = "";
  els.miniTitle.textContent = "Choose a playlist";
  els.miniArtist.textContent = "Add folders to start listening.";
  els.nowAlbum.textContent = "Ready";
  els.nowTitle.textContent = "Choose a playlist";
  els.nowArtist.textContent = "Your songs will appear here.";
  updateLikeControls();
  updateWheelTracks();
  updateProgress();
  renderLibrary();
}

function logout() {
  localStorage.removeItem("crushtunes-user");
  state.currentUser = "";
  resetLibraryState();
  els.appShell.classList.add("app-locked");
  els.loginScreen.classList.remove("hidden");
  els.loginPassword.value = "";
  els.loginUser.focus();
}

function likedStorageKey() {
  return `crushtunes-liked-${state.currentUser || "guest"}`;
}

function loadLikedTracks() {
  try {
    const saved = JSON.parse(localStorage.getItem(likedStorageKey()) || "[]");
    state.likedKeys = new Set(Array.isArray(saved) ? saved : []);
  } catch {
    state.likedKeys = new Set();
  }
}

function saveLikedTracks() {
  localStorage.setItem(likedStorageKey(), JSON.stringify([...state.likedKeys]));
}

function likeKey(track) {
  return track?.sourceKey || `${track?.playlist || ""}/${track?.fileName || track?.title || ""}`;
}

function isLiked(track) {
  return Boolean(track && state.likedKeys.has(likeKey(track)));
}

function toggleLike(track) {
  if (!track) return;
  const key = likeKey(track);
  if (state.likedKeys.has(key)) state.likedKeys.delete(key);
  else state.likedKeys.add(key);
  saveLikedTracks();
  applyFilters();
  updateLikeControls(track);
}

function updateLikeControls(track = state.tracks[state.currentIndex]) {
  if (!els.nowLikeButton) return;
  const liked = isLiked(track);
  els.nowLikeButton.classList.toggle("active", liked);
  els.nowLikeButton.title = liked ? "Remove from liked songs" : "Like current song";
  els.nowLikeButton.setAttribute("aria-label", liked ? "Remove from liked songs" : "Like current song");
}

function cleanName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function fileExt(name) {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function folderFromPath(path) {
  const bits = path.split(/[\\/]/).filter(Boolean);
  bits.pop();
  return bits.length ? bits.join(" / ") : "Root";
}

function displayFolderName(folder, fallback = "Folder") {
  if (!folder || folder === "Root") return fallback;
  const bits = folder.split(" / ").filter(Boolean);
  return bits.at(-1) || fallback;
}

function revokeUrls() {
  state.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  state.objectUrls.clear();
}

function makeObjectUrl(file) {
  const url = URL.createObjectURL(file);
  state.objectUrls.add(url);
  return url;
}

async function pickFolder() {
  if ("showDirectoryPicker" in window) {
    try {
      const dir = await window.showDirectoryPicker({ mode: "read" });
      const files = [];
      await collectDirectoryFiles(dir, "", files);
      const savedFolder = await saveDirectoryHandle(dir);
      await loadFiles(files, dir.name || "Playlist", { sourceId: savedFolder.id, sourceLabel: dir.name });
      return;
    } catch (error) {
      if (error.name !== "AbortError") console.warn(error);
    }
  }
  els.folderInput.click();
}

async function collectDirectoryFiles(directoryHandle, path, files) {
  for await (const entry of directoryHandle.values()) {
    const nextPath = path ? `${path}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      await collectDirectoryFiles(entry, nextPath, files);
    } else {
      const file = await entry.getFile();
      Object.defineProperty(file, "webkitRelativePath", { value: nextPath, configurable: true });
      files.push(file);
    }
  }
}

function openLibraryDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(libraryDbName, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(libraryStoreName)) {
        request.result.createObjectStore(libraryStoreName, { keyPath: "id" });
      }
      if (!request.result.objectStoreNames.contains(uploadStoreName)) {
        request.result.createObjectStore(uploadStoreName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readSavedFolders() {
  if (!("indexedDB" in window)) return [];
  const db = await openLibraryDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(libraryStoreName, "readonly").objectStore(libraryStoreName).getAll();
    request.onsuccess = () => resolve((request.result || []).filter((folder) => folder.user === state.currentUser));
    request.onerror = () => reject(request.error);
  });
}

async function writeSavedFolder(folder) {
  const db = await openLibraryDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(libraryStoreName, "readwrite").objectStore(libraryStoreName).put(folder);
    request.onsuccess = () => resolve(folder);
    request.onerror = () => reject(request.error);
  });
}

async function readUploadedFiles() {
  if (!("indexedDB" in window)) return [];
  const db = await openLibraryDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(uploadStoreName, "readonly").objectStore(uploadStoreName).getAll();
    request.onsuccess = () => resolve((request.result || []).filter((record) => record.user === state.currentUser));
    request.onerror = () => reject(request.error);
  });
}

async function writeUploadedFiles(files) {
  if (!("indexedDB" in window) || !files.length) return;
  const db = await openLibraryDb();
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(uploadStoreName, "readwrite");
    const store = transaction.objectStore(uploadStoreName);
    files.forEach((file) => {
      const relativePath = file.webkitRelativePath || file.name;
      store.put({
        id: [state.currentUser, relativePath, file.size, file.lastModified || 0].join("|"),
        user: state.currentUser,
        relativePath,
        file
      });
    });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

function hydrateUploadedFiles(records) {
  return records.map((record) => {
    const file = record.file;
    try {
      Object.defineProperty(file, "webkitRelativePath", { value: record.relativePath || file.name, configurable: true });
    } catch {
      // The file name fallback still works if the cloned File object is non-extensible.
    }
    return file;
  });
}

async function saveDirectoryHandle(handle) {
  for (const folder of state.savedFolders) {
    if (folder.handle?.isSameEntry && await folder.handle.isSameEntry(handle)) return folder;
  }

  const folder = {
    id: `folder-${makeId()}`,
    user: state.currentUser,
    name: handle.name || "Music folder",
    addedAt: Date.now(),
    handle
  };
  await writeSavedFolder(folder);
  state.savedFolders.push(folder);
  renderSavedFolderMeta();
  return folder;
}

async function ensurePermission(handle, shouldRequest) {
  if (!handle?.queryPermission) return true;
  const current = await handle.queryPermission({ mode: "read" });
  if (current === "granted") return true;
  if (!shouldRequest || !handle.requestPermission) return false;
  return await handle.requestPermission({ mode: "read" }) === "granted";
}

async function scanSavedFolders({ requestPermission = true } = {}) {
  if (!state.savedFolders.length) {
    renderSavedFolderMeta();
    return;
  }

  let imported = 0;
  for (const folder of state.savedFolders) {
    const allowed = await ensurePermission(folder.handle, requestPermission);
    if (!allowed) continue;
    const files = [];
    await collectDirectoryFiles(folder.handle, "", files);
    const before = state.tracks.length;
    await loadFiles(files, folder.name, { sourceId: folder.id, sourceLabel: folder.name, quiet: true });
    imported += state.tracks.length - before;
  }
  renderSavedFolderMeta(imported);
}

function renderSavedFolderMeta(imported = null) {
  const folderCount = state.savedFolders.length;
  const importedCopy = imported === null ? "" : ` ${imported} new song${imported === 1 ? "" : "s"} added.`;
  els.libraryMeta.textContent = folderCount
    ? `${folderCount} remembered music folder${folderCount === 1 ? "" : "s"} for @${state.currentUser}.${importedCopy}`
    : `Add one folder for @${state.currentUser}. It will be remembered in this browser.`;
}

function playlistNameFromFiles(files) {
  const firstPath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath || "";
  return firstPath.split(/[\\/]/).filter(Boolean)[0] || `Playlist ${state.playlists.size + 1}`;
}

async function loadFiles(fileList, playlistName, options = {}) {
  const files = Array.from(fileList);
  const importName = playlistName || playlistNameFromFiles(files);
  const coverByFolder = new Map();
  const imageByFolder = new Map();
  const audioFiles = [];

  files.forEach((file) => {
    const ext = fileExt(file.name);
    const folder = folderFromPath(file.webkitRelativePath || file.name);
    const base = cleanName(file.name).toLowerCase();
    const isImage = file.type.startsWith("image/") || ["jpg", "jpeg", "png", "webp"].includes(ext);
    if (isImage) {
      const imageUrl = makeObjectUrl(file);
      if (!imageByFolder.has(folder)) imageByFolder.set(folder, imageUrl);
      if (coverNames.has(base)) coverByFolder.set(folder, imageUrl);
    }
    if (file.type.startsWith("audio/") || audioTypes.has(ext)) audioFiles.push(file);
  });

  if (!options.quiet) els.libraryMeta.textContent = `Scanning ${audioFiles.length} audio file${audioFiles.length === 1 ? "" : "s"}...`;
  const tracks = [];
  for (let index = 0; index < audioFiles.length; index += 1) {
    const file = audioFiles[index];
    const folder = folderFromPath(file.webkitRelativePath || file.name);
    const playlist = displayFolderName(folder, importName);
    const url = makeObjectUrl(file);
    const metadata = await readMetadata(file).catch(() => ({}));
    tracks.push({
      id: `local-${makeId()}`,
      title: metadata.title || cleanName(file.name),
      artist: metadata.artist || "Unknown artist",
      album: metadata.album || folder,
      folder,
      playlist,
      url,
      coverUrl: metadata.coverUrl || coverByFolder.get(folder) || imageByFolder.get(folder) || "",
      fileName: file.name,
      sourceKey: [
        options.sourceId || options.sourceLabel || importName,
        file.webkitRelativePath || file.name,
        file.size,
        file.lastModified || 0
      ].join("|")
    });
  }

  addTracksAsFolders(tracks, options);
}

async function readMetadata(file) {
  if (fileExt(file.name) !== "mp3") return {};
  const header = new Uint8Array(await file.slice(0, Math.min(file.size, 10)).arrayBuffer());
  if (header.length < 10 || header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) return {};
  const tagSize = syncSafe(header[6], header[7], header[8], header[9]);
  const bytesToRead = Math.min(file.size, 10 + tagSize);
  return parseId3(await file.slice(0, bytesToRead).arrayBuffer());
}

function parseId3(buffer) {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return {};
  const version = bytes[3];
  const tagSize = syncSafe(bytes[6], bytes[7], bytes[8], bytes[9]);
  let offset = 10;
  const end = Math.min(10 + tagSize, bytes.length);
  const meta = {};

  if (version === 3 && (bytes[5] & 0x40)) {
    offset += 4 + view.getUint32(10);
  } else if (version === 4 && (bytes[5] & 0x40)) {
    offset += syncSafe(bytes[10], bytes[11], bytes[12], bytes[13]);
  }

  if (version === 2) {
    while (offset + 6 <= end) {
      const id = ascii(bytes, offset, 3);
      const size = (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
      if (!id.trim() || size <= 0 || offset + 6 + size > bytes.length) break;
      const frame = bytes.slice(offset + 6, offset + 6 + size);
      if (id === "TT2") meta.title = decodeTextFrame(frame);
      if (id === "TP1") meta.artist = decodeTextFrame(frame);
      if (id === "TAL") meta.album = decodeTextFrame(frame);
      if (id === "PIC" && !meta.coverUrl) meta.coverUrl = decodeCoverFrame(frame, true);
      offset += 6 + size;
    }
    return meta;
  }

  while (offset + 10 <= end) {
    const id = ascii(bytes, offset, 4);
    const size = version === 4
      ? syncSafe(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
      : view.getUint32(offset + 4);
    if (!id.trim() || size <= 0 || offset + 10 + size > bytes.length) break;
    const frame = bytes.slice(offset + 10, offset + 10 + size);
    if (id === "TIT2") meta.title = decodeTextFrame(frame);
    if (id === "TPE1") meta.artist = decodeTextFrame(frame);
    if (id === "TALB") meta.album = decodeTextFrame(frame);
    if (id === "APIC" && !meta.coverUrl) meta.coverUrl = decodeCoverFrame(frame);
    offset += 10 + size;
  }

  return meta;
}

function syncSafe(a, b, c, d) {
  return (a << 21) | (b << 14) | (c << 7) | d;
}

function ascii(bytes, start, length) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function decodeTextFrame(frame) {
  if (!frame.length) return "";
  const encoding = frame[0];
  const payload = frame.slice(1);
  let label = "latin1";
  if (encoding === 1 || encoding === 2) label = "utf-16";
  if (encoding === 3) label = "utf-8";
  return new TextDecoder(label).decode(payload).replace(/\0/g, "").trim();
}

function decodeCoverFrame(frame, isV22 = false) {
  if (!frame.length) return "";
  let offset = 1;
  let mime = "image/jpeg";
  if (isV22) {
    const format = ascii(frame, offset, 3).toLowerCase();
    mime = format === "png" ? "image/png" : "image/jpeg";
    offset += 3;
  } else {
    const mimeEnd = frame.indexOf(0, offset);
    if (mimeEnd === -1) return "";
    mime = ascii(frame, offset, mimeEnd - offset) || "image/jpeg";
    offset = mimeEnd + 1;
  }
  if (mime === "image/jpg") mime = "image/jpeg";
  offset += 1;
  offset = skipEncodedText(frame, offset, frame[0]);
  if (offset >= frame.length) return "";
  const blob = new Blob([frame.slice(offset)], { type: mime });
  return makeObjectUrl(blob);
}

function skipEncodedText(frame, offset, encoding) {
  if (encoding === 1 || encoding === 2) {
    while (offset + 1 < frame.length) {
      if (frame[offset] === 0 && frame[offset + 1] === 0) return offset + 2;
      offset += 2;
    }
    return frame.length;
  }
  while (offset < frame.length && frame[offset] !== 0) offset += 1;
  return offset + 1;
}

async function loadServerLibrary() {
  try {
    const response = await fetch("library.json", { cache: "no-store" });
    if (!response.ok) throw new Error("No server library");
    const data = await response.json();
    const tracks = (data.tracks || []).map((track, index) => ({
      id: `server-${index}-${track.url}`,
      title: track.title || cleanName(track.url || `Track ${index + 1}`),
      artist: track.artist || "Unknown artist",
      album: track.album || track.folder || "Unknown album",
      folder: track.folder || folderFromPath(track.url || ""),
      playlist: track.playlist || displayFolderName(track.folder || folderFromPath(track.url || ""), "Server library"),
      url: track.url,
      coverUrl: track.cover || track.coverUrl || "",
      fileName: track.url || "",
      sourceKey: `server|${track.url || index}`
    }));
    if (tracks.length) addTracksAsFolders(tracks);
  } catch {
    renderLibrary();
  }
}

function addTracksAsFolders(tracks, options = {}) {
  if (!tracks.length) {
    if (!options.quiet) els.libraryMeta.textContent = "No supported audio files found in that folder.";
    return;
  }
  const existingIds = new Set(state.tracks.map((track) => track.sourceKey || `${track.playlist}/${track.fileName}`));
  const uniqueTracks = tracks.filter((track) => !existingIds.has(track.sourceKey || `${track.playlist}/${track.fileName}`));
  state.tracks = [...state.tracks, ...uniqueTracks]
    .sort((a, b) => a.playlist.localeCompare(b.playlist) || a.folder.localeCompare(b.folder) || a.title.localeCompare(b.title));
  rebuildFolders();
  if (uniqueTracks.length) state.selectedPlaylist = uniqueTracks[0].playlist;
  applyFilters();
  if (!options.quiet) {
    els.libraryMeta.textContent = `${uniqueTracks.length} new song${uniqueTracks.length === 1 ? "" : "s"} organized into ${state.playlists.size} folder${state.playlists.size === 1 ? "" : "s"}.`;
  }
}

function rebuildFolders() {
  state.playlists = new Map();
  state.tracks.forEach((track) => {
    const folderGroup = state.playlists.get(track.playlist) || {
      name: track.playlist,
      count: 0,
      coverUrl: "",
      folder: track.folder
    };
    folderGroup.count += 1;
    if (!folderGroup.coverUrl && track.coverUrl) folderGroup.coverUrl = track.coverUrl;
    state.playlists.set(track.playlist, folderGroup);
  });
}

function applyFilters() {
  const query = els.searchInput.value.trim().toLowerCase();
  state.filtered = state.tracks.filter((track) => {
    const inPlaylist = state.selectedPlaylist === "all"
      || (state.selectedPlaylist === "liked" && isLiked(track))
      || track.playlist === state.selectedPlaylist;
    const haystack = `${track.title} ${track.artist} ${track.album} ${track.folder}`.toLowerCase();
    return inPlaylist && (!query || haystack.includes(query));
  });
  renderLibrary();
  updateWheelTracks();
}

function renderLibrary() {
  renderFolders();
  renderTracks();
}

function renderFolders() {
  const allFolder = { name: "All music", count: state.tracks.length, coverUrl: state.tracks.find((track) => track.coverUrl)?.coverUrl || "" };
  const likedTracks = state.tracks.filter(isLiked);
  const likedFolder = { name: "Liked songs", count: likedTracks.length, coverUrl: likedTracks.find((track) => track.coverUrl)?.coverUrl || "" };
  const playlists = [["all", allFolder], ["liked", likedFolder], ...Array.from(state.playlists.entries())];
  els.folderList.innerHTML = playlists.map(([id, folder]) => `
    <button class="folder-card ${state.selectedPlaylist === id ? "active" : ""}" type="button" data-folder="${escapeAttr(id)}">
      <span class="folder-cover">
        ${folder.coverUrl ? `<img src="${escapeAttr(folder.coverUrl)}" alt="">` : `<span data-icon="${id === "liked" ? "heart" : "folder"}"></span>`}
      </span>
      <span class="folder-copy">
        <span class="folder-name">${escapeHtml(folder.name)}</span>
        <span class="folder-count">${folder.count} track${folder.count === 1 ? "" : "s"}</span>
      </span>
    </button>
  `).join("");
  paintIcons(els.folderList);
}

function renderTracks() {
  els.folderEyebrow.textContent = state.selectedPlaylist === "all"
    ? "Library"
    : state.selectedPlaylist === "liked" ? "Your favorites" : "Folder locked in";
  els.playlistTitle.textContent = state.selectedPlaylist === "all"
    ? "All songs"
    : state.selectedPlaylist === "liked" ? "Liked songs" : state.selectedPlaylist;
  if (!state.filtered.length) {
    els.trackList.innerHTML = `<div class="empty-state">${state.selectedPlaylist === "liked" ? "No liked songs yet. Tap a heart to add one here." : "No songs found. Add a music folder or adjust search."}</div>`;
    return;
  }
  els.trackList.innerHTML = state.filtered.map((track) => `
    <button class="track-row ${state.currentIndex >= 0 && state.tracks[state.currentIndex]?.id === track.id ? "active" : ""}" type="button" data-track="${escapeAttr(track.id)}">
      <span class="track-thumb">${track.coverUrl ? `<img src="${escapeAttr(track.coverUrl)}" alt="">` : `<span data-icon="music"></span>`}</span>
      <span>
        <span class="track-title">${escapeHtml(track.title)}</span>
        <span class="track-sub">${escapeHtml(track.artist)}</span>
      </span>
      <span class="track-folder">${escapeHtml(track.playlist)}</span>
      <span class="track-like ${isLiked(track) ? "active" : ""}" role="button" tabindex="0" aria-label="${isLiked(track) ? "Remove from liked songs" : "Like song"}" title="${isLiked(track) ? "Remove from liked songs" : "Like song"}" data-like="${escapeAttr(track.id)}">
        <span data-icon="heart"></span>
      </span>
    </button>
  `).join("");
  paintIcons(els.trackList);
}

function lockInPlaylist(id) {
  state.selectedPlaylist = id;
  els.trackList.classList.remove("lock-in");
  void els.trackList.offsetWidth;
  els.trackList.classList.add("lock-in");
  applyFilters();
}

function playTrackById(id, options = {}) {
  const index = state.tracks.findIndex((track) => track.id === id);
  if (index >= 0) playTrack(index, options);
}

async function playTrack(index, options = {}) {
  const track = state.tracks[index];
  if (!track) return;
  state.currentIndex = index;
  state.nextTrackId = "";
  if (state.shuffled && !options.keepShuffleQueue) buildShuffleQueue(track.id);
  els.audio.src = track.url;
  updateNowPlaying(track);
  renderTracks();
  try {
    await els.audio.play();
    primeNextTrack();
  } catch {
    updatePlayIcon();
  }
}

function updateNowPlaying(track) {
  els.nowAlbum.textContent = track.album || "Unknown album";
  els.nowTitle.textContent = track.title;
  els.nowArtist.textContent = track.artist || "Unknown artist";
  els.miniTitle.textContent = track.title;
  els.miniArtist.textContent = track.artist || "Unknown artist";
  updateWheelTracks(track);
  updateLikeControls(track);
  if (track.coverUrl) {
    els.coverArt.src = track.coverUrl;
    els.miniCoverArt.src = track.coverUrl;
    els.coverArt.style.display = "block";
    els.miniCoverArt.style.display = "block";
    els.coverPlaceholder.style.display = "none";
    els.miniCoverPlaceholder.style.display = "none";
  } else {
    els.coverArt.removeAttribute("src");
    els.miniCoverArt.removeAttribute("src");
    els.coverArt.style.display = "none";
    els.miniCoverArt.style.display = "none";
    els.coverPlaceholder.style.display = "grid";
    els.miniCoverPlaceholder.style.display = "inline-flex";
  }
}

function setWheelTrack(prefix, track, fallbackTitle, fallbackArtist, timeLabel) {
  els[`${prefix}Time`].textContent = timeLabel;
  els[`${prefix}Title`].textContent = track?.title || fallbackTitle;
  els[`${prefix}Artist`].textContent = track?.artist || fallbackArtist;
}

function updateWheelTracks(currentTrack = state.tracks[state.currentIndex]) {
  const currentFiltered = relativeCurrentFilteredIndex();
  const previousTrack = state.filtered.length && currentFiltered >= 0
    ? state.filtered[(currentFiltered - 1 + state.filtered.length) % state.filtered.length]
    : null;
  const nextTrack = getNextTrack(1);
  setWheelTrack("wheelPrev", previousTrack, "Previous", "Track", "15");
  setWheelTrack("wheelCurrent", currentTrack, "Ready", "CrushTunes", "01");
  setWheelTrack("wheelNext", nextTrack, "Next", "Track", "02");
}

function setPlayerExpanded(expanded) {
  els.playerPane.classList.toggle("is-expanded", expanded);
  els.playerPane.classList.toggle("is-collapsed", !expanded);
  els.playerToggle.setAttribute("aria-label", expanded ? "Minimize now playing" : "Expand now playing");
  els.playerToggle.setAttribute("aria-expanded", String(expanded));
}

function relativeCurrentFilteredIndex() {
  if (state.currentIndex < 0) return -1;
  const id = state.tracks[state.currentIndex]?.id;
  return state.filtered.findIndex((track) => track.id === id);
}

function stepTrack(delta) {
  if (!state.filtered.length) return;
  if (state.shuffled) {
    const current = state.tracks[state.currentIndex];
    if (delta < 0) {
      const previousId = state.shuffleHistory.pop();
      if (previousId) {
        playTrackById(previousId, { keepShuffleQueue: true });
        return;
      }
    } else {
      if (!state.shuffleQueue.length) buildShuffleQueue(current?.id || "");
      const nextId = state.shuffleQueue.shift();
      if (nextId) {
        if (current) state.shuffleHistory.push(current.id);
        playTrackById(nextId, { keepShuffleQueue: true });
        return;
      }
    }
  }
  const nextTrack = getSequentialTrack(delta);
  if (nextTrack) playTrackById(nextTrack.id);
}

function getSequentialTrack(delta = 1) {
  if (!state.filtered.length) return null;
  const current = relativeCurrentFilteredIndex();
  const next = current === -1
    ? 0
    : (current + delta + state.filtered.length) % state.filtered.length;
  return state.filtered[next] || null;
}

function getNextTrack(delta = 1) {
  if (!state.shuffled) return getSequentialTrack(delta);
  if (delta < 0) {
    const previousId = state.shuffleHistory.at(-1);
    return previousId ? state.tracks.find((track) => track.id === previousId) || null : getSequentialTrack(delta);
  }
  const current = state.tracks[state.currentIndex];
  if (!state.shuffleQueue.length) buildShuffleQueue(current?.id || "");
  return state.tracks.find((track) => track.id === state.shuffleQueue[0]) || getSequentialTrack(delta);
}

function buildShuffleQueue(excludeId = "") {
  const ids = state.filtered.map((track) => track.id).filter((id) => id !== excludeId);
  for (let index = ids.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [ids[index], ids[swapIndex]] = [ids[swapIndex], ids[index]];
  }
  state.shuffleQueue = ids;
}

function setShuffle(enabled) {
  state.shuffled = enabled;
  state.shuffleHistory = [];
  buildShuffleQueue(state.tracks[state.currentIndex]?.id || "");
  els.shuffleButton.classList.toggle("active", enabled);
  els.miniShuffleButton?.classList.toggle("active", enabled);
  els.fullShuffleButton.classList.toggle("active", enabled);
  updateWheelTracks();
}

function setRepeat(enabled) {
  state.repeating = enabled;
  els.audio.loop = enabled;
  els.repeatButton.classList.toggle("active", enabled);
}

function primeNextTrack() {
  const nextTrack = getNextTrack(1);
  if (!nextTrack || nextTrack.id === state.nextTrackId || nextTrack.url === els.audio.src) return;
  state.nextTrackId = nextTrack.id;
  els.preloadAudio.src = nextTrack.url;
  els.preloadAudio.load();
}

function playPreloadedNext() {
  const nextTrack = getNextTrack(1);
  if (!nextTrack) return;
  playTrackById(nextTrack.id);
}

function updateProgress() {
  const duration = els.audio.duration || 0;
  const current = els.audio.currentTime || 0;
  els.progressSlider.value = duration ? Math.round((current / duration) * 1000) : 0;
  updateProgressFill();
  els.currentTime.textContent = formatTime(current);
  els.durationTime.textContent = formatTime(duration);
}

function updatePlayIcon() {
  const icon = els.audio.paused ? "play" : "pause";
  const label = els.audio.paused ? "Play" : "Pause";
  [els.playButton, els.miniPlayButton].filter(Boolean).forEach((button) => {
    button.querySelector("[data-icon]").dataset.icon = icon;
    button.title = label;
    button.setAttribute("aria-label", label);
    paintIcons(button);
  });
}

function togglePlayback() {
  if (!els.audio.src && state.filtered.length) {
    playTrackById(state.filtered[0].id);
    return;
  }
  if (els.audio.paused) els.audio.play();
  else els.audio.pause();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function updateProgressFill() {
  const value = Number(els.progressSlider.value || 0) / 10;
  els.progressSlider.style.setProperty("--progress", `${value}%`);
  els.playerPane.style.setProperty("--progress-angle", `${value * 3.6}deg`);
  if (els.progressArcBar) {
    const length = els.progressArcBar.getTotalLength();
    els.progressArcBar.style.strokeDasharray = `${length}`;
    els.progressArcBar.style.strokeDashoffset = `${length - (length * value / 100)}`;
  }
}

els.pickFolderButton?.addEventListener("click", pickFolder);
els.folderInput?.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);
  writeUploadedFiles(files).catch(console.warn);
  loadFiles(files, "Uploaded files", { sourceId: `uploads-${state.currentUser}`, sourceLabel: "Uploaded files" });
  event.target.value = "";
});
els.refreshButton.addEventListener("click", async () => {
  await scanSavedFolders({ requestPermission: true });
  await loadServerLibrary();
});
els.searchInput.addEventListener("input", applyFilters);
els.folderList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-folder]");
  if (!button) return;
  lockInPlaylist(button.dataset.folder);
});
els.trackList.addEventListener("click", (event) => {
  const likeButton = event.target.closest("[data-like]");
  if (likeButton) {
    event.preventDefault();
    event.stopPropagation();
    toggleLike(state.tracks.find((track) => track.id === likeButton.dataset.like));
    return;
  }
  const button = event.target.closest("[data-track]");
  if (button) playTrackById(button.dataset.track);
});
els.trackList.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const likeButton = event.target.closest("[data-like]");
  if (!likeButton) return;
  event.preventDefault();
  toggleLike(state.tracks.find((track) => track.id === likeButton.dataset.like));
});
els.shuffleButton.addEventListener("click", () => {
  setShuffle(!state.shuffled);
});
els.miniShuffleButton?.addEventListener("click", () => setShuffle(!state.shuffled));
els.fullShuffleButton.addEventListener("click", () => setShuffle(!state.shuffled));
els.repeatButton.addEventListener("click", () => setRepeat(!state.repeating));
els.nowLikeButton?.addEventListener("click", () => toggleLike(state.tracks[state.currentIndex]));
els.miniPlayer?.addEventListener("click", (event) => {
  if (event.target.closest(".mini-controls")) return;
  setPlayerExpanded(true);
});
els.playerToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  setPlayerExpanded(true);
});
els.playerCollapseButton.addEventListener("click", () => setPlayerExpanded(false));
els.playButton.addEventListener("click", togglePlayback);
els.miniPlayButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  togglePlayback();
});
els.previousButton.addEventListener("click", () => stepTrack(-1));
els.nextButton.addEventListener("click", () => stepTrack(1));
els.miniPreviousButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  stepTrack(-1);
});
els.miniNextButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  stepTrack(1);
});
els.progressSlider.addEventListener("input", () => {
  const duration = els.audio.duration || 0;
  if (!duration) return;
  const progress = Number(els.progressSlider.value) / 1000;
  els.currentTime.textContent = formatTime(progress * duration);
  updateProgressFill();
});
els.progressSlider.addEventListener("change", () => {
  const duration = els.audio.duration || 0;
  if (!duration) return;
  els.audio.currentTime = (Number(els.progressSlider.value) / 1000) * duration;
});
els.audio.addEventListener("play", updatePlayIcon);
els.audio.addEventListener("pause", updatePlayIcon);
els.audio.addEventListener("loadedmetadata", updateProgress);
els.audio.addEventListener("timeupdate", updateProgress);
els.audio.addEventListener("canplay", primeNextTrack);
els.audio.addEventListener("ended", playPreloadedNext);

paintIcons();
els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const user = normalizeUser(els.loginUser.value);
  if (!user) return;
  setLoggedIn(user);
});
els.logoutButton.addEventListener("click", logout);

function bootLibrary() {
  resetLibraryState();
  loadLikedTracks();
  Promise.all([readSavedFolders(), readUploadedFiles()])
    .then(([folders, uploads]) => {
      state.savedFolders = folders;
      renderSavedFolderMeta();
      const uploadedFiles = hydrateUploadedFiles(uploads);
      if (uploadedFiles.length) {
        return loadFiles(uploadedFiles, "Uploaded files", { sourceId: `uploads-${state.currentUser}`, sourceLabel: "Uploaded files", quiet: true })
          .then(() => scanSavedFolders({ requestPermission: false }));
      }
      return scanSavedFolders({ requestPermission: false });
    })
    .catch(() => renderSavedFolderMeta())
    .finally(loadServerLibrary);
}

const savedUser = localStorage.getItem("crushtunes-user");
if (savedUser) {
  els.loginUser.value = savedUser;
  setLoggedIn(savedUser);
} else {
  renderLibrary();
}
