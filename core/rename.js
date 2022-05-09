const fs = require("fs");

const config = require("./config");
const { getState, syncStateWithDisk, getTotalVideo } = require("./state");

async function renameInRange() {
  syncStateWithDisk();
  const state = getState();
  for (let i = 0; i < state.indexToId.length; i++) {
    const id = state.indexToId[i];
    if (state.videos[id].audio.status !== "converted") {
      continue;
    }
    try {
      await rename(i);
    } catch (err) {
      console.log("Rename error", err);
    }
  }
}

function rename(index) {
  return new Promise((resolve, reject) => {
    const state = getState();
    const videoId = state.indexToId[index];
    const videoState = state.videos[videoId];

    try {
      const oldPath = `${config.audioPath}/${index}.mp3`;
      const newPath = `${config.readableAudioPath}/${
        config.playlistShortName
      }-${`00${index}`.slice(-3)}-${videoState.title}.mp3`;
      fs.copyFile(oldPath, newPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  renameInRange,
};
