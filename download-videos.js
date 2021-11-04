const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');

const config = require('./config');
const utils = require('./utils');

utils.init();

let videoState;

const startIndex = 0;
let endIndex = 0;
const maxThread = 30;
let totalVideoCount;
let existVideoCount = 0;
let downloadVideoCount = 0;
let errorVideoCount = 0;

let currentIndex = startIndex;
let runningThread = 0;

function loadVideoState() {
    return require(config.videoStatePath);
}

async function main() {
    try {
        videoState = loadVideoState();
        endIndex = videoState.length;
        totalVideoCount = endIndex - startIndex + 1;
    } catch (err) {
        console.log("Video state not found. Please run command `list-videos-of-playlist`");
        process.exit();
    }

    setInterval(async () => {
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
            const index = currentIndex;
            currentIndex++;
            runningThread++;
            try {
                videoState[index].status = 'downloading';
                await downloadVideo(index);
                videoState[index].status = 'downloaded';
                videoState[index].isDownloaded = true;
                downloadVideoCount++;
            } catch (err) {
                errorVideoCount++;
                videoState[index].status = 'error';
                videoState[index].description = 'Error: ' + err;
            }
            runningThread--;
            fs.writeFile(config.videoStatePath, JSON.stringify(videoState), (err) => {
                if (err) {
                    console.log("Write download file error", err);
                }
            })

        }
    }, 1000);

    renderStatus(false);

    setInterval(() => {
        renderStatus();
    }, 1000);
}

function downloadVideo(index) {
    const videoItem = videoState[index];
    return new Promise((resolve, reject) => {
        const link = 'http://www.youtube.com/watch?v=' + videoItem.id;
        const video = ytdl(link, {
            quality: 'highestaudio',
        });
        const tmpOutputPath = `${config.tmpPath}/${videoItem.title}.mp4`;
        video.pipe(fs.createWriteStream(tmpOutputPath));

        video.on('progress', (chunkLength, downloaded, total) => {
            const percent = (downloaded / total * 100).toFixed(2);
            const toMb = byte => (byte / 1024 / 1024).toFixed(2);
            videoState[index].description = `${percent}% downloaded (${toMb(downloaded)}MB of ${toMb(total)}MB)`;
        });
        video.on('end', () => {
            fs.copyFile(tmpOutputPath, `${config.videoPath}/${videoItem.title}.mp4`, (err) => {
                if (err) {
                    fs.rmSync(tmpOutputPath);
                    reject(err);
                    return;
                }
                resolve();
            })
        });
        video.on('error', (err) => {
            fs.rmSync(tmpOutputPath);
            reject(err);
        })
    });

}

function renderStatus(clearOutStatus = true) {
    const maxLineCount = maxThread + 2;
    if (clearOutStatus) {
        readline.moveCursor(process.stdout, 0, -maxLineCount);
        readline.clearScreenDown(process.stdout);
    }

    console.log(`Current: ${startIndex} - Start: ${currentIndex} - End: ${endIndex} - Thread: ${runningThread}/${maxThread}`);
    console.log(`Total: ${totalVideoCount} - Download: ${downloadVideoCount} - Error: ${errorVideoCount} - Exist: ${existVideoCount}`);

    let lineCount = 0;
    Object.keys(videoState).forEach(key => {
        if (videoState[key].status === 'downloading') {
            lineCount++;
            console.log(`Index: ${key} - Name: ${videoState[key].title} - Status: ${videoState[key].description}`)
        }
    })
    if (lineCount < maxThread - 1) {
        const blankLine = maxThread - lineCount - 1;
        const blank = " \n".repeat(blankLine);
        console.log(blank)
    }

}

main();