const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");

const config = require("./config");
const utils = require("./utils");
const { getState, syncStateWithDisk, getTotalVideo } = require("./state");
const consoleColor = require("./console-color");

const maxRetryCount = 10;
const timeBetweenRetry = 5000;

let startIndex = 0;
let endIndex = 0;
let maxThread = 3;

let runningThread = 0;
let preventDownloadNewVideo = false;
let lastCommand = "None";

async function downloadVideosInRange(start, end, thread) {
  startIndex = start;
  endIndex = end;
  maxThread = thread;
  totalVideoCount = endIndex - startIndex + 1;

  startDownloadVideoInterval();

  startRenderStatusInterval();

  handleRealtimeCommand();
}

function handleRealtimeCommand() {
  const stdin = process.stdin;

  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();

  stdin.on("data", (key) => {
    lastCommand = key;
    if (key === "c") {
      process.exit();
    } else if (key === "x") {
      preventDownloadNewVideo = true;
    } else if (key === "n") {
      preventDownloadNewVideo = false;
    }
  });
}

function startDownloadVideoInterval() {
  setInterval(async () => {
    if (preventDownloadNewVideo) {
      return;
    }

    if (runningThread === maxThread) {
      return;
    }

    const state = getState();
    let retryVideoCount = 0;
    let retryIndex = -1;
    let downloadIndex = -1;

    for (let idx = endIndex; idx >= startIndex; idx--) {
      const id = state.indexToId[idx];
      const videoState = state.videos[id];

      // count need retry video and find index of video can retry
      if (
        videoState.file.status === "error" &&
        videoState.file.retryCount < maxRetryCount
      ) {
        retryVideoCount++;

        if (videoState.file.updatedAt + timeBetweenRetry < Date.now()) {
          retryIndex = idx;
        }
      }

      if (videoState.file.status === "none") {
        downloadIndex = idx;
      }
    }

    if (retryIndex < 0 && downloadIndex < 0) {
      // All download finish?
      if (runningThread <= 0) {
        process.exit();
      }
      // Wait other download finish
      return;
    }

    if (retryIndex > 0) {
      runningThread++;
      await downloadVideo(retryIndex, true);
      runningThread--;
    } else if (runningThread + retryVideoCount < maxThread) {
      runningThread++;
      await downloadVideo(downloadIndex, false);
      runningThread--;
    }
  }, 100);
}

function downloadVideo(index, isRetry = false) {
  return new Promise((resolve, reject) => {
    const state = getState();
    const videoId = state.indexToId[index];
    const videoState = state.videos[videoId];

    // update video state
    videoState.file.status = isRetry ? "retrying" : "downloading";
    videoState.file.updatedAt = Date.now();
    syncStateWithDisk();

    const link = "http://www.youtube.com/watch?v=" + videoId;
    const video = ytdl(link, {
      quality: "highestaudio",
    });
    const tmpOutputPath = `${config.tmpPath}/${index}.mp4`;
    video.pipe(fs.createWriteStream(tmpOutputPath));

    video.on("progress", (chunkLength, downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      const toMb = (byte) => (byte / 1024 / 1024).toFixed(2);

      videoState.file.description = `${percent}% downloaded (${toMb(
        downloaded
      )}MB of ${toMb(total)}MB)`;
      videoState.file.updatedAt = Date.now();
    });

    video.on("end", () => {
      fs.copyFile(tmpOutputPath, `${config.videoPath}/${index}.mp4`, (err) => {
        try {
          fs.rmSync(tmpOutputPath);
        } catch (err) {}
        if (err) {
          videoState.file.status = "error";
          videoState.file.retryCount++;
          syncStateWithDisk();
          resolve();
          return;
        }
        videoState.file.status = "downloaded";
        syncStateWithDisk(true);
        resolve();
      });
    });

    video.on("error", (err) => {
      if (fs.existsSync(tmpOutputPath)) {
        try {
          fs.rmSync(tmpOutputPath);
        } catch (err) {}
      }
      videoState.file.status = "error";
      videoState.file.retryCount++;
      syncStateWithDisk();
      resolve();
    });
  });
}

function startRenderStatusInterval() {
  renderStatus(false);

  setInterval(() => {
    renderStatus();
  }, 1000);
}

function renderStatus(clearScreen = true) {
  if (clearScreen) {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }

  let totalVideo = endIndex - startIndex + 1;
  let downloadVideoCount = 0;
  let errorVideoCount = 0;
  const state = getState();
  for (let i = startIndex; i <= endIndex; i++) {
    const id = state.indexToId[i];
    const file = state.videos[id].file;
    if (file.status === "downloaded") {
      downloadVideoCount++;
    } else if (file.status === "error") {
      errorVideoCount++;
    }
  }

  console.log(
    consoleColor.FgCyan,
    `Start: ${startIndex} - End: ${endIndex} - Thread: ${runningThread}/${maxThread}`
  );
  console.log(
    `Total: ${totalVideo} - Downloaded: ${downloadVideoCount} - Error: ${errorVideoCount} `
  );

  // show downloading videos
  console.log(consoleColor.Reset);
  for (let i = startIndex; i <= endIndex; i++) {
    const id = state.indexToId[i];
    const video = state.videos[id];
    const file = video.file;

    if (file.status === "downloading" || file.status === "retrying") {
      console.log(
        `Index: ${i} - Name: ${video.title} - Status: ${file.description}`
      );
    }
  }

  // show need retry videos
  console.log(consoleColor.FgYellow, "\n");
  let isShowRetry = false;

  for (let i = startIndex; i <= endIndex; i++) {
    const id = state.indexToId[i];
    const video = state.videos[id];
    const file = video.file;

    if (
      (file.status === "error" || file.status === "retrying") &&
      file.retryCount < maxRetryCount
    ) {
      console.log(
        `Retry: ${i} - Name: ${video.title} - Retry in: ${
          file.status === "error"
            ? `${(timeBetweenRetry - (Date.now() - file.updatedAt)) / 1000}s`
            : "now"
        } - Count: ${file.retryCount}/${maxRetryCount}`
      );
      isShowRetry = true;
    }
  }

  // show error videos
  if (isShowRetry) {
    console.log("\n");
  }
  for (let i = startIndex; i <= endIndex; i++) {
    const id = state.indexToId[i];
    const video = state.videos[id];
    const file = video.file;
    if (file.status === "error" && file.retryCount >= maxRetryCount) {
      console.log(
        `Error: ${i} - Name: ${video.title} - Message: ${file.description}`
      );
    }
  }

  console.log(
    consoleColor.FgCyan,
    `\nCommand:
  - x: Stop downloading new videos
  - n: Resume downloading new videos
  - c: Force exit
  
  => Last command: ${lastCommand}
  `
  );
  console.log(consoleColor.Reset);
}

module.exports = {
  downloadVideosInRange,
};
