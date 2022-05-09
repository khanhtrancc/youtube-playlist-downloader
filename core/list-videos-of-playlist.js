const config = require("./config");
const axios = require("axios");
const fs = require("fs");
const readline = require("readline");
const { syncStateWithDisk, getState, resetState } = require("./state");
const consoleColor = require("./console-color");

const outputPath = config.statePath;

function confirmRemoveOldState() {
  return new Promise((resolve, reject) => {
    const inpuInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    inpuInterface.question(
      "Playlist has been listed videos. Re-list will be remove all download/convert state. Do you want to re-list? (Y/N)",
      (ans) => {
        inpuInterface.close();
        if (ans === "Y" || ans === "y") {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    );
  });
}

async function listVideos() {
  syncStateWithDisk();
  const oldState = getState();

  if (oldState.indexToId.length > 0) {
    const isConfirmed = await confirmRemoveOldState();
    if (isConfirmed) {
      fs.rmSync(outputPath);
    } else {
      process.exit();
    }
  }

  const api = "https://www.googleapis.com/youtube/v3/playlistItems";
  const baseParams = {
    part: "snippet",
    playlistId: config.playlistId,
    key: config.googleApiAccessToken,
    maxResults: 50,
  };
  let nextPageToken = undefined;
  const videosItems = [];
  do {
    console.log("Get videos of page: ", nextPageToken);
    try {
      const params = {
        ...baseParams,
        pageToken: nextPageToken,
      };
      const response = await axios.get(api, { params });
      if (response.status === 200) {
        const data = response.data;
        // console.log("Res",data);
        if (data.items && data.items.length > 0) {
          videosItems.push(...data.items);
        } else {
          console.log("No video items");
        }
        if (data.nextPageToken) {
          nextPageToken = data.nextPageToken;
          continue;
        }
      }
    } catch (err) {
      console.log("Get list error", err);
    }
    nextPageToken = undefined;
  } while (nextPageToken);

  console.log(
    `Playlist "${config.playlistName}" has ${videosItems.length} videos`
  );

  const newState = resetState();
  const videoStates = {};
  videosItems.map((item, index) => {
    const videoId = item.snippet.resourceId.videoId;
    videoStates[videoId] = {
      index,
      title: item.snippet.title,
      id: videoId,
      file: {
        status: "none",
        updatedAt: Date.now(),
        retryCount: 0,
        description: "",
      },
      audio: {
        status: "none",
        updatedAt: Date.now(),
        description: "",
      },
    };
  });

  const indexToId = videosItems.map((item) => item.snippet.resourceId.videoId);
  newState.indexToId = indexToId;
  newState.indexToIdUpdateAt = Date.now();
  newState.videos = videoStates;
  syncStateWithDisk(true);

  console.log("List of videos has saved to ", outputPath);
  console.log("Please check and rename videos in ", outputPath, " if need.");
}

module.exports = {
  listVideos,
};
