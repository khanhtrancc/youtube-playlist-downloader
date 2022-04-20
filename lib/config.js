require("dotenv").config();
const path = require("path");

const playlistId = process.env.PLAYLIST_ID;
const playlistName = process.env.PLAYLIST_NAME || "No Name";
const playlistShortName = playlistName
  .trim()
  .split(" ")
  .map((item) => item[0].toUpperCase())
  .reduce((pre, cur) => pre + cur);
const baseOutputPath = path.join(
  process.cwd(),
  `./output/${playlistShortName}-${process.env.PLAYLIST_ID.slice(-4)}`
);

module.exports = {
  googleApiAccessToken: "AIzaSyDfWXSSAVdoV7wLhWRki3eUV7uBwhwv2tY", //access token to list videos of playlist
  baseOutputPath,
  videoPath: `${baseOutputPath}/videos`,
  tmpPath: `${baseOutputPath}/tmp`,
  audioPath: `${baseOutputPath}/audio`,
  statePath: `${baseOutputPath}/state.json`,
  readableAudioPath: `${baseOutputPath}/final-audio`,
  playlistId,
  playlistName,
  playlistShortName,
};
