const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const readline = require('readline');

const videoItems = require('./output/videoItems.json');
const videoBasePath = './output/videos/';
const audioBasePath = './output/mp3/';
const cacheFilePath = audioBasePath + 'converted.json';

const startIndex = 0;
// const endIndex = videoItems.length - 1;
const endIndex = 36;
const maxThread = 2;
const videoStatus = {};
let convertedFiles = {};

async function main() {
    try{
        const file = require(cacheFilePath);
        convertedFiles = file;
    }catch(err){
        console.log("No config file");
    }
    console.log("Cache", convertedFiles)

    for (let i = startIndex; i <= endIndex; i++) {
        videoStatus[i] = {
            status: 'waiting',
            description: '',
        }
    }
    let currentIndex = startIndex;
    let runningThread = 0;


    setInterval(async () => {
        if(convertedFiles[currentIndex]){
            console.log("Skip",currentIndex);
            currentIndex++;
            return;
        }

        if (currentIndex > endIndex && runningThread <= 0) {
            const error = {};
            let totalCount = 0;
            let errorCount = 0;
            Object.keys(videoStatus).forEach(key => {
                totalCount++;
                if (videoStatus[key].status === 'error') {
                    errorCount++;
                    error[key] = True;
                }
            })

            console.log(`Converted ${totalCount - errorCount}/${totalCount}`);
            process.exit();
        }

        if (runningThread < maxThread && currentIndex <= endIndex) {
            const index = currentIndex;
            try {
                currentIndex++;
                runningThread++;
                videoStatus[index].status = 'running';
                await convertToMp3(index);
                videoStatus[index].status = 'finished';
                runningThread--;
                convertedFiles[index] = true;
                fs.writeFile(cacheFilePath,JSON.stringify(convertedFiles),(err)=>{})
            } catch (err) {
                console.log("Error", err)
                runningThread--;
                videoStatus[index].status = 'error';
            }
        }
    }, 1000);

    setInterval(() => {
        if(runningThread <= 0){
            return;
        }
        let lineCount = 0;
        Object.keys(videoStatus).forEach(key => {
            if (videoStatus[key].status === 'running') {
                lineCount++;
                console.log(`Index: ${key} - Name: ${videoItems[key].title} - Status: Running`)
            }
        })
        readline.moveCursor(process.stdout, 0, -lineCount);
    }, 1000);
}

function convertToMp3(i) {
    return new Promise((resolve, reject) => {
        try {
            const command = ffmpeg(videoBasePath + videoItems[i].title + '.mp4');
            command.audioBitrate(128)
                .save(`${audioBasePath}${i}-${videoItems[i].title}.mp3`)
                .on('end', () => {
                    resolve();
                })
                .on('error',(err)=>{
                    reject(err);
                });
        } catch (err) {
            reject(err);
        }
    });
}

main();