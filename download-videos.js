const fs = require("fs");
const ytdl = require("ytdl-core");
const readline = require("readline");
const { ArgumentParser } = require("argparse");

const config = require("./config");
const utils = require("./utils");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

utils.init();

let videoState;

let startIndex = 0;
let endIndex = 0;
let maxThread = 3;

let totalVideoCount;
let existVideoCount = 0;
let downloadVideoCount = 0;
let errorVideoIndexList = [];

let currentIndex;
let runningThread = 0;
let preventDownloadNewVideo = false;
let lastCommand = "None";

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

function loadVideoState() {
  return require(config.videoStatePath);
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
  videoState.forEach((item) => {
    if (item.status === "downloading") {
      delete item.status;
    }
    delete item.description;
  });

  setInterval(async () => {
    if (preventDownloadNewVideo) {
      return;
    }
    const downloadAndUpdateVideoState = async (index) => {
      runningThread++;
      try {
        videoState[index].status = "downloading";
        await downloadVideo(index);
        videoState[index].status = "downloaded";
        videoState[index].isDownloaded = true;
        downloadVideoCount++;
      } catch (err) {
        errorVideoIndexList.push(index);
        errorVideoIndexList = errorVideoIndexList.sort((a, b) => a - b);
        videoState[index].status = "error";
        videoState[index].description = "Error: " + err;
      }
      runningThread--;
      fs.writeFile(config.videoStatePath, JSON.stringify(videoState), (err) => {
        if (err) {
          console.log("Write download file error", err);
        }
      });
    };

    if (errorVideoIndexList.length > 0) {
      if (runningThread < maxThread) {
        const index = errorVideoIndexList.shift();
        await downloadAndUpdateVideoState(index);
      }
      return;
    }

    if (currentIndex > endIndex) {
      // All download finish?
      if (runningThread <= 0) {
        process.exit();
      }
      // Wait other download finish
      return;
    }

    // Current video has been downloaded
    if (videoState[currentIndex].isDownloaded) {
      currentIndex++;
      existVideoCount++;
      return;
    }

    if (runningThread < maxThread) {
      index = currentIndex;
      currentIndex++;
      await downloadAndUpdateVideoState(index);
    }
  }, 100);

  renderStatus(false);

  setInterval(() => {
    renderStatus();
  }, 1000);

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

function downloadVideo(index) {
  const videoItem = videoState[index];
  return new Promise((resolve, reject) => {
    const link = "http://www.youtube.com/watch?v=" + videoItem.id;
    const video = ytdl(link, {
      quality: "highestaudio",
    });
    const tmpOutputPath = `${config.tmpPath}/${index}.mp4`;
    video.pipe(fs.createWriteStream(tmpOutputPath));

    video.on("progress", (chunkLength, downloaded, total) => {
      const percent = ((downloaded / total) * 100).toFixed(2);
      const toMb = (byte) => (byte / 1024 / 1024).toFixed(2);
      videoState[index].description = `${percent}% downloaded (${toMb(
        downloaded
      )}MB of ${toMb(total)}MB)`;
    });
    video.on("end", () => {
      fs.copyFile(tmpOutputPath, `${config.videoPath}/${index}.mp4`, (err) => {
        if (err) {
          fs.rmSync(tmpOutputPath);
          reject(err);
          return;
        }
        resolve();
      });
    });
    video.on("error", (err) => {
      fs.rmSync(tmpOutputPath);
      reject(err);
    });
  });
}

function renderStatus(clearOutStatus = true) {
  if (clearOutStatus) {
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
  }

  console.log(
    utils.consoleColor.FgCyan,
    `Current: ${currentIndex} - Start: ${startIndex} - End: ${endIndex} - Thread: ${runningThread}/${maxThread}`
  );
  console.log(
    `Total: ${totalVideoCount} - Download: ${downloadVideoCount} - Exist: ${existVideoCount} - Error: ${JSON.stringify(
      errorVideoIndexList
    )} `
  );
  console.log("Download new videos: ", !preventDownloadNewVideo);
  console.log(utils.consoleColor.Reset);

  let lineCount = 0;
  Object.keys(videoState).forEach((key) => {
    if (videoState[key].status === "downloading") {
      lineCount++;
      console.log(
        `Index: ${key} - Name: ${videoState[key].title} - Status: ${videoState[key].description}`
      );
    }
  });

  console.log(
    utils.consoleColor.FgCyan,
    `\nCommand:
  - x: Stop downloading new videos
  - n: Resume downloading new videos
  - c: Force exit
  
  => Last command: ${lastCommand}
  `
  );
}

main();
