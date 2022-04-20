const fs = require("fs");
const config = require("./config");
const consoleColor = require("./console-color");

let currentState = { indexToId: [], indexToIdUpdateAt: 0, videos: {} };

function resetState() {
  currentState = { indexToId: [], indexToIdUpdateAt: 0, videos: {} };
  return currentState;
}

function getState() {
  return currentState;
}

function syncStateWithDisk(showLog = false) {
  try {
    const fileState = require(config.statePath);

    const fileStateVideos = fileState.videos;
    const currentStateVideos = currentState.videos;
    // sync each video state
    Object.keys(fileStateVideos).forEach((videoId) => {
      if (!fileStateVideos[videoId]) {
        return;
      }

      if (!currentStateVideos[videoId]) {
        currentStateVideos[videoId] = fileStateVideos[videoId];
        return;
      }

      if (
        fileStateVideos[videoId].file.updateAt >
        currentStateVideos[videoId].file.updateAt
      ) {
        currentStateVideos[videoId].file = fileStateVideos[videoId].file;
      }

      if (
        fileStateVideos[videoId].audio.updateAt >
        currentStateVideos[videoId].audio.updateAt
      ) {
        currentStateVideos[videoId].audio = fileStateVideos[videoId].audio;
      }
    });

    // sync indexToId
    if (fileState.indexToIdUpdateAt > currentState.indexToIdUpdateAt) {
      currentState.indexToId = fileState.indexToId;
      currentState.indexToIdUpdateAt = fileState.indexToIdUpdateAt;
    }
    if (showLog) {
      console.log(
        consoleColor.FgGreen,
        "Sync state successfully!",
        consoleColor.Reset
      );
    }
  } catch (err) {
    console.log(consoleColor.FgYellow, "No state in disk!", consoleColor.Reset);
  }
  fs.writeFileSync(config.statePath, JSON.stringify(currentState));

  return currentState;
}

function getTotalVideo() {
  return currentState.indexToId.length;
}

function resetDownloadingState() {
  Object.keys(currentState.videos).forEach((id) => {
    const item = currentState.videos[id];
    if (
      item.file.status === "downloading" ||
      item.file.status === "error" ||
      item.file.status === "retrying"
    ) {
      item.file.status = "none";
    }
  });
}

module.exports = {
  getState,
  syncStateWithDisk,
  getTotalVideo,
  resetState,
  resetDownloadingState,
};
