const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");

const config = require("./config");
const utils = require("./utils");
const { getState, syncStateWithDisk, getTotalVideo } = require("./state");
const consoleColor = require("./console-color");
const ffmpeg = require("fluent-ffmpeg");

const maxRetryCount = 2;
const timeBetweenRetry = 5000;

let startIndex = 0;
let endIndex = 0;
let maxThread = 3;

let runningThread = 0;
let lastCommand = "";
let currentCommand = "";

async function convertVideosInRange(start, end, thread) {
  startIndex = start;
  endIndex = end;
  maxThread = thread;
  totalVideoCount = endIndex - startIndex + 1;

  startConvertVideoInterval();

  startRenderStatusInterval();

  handleRealtimeCommand();
}

function handleRealtimeCommand() {
  const stdin = process.stdin;

  stdin.setRawMode(true);
  stdin.setEncoding("utf8");
  stdin.resume();

  stdin.on("data", (key) => {
    if (Buffer.from(key)[0] == 13) {
      lastCommand = currentCommand;

      // Enter
      if (currentCommand === "exit") {
        process.exit();
      }
      currentCommand = "";
      return;
    }

    currentCommand += key;
  });
}

function startConvertVideoInterval() {
  setInterval(async () => {
    if (runningThread === maxThread) {
      return;
    }

    const state = getState();
    let retryVideoCount = 0;
    let retryIndex = -1;
    let convertIndex = -1;

    for (let idx = endIndex; idx >= startIndex; idx--) {
      const id = state.indexToId[idx];
      const videoState = state.videos[id];

      // count need retry video and find index of video can retry
      if (
        videoState.audio.status === "error" &&
        videoState.audio.retryCount < maxRetryCount
      ) {
        retryVideoCount++;

        if (videoState.audio.updatedAt + timeBetweenRetry < Date.now()) {
          retryIndex = idx;
        }
      }

      if (
        videoState.audio.status === "none" &&
        videoState.file.status === "downloaded"
      ) {
        convertIndex = idx;
      }
    }

    if (retryIndex < 0 && convertIndex < 0) {
      // All convert finish?
      if (runningThread <= 0) {
        process.exit();
      }
      // Wait other convert finish
      return;
    }

    if (retryIndex > 0) {
      runningThread++;
      await convertToMp3(retryIndex);
      runningThread--;
    } else if (runningThread + retryVideoCount < maxThread) {
      runningThread++;
      await convertToMp3(convertIndex);
      runningThread--;
    }
  }, 1000);
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
  let handledVideoCount = 0;
  let errorVideoCount = 0;
  const state = getState();
  for (let i = startIndex; i <= endIndex; i++) {
    const id = state.indexToId[i];
    const file = state.videos[id].audio;
    if (file.status === "converted") {
      handledVideoCount++;
    } else if (file.status === "error") {
      errorVideoCount++;
    }
  }

  console.log(
    consoleColor.FgCyan,
    `Start: ${startIndex} - End: ${endIndex} - Thread: ${runningThread}/${maxThread}`
  );
  console.log(
    `Total: ${totalVideo} - Converted: ${handledVideoCount} - Error: ${errorVideoCount} `
  );

  // show converting videos
  console.log(consoleColor.Reset);
  for (let i = startIndex; i <= endIndex; i++) {
    const id = state.indexToId[i];
    const video = state.videos[id];
    const file = video.audio;

    if (file.status === "converting" || file.status === "retrying") {
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
    const file = video.audio;

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
    const file = video.audio;
    if (file.status === "error" && file.retryCount >= maxRetryCount) {
      console.log(
        `Error: ${i} - Name: ${video.title} - Message: ${file.description}`
      );
    }
  }

  console.log(
    consoleColor.FgCyan,
    `\nCommand:
  - x: Stop converting new videos
  - n: Resume converting new videos
  - c: Force exit
  
  => Last command: ${lastCommand}
  => Current command: ${currentCommand}
  `
  );
  console.log(consoleColor.Reset);
}

function convertToMp3(index) {
  return new Promise((resolve, reject) => {
    const state = getState();
    const videoId = state.indexToId[index];
    const videoState = state.videos[videoId];

    // update video state
    videoState.audio.status = "converting";
    videoState.audio.updatedAt = Date.now();
    syncStateWithDisk();
    try {
      const command = ffmpeg(`${config.videoPath}/${index}.mp4`);
      command
        .audioFilters(`atempo=1.0`)
        .audioBitrate(128)
        .save(`${config.audioPath}/${index}.mp3`)
        .on("progress", function (progress) {
          videoState.audio.description = progress?.timemark || "Converting";
          videoState.audio.updatedAt = Date.now();
        })
        .on("end", () => {
          videoState.audio.status = "converted";
          syncStateWithDisk(true);
          resolve();
        })
        .on("error", (err) => {
          videoState.audio.status = "error";
          syncStateWithDisk(true);
          reject(err);
        });
    } catch (err) {
      videoState.audio.status = "error";
      syncStateWithDisk(true);
      reject(err);
    }
  });
}
module.exports = {
  convertVideosInRange,
};
