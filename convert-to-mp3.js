const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");
const { ArgumentParser } = require("argparse");

const config = require("./config");
const utils = require("./utils");

utils.init();

let videoState;

let startIndex = 0;
let endIndex = 0;
let maxThread = 10;
let currentIndex = startIndex;

let totalVideoCount;
let existVideoCount = 0;
let convertVideoCount = 0;
let errorVideoCount = 0;

let runningThread = 0;

function loadVideoState() {
  return require(config.videoStatePath);
}

function getArgs() {
  const parser = new ArgumentParser({
    description: "Convert video to mp3",
  });

  parser.add_argument("-s", "--startIndex", {
    help: "Start index based on videos.json",
    type: "int",
  });
  parser.add_argument("-e", "--endIndex", {
    help: "End index based on videos.json",
    type: "int",
  });
  parser.add_argument("-t", "--maxThread", {
    help: "Max thread. Should from 1 to 16",
    type: "int",
  });

  args = parser.parse_args();
  return args;
}

async function main() {
  const args = getArgs();
  if (args.startIndex) {
    startIndex = args.startIndex;
  }
  currentIndex = startIndex;

  if (args.maxThread) {
    maxThread = args.maxThread;
  }
  if (args.endIndex) {
    endIndex = args.endIndex;
  }
  try {
    videoState = loadVideoState();
    if (endIndex <= 0) {
      endIndex = videoState.length - 1;
    }
    totalVideoCount = endIndex - startIndex + 1;
  } catch (err) {
    console.log(
      "Video state not found. Please run command `list-videos-of-playlist`"
    );
    process.exit();
  }

  let shortName = "";
  process.env.PLAYLIST_NAME.split(" ").map((item) => {
    shortName += (item[0] || '').toUpperCase();
  });

  setInterval(async () => {
    if (currentIndex > endIndex) {
      // All convert finish?
      if (runningThread <= 0) {
        process.exit();
      }
      // Wait other convert finish
      return;
    }

    // Current video has NOT been downloaded
    if (!videoState[currentIndex].isDownloaded) {
      currentIndex++;
      errorVideoCount++;
      return;
    }

    // Current video has been convert
    if (videoState[currentIndex].isConverted) {
      currentIndex++;
      existVideoCount++;
      return;
    }

    if (runningThread < maxThread) {
      const index = currentIndex;
      currentIndex++;
      runningThread++;
      try {
        videoState[index].status = "converting";
        videoState[index].description = "Start convert to mp3";
        await convertToMp3(index, shortName);
        videoState[index].status = "converted";
        videoState[index].isConverted = true;
        convertVideoCount++;
      } catch (err) {
        console.log(err);
        errorVideoCount++;
        videoState[index].status = "error";
        videoState[index].description = "Error: " + err;
      }
      runningThread--;
      fs.writeFile(config.videoStatePath, JSON.stringify(videoState), (err) => {
        if (err) {
          console.log("Write download file error", err);
        }
      });
    }
  }, 100);

  renderStatus(false);

  setInterval(() => {
    renderStatus();
  }, 1000);
}

function convertToMp3(i, shortName) {
  return new Promise((resolve, reject) => {
    try {
      const command = ffmpeg(`${config.videoPath}/${i}.mp4`);
      command
        .audioFilters(`atempo=1.0`)
        .audioBitrate(128)
        .save(
          `${config.audioPath}/${shortName}-${`000${i}`.slice(-3)}-${
            videoState[i].title
          }.mp3`
        )
        .on("progress", function (progress) {
          videoState[i].description = progress?.timemark || "Converting";
        })
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        });
    } catch (err) {
      reject(err);
    }
  });
}

function renderStatus(clearOutStatus = true) {
  const maxLineCount = maxThread + 2;
  if (clearOutStatus) {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }

  console.log(
    `Current: ${currentIndex} - Start: ${startIndex} - End: ${endIndex} - Thread: ${runningThread}/${maxThread}`
  );
  console.log(
    `Total: ${totalVideoCount} - Convert: ${convertVideoCount} - Error: ${errorVideoCount} - Exist: ${existVideoCount}`
  );

  let lineCount = 0;
  Object.keys(videoState).forEach((key) => {
    if (videoState[key].status === "converting") {
      lineCount++;
      console.log(
        `Index: ${key} - Name: ${videoState[key].title} - Status: ${videoState[key].description}`
      );
    }
  });
  if (lineCount < maxThread - 1) {
    const blankLine = maxThread - lineCount - 1;
    const blank = " \n".repeat(blankLine);
    console.log(blank);
  }
}

main();
