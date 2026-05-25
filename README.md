# CrushTunes

A dependency-free local music player with a premium dark CrushTunes interface.

## Run locally

From this folder:

```powershell
node server.mjs
```

Open `http://localhost:8080`. CrushTunes scans the local `music` folder next to the app, or the folder provided through `MUSIC_DIR`. It organizes audio files by folder and supports login, remembered uploads, remembered folders, search, smooth folder switching, progress seeking, previous/next, dynamic shuffle, and album art.

## GitHub Pages hosting

Upload these files to a GitHub repository:

- `index.html`
- `styles.css`
- `app.js`
- `manifest.webmanifest`

Then enable GitHub Pages for the repository.

The login system is local-only. It stores the signed-in username, remembered folder handles, and imported audio files in the browser. Your music files are not uploaded to GitHub. On GitHub Pages, use **Import folder files** once after logging in; the browser keeps those files for that user on that device using IndexedDB browser storage.

For a hosted library with no folder picker, include a generated `library.json` and host the audio files in the repo or another public URL.

## Album art

The player reads embedded MP3 ID3 cover art when available. It also uses `cover.jpg`, `cover.png`, `folder.jpg`, `folder.png`, `album.jpg`, or `front.jpg` placed inside an album folder.

## Raspberry Pi / ESP32 hosting

The simplest setup is to serve these static files from the device and let the browser choose the folder.

For a device that should expose its own SD-card library over HTTP, serve a `library.json` file next to `index.html`:

```json
{
  "tracks": [
    {
      "title": "Song title",
      "artist": "Artist",
      "album": "Album",
      "folder": "Album folder",
      "url": "music/album/song.mp3",
      "cover": "music/album/cover.jpg"
    }
  ]
}
```

On an ESP32, firmware can scan the SD card and generate that JSON, while serving each audio file by URL.
