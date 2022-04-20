const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");

const config = require("./config");
const utils = require("./utils");
const { getState, syncStateWithDisk, getTotalVideo } = require("./state");
const consoleColor = require("./console-color");

function syncStateWithFile() {
  syncStateWithDisk();
  const state = getState();
  let foundFile = [];
  for (let i = 0; i < state.indexToId.length; i++) {
    const videoPath = `${config.videoPath}/${i}.mp4`;
    if (fs.existsSync(videoPath)) {
      const id = state.indexToId[i];
      const file = state.videos[id].file;
      file.status = "downloaded";
      file.updatedAt = Date.now();
      file.description = "Check from file.";
      foundFile.push(i);
    }
  }

  syncStateWithDisk();
  console.log(consoleColor.FgGreen, `Found ${foundFile.length} files`);
  console.log(foundFile);
}

module.exports = {
  syncStateWithFile,
};
