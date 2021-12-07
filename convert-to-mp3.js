const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');

const config = require('./config');
const utils = require('./utils');

utils.init();

let videoState;

const startIndex = 0;
let endIndex = 0;
const maxThread = 5;
let totalVideoCount;
let existVideoCount = 0;
let convertVideoCount = 0;
let errorVideoCount = 0;

let currentIndex = startIndex;
let runningThread = 0;

function loadVideoState() {
    return require(config.videoStatePath);
}

async function main() {
    try {
        videoState = loadVideoState();
        endIndex = videoState.length - 1;
        totalVideoCount = endIndex - startIndex + 1;
    } catch (err) {
        console.log("Video state not found. Please run command `list-videos-of-playlist`");
        process.exit();
    }

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
                videoState[index].status = 'converting';
                await convertToMp3(index);
                videoState[index].status = 'converted';
                videoState[index].isConverted = true;
                convertVideoCount++;
            } catch (err) {
                console.log(err)
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


function convertToMp3(i) {
    return new Promise((resolve, reject) => {
        try {
            const command = ffmpeg(`${config.videoPath}/${videoState[i].title}.mp4`);
            command.audioBitrate(128)
                .save(`${config.audioPath}/${i}-${videoState[i].title}.mp3`)
                .on('end', () => {
                    resolve();
                })
                .on('error', (err) => {
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
        readline.moveCursor(process.stdout, 0, -maxLineCount);
        readline.clearScreenDown(process.stdout);
    }

    console.log(`Current: ${currentIndex} - Start: ${startIndex} - End: ${endIndex} - Thread: ${runningThread}/${maxThread}`);
    console.log(`Total: ${totalVideoCount} - Convert: ${convertVideoCount} - Error: ${errorVideoCount} - Exist: ${existVideoCount}`);

    let lineCount = 0;
    Object.keys(videoState).forEach(key => {
        if (videoState[key].status === 'converting') {
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