# Guide

# Command
Env: 
```
PLAYLIST_ID=
PLAYLIST_NAME=
```

# How to download MP3 file of a playlist?

1. Add playlist id to and run file `list-videos-of-playlist.js`
2. Run `download-videos.js`
2. Run `convert-to-mp3.js`

# State

State of a video:
```
{
    "index": number,
    "title": string,
    "id": string,
    "file": {
        "status": "downloaded|none|downloading|error|retrying",
        "description": string,
        "retry_count": number,
        "updatedAt": timestamp,
    },
    "audio": {
        "status": "converted|none|converting|error",
        "description": string,
        "retry_count": number,
        "updatedAt": timestamp,
    }
}
```