const fs = require("fs");
const config = require("./config");

function init() {
  //create output folders
  [
    config.baseOutputPath,
    config.audioPath,
    config.videoPath,
    config.tmpPath,
  ].forEach((path) => {
    if (!fs.existsSync(path)) {
      console.log("Create folder for playlist:", config.playlistName, path);
      fs.mkdirSync(path, { recursive: true });
    }
  });
}

module.exports = {
  init,
};
