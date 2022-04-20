const { ArgumentParser } = require("argparse");

const config = require("./lib/config");
const { convertVideosInRange } = require("./lib/convert-videos");
const { downloadVideosInRange } = require("./lib/download-videos");
const { listVideos } = require("./lib/list-videos-of-playlist");
const { renameInRange } = require("./lib/rename");
const {
  getState,
  syncStateWithDisk,
  resetDownloadingState,
  resetConvertingState,
} = require("./lib/state");
const { syncStateWithFile } = require("./lib/sync-file");
const utils = require("./lib/utils");

function parseArgs() {
  const parser = new ArgumentParser({
    description: "Youtube Download Bot",
  });

  const commandParser = parser.add_subparsers({
    dest: "command",
  });
  commandParser.add_parser("list", { help: "List videos of playlist" });
  commandParser.add_parser("sync", { help: "Sync state" });
  commandParser.add_parser("rename", { help: "Rename to readable audio" });

  const downloadParser = commandParser.add_parser("download", {
    help: "Download videos of playlist",
  });
  const convertParser = commandParser.add_parser("convert", {
    help: "Convert videos to audio",
  });

  [downloadParser, convertParser].forEach((parser) => {
    parser.add_argument("-s", "--startIndex", {
      help: "Start index based on state.json",
      type: "int",
    });
    parser.add_argument("-e", "--endIndex", {
      help: "End index based on state.json",
      type: "int",
    });
    parser.add_argument("-t", "--maxThread", {
      help: "Max thread. Should from 1 to 16",
      type: "int",
    });

    parser.add_argument("--reset", {
      action: "store_true",
      help: "Reset downloading",
    });
  });

  args = parser.parse_args();
  return args;
}

function main() {
  utils.init();
  const args = parseArgs();

  if (args.command === "list") {
    listVideos();
  } else if (args.command === "sync") {
    syncStateWithFile();
  } else if(args.command === 'rename'){
    renameInRange();
  } else if (args.command === "download") {
    syncStateWithDisk(true);

    const state = getState();
    const startIndex = args.startIndex || 0;
    const endIndex = args.endIndex || state.indexToId.length - 1;
    const maxThread = args.maxThread || 5;

    if (args.reset) {
      resetDownloadingState();
      syncStateWithDisk();
    }
    downloadVideosInRange(startIndex, endIndex, maxThread);
  } else if (args.command === "convert") {
    syncStateWithDisk(true);

    const state = getState();
    const startIndex = args.startIndex || 0;
    const endIndex = args.endIndex || state.indexToId.length - 1;
    const maxThread = args.maxThread || 5;

    if (args.reset) {
      resetConvertingState();
      syncStateWithDisk();
    }
    convertVideosInRange(startIndex, endIndex, maxThread);
  }
}

main();
