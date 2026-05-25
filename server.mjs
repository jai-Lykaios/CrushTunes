import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { basename, dirname, extname, join, normalize, relative, resolve, sep } from "node:path";

const port = Number(process.env.PORT || 8080);
const root = process.cwd();
const mediaRoot = resolve(process.env.MUSIC_DIR || join(root, "music"));
const audioExts = new Set([".mp3", ".m4a", ".aac", ".ogg", ".opus", ".flac", ".wav", ".webm"]);
const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const coverNames = new Set(["cover", "folder", "album", "front"]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".opus": "audio/ogg",
  ".flac": "audio/flac",
  ".wav": "audio/wav",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

function isInside(base, target) {
  const rel = relative(base, target);
  return rel === "" || (!rel.startsWith("..") && !rel.includes(`..${sep}`));
}

function mediaUrl(filePath) {
  return `/media/${relative(mediaRoot, filePath).split(sep).map(encodeURIComponent).join("/")}`;
}

function displayName(filePath) {
  return basename(filePath, extname(filePath)).replace(/[_-]+/g, " ").trim();
}

function playlistName(filePath) {
  const folder = dirname(relative(mediaRoot, filePath));
  if (!folder || folder === ".") return basename(mediaRoot);
  const parts = folder.split(sep).filter(Boolean);
  return parts.at(-1) || basename(mediaRoot);
}

function scanMediaLibrary() {
  if (!existsSync(mediaRoot)) return { tracks: [], source: mediaRoot };

  const audioFiles = [];
  const coverByFolder = new Map();
  const firstImageByFolder = new Map();

  function walk(folder) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const fullPath = join(folder, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      const ext = extname(entry.name).toLowerCase();
      const parent = dirname(fullPath);
      if (audioExts.has(ext)) audioFiles.push(fullPath);
      if (imageExts.has(ext)) {
        const name = basename(entry.name, ext).toLowerCase();
        if (!firstImageByFolder.has(parent)) firstImageByFolder.set(parent, fullPath);
        if (coverNames.has(name)) coverByFolder.set(parent, fullPath);
      }
    }
  }

  walk(mediaRoot);

  const tracks = audioFiles.sort((a, b) => a.localeCompare(b)).map((filePath) => {
    const parent = dirname(filePath);
    const cover = coverByFolder.get(parent) || firstImageByFolder.get(parent);
    const relFolder = dirname(relative(mediaRoot, filePath));
    return {
      title: displayName(filePath),
      artist: "Unknown artist",
      album: relFolder === "." ? basename(mediaRoot) : relFolder,
      folder: relFolder === "." ? basename(mediaRoot) : relFolder,
      playlist: playlistName(filePath),
      url: mediaUrl(filePath),
      cover: cover ? mediaUrl(cover) : ""
    };
  });

  return { tracks, source: mediaRoot };
}

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (url.pathname === "/library.json") {
    response.writeHead(200, {
      "Content-Type": types[".json"],
      "Cache-Control": "no-store"
    });
    response.end(JSON.stringify(scanMediaLibrary()));
    return;
  }

  if (url.pathname.startsWith("/media/")) {
    const requestedMedia = resolve(mediaRoot, decodeURIComponent(url.pathname.replace(/^\/media\//, "")));
    if (!isInside(mediaRoot, requestedMedia) || !existsSync(requestedMedia) || statSync(requestedMedia).isDirectory()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[extname(requestedMedia).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    createReadStream(requestedMedia).pipe(response);
    return;
  }

  const requested = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
  let filePath = resolve(root, requested === "/" ? "index.html" : requested);

  if (!isInside(root, filePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": types[extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, () => {
  console.log(`CrushTunes listening at http://127.0.0.1:${port}`);
});
