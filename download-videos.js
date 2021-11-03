const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');

const videoItems = require('./output/videoItems.json');
const videoBasePath = './output/videos';

const startIndex = 0;
// const endIndex = videoItems.length - 1;
const endIndex = 36;
const maxThread = 30;
const videoStatus = {};
let downloadedVideos = {};

async function main() {
    try {
        downloaded = require(`${videoBasePath}/downloaded.json`);
        downloadedVideos = { ...downloaded };
    } catch (err) {
        console.log("No download files config");
    }
    for (let i = startIndex; i <= endIndex; i++) {
        videoStatus[i] = {
            status: 'waiting',
            description: '',
        }
    }
    let currentIndex = startIndex;
    let runningThread = 0;


    setInterval(async () => {
        if (downloadedVideos[currentIndex]) {
            currentIndex++;
            console.log("Skip:", currentIndex)
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

            fs.writeFileSync(`${videoBasePath}/error-${startIndex}-${endIndex}.json`, JSON.stringify(error));
            console.log(`Downloaded ${totalCount - errorCount}/${totalCount}`);
            process.exit();
        }

        if (runningThread < maxThread && currentIndex <= endIndex) {
            const index = currentIndex;
            try {
                currentIndex++;
                runningThread++;
                videoStatus[index].status = 'running';
                await downloadVideo(index);
                videoStatus[index].status = 'finished';
                runningThread--;
                downloadedVideos[index] = true;
                fs.writeFile(`${videoBasePath}/downloaded.json`, JSON.stringify(downloadedVideos), (err) => {
                    if (err) {
                        console.log("Write download file error", err);
                    }
                })
            } catch (err) {
                console.log("Error",err);
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
                console.log(`Index: ${key} - Name: ${videoItems[key].title} - Status: ${videoStatus[key].description} ${' '.repeat(10)}`)
            } else if (videoStatus[key].status === 'error') {
                lineCount++;
                console.log(`Index: ${key} - Name: ${videoItems[key].title} - Status: Error ${' '.repeat(20)}`)
            }
        })
        if(lineCount < maxThread){
            const blankLine = maxThread -lineCount + 1;
            const blank = "\n".repeat(blankLine);
            console.log(blank)
        }
        readline.moveCursor(process.stdout, 0, -maxThread);
    }, 1000);
}

function downloadVideo(index) {
    const videoItem = videoItems[index];
    return new Promise((resolve, reject) => {
        const link = 'http://www.youtube.com/watch?v=' + videoItem.id;
        const video = ytdl(link, {
            quality: 'highestaudio',
        });
        const outputPath = `./output/tmp/${videoItem.title}.mp4`;
        video.pipe(fs.createWriteStream(outputPath));

        video.on('progress', (chunkLength, downloaded, total) => {
            const percent = (downloaded / total * 100).toFixed(2);
            const toMb = byte => (byte / 1024 / 1024).toFixed(2);
            videoStatus[index].description = `${percent}% downloaded (${toMb(downloaded)}MB of ${toMb(total)}MB)`;
        });
        video.on('end', () => {
            fs.copyFile(outputPath,`${videoBasePath}/${videoItem.title}.mp4`,(err)=>{
                if(err){
                    console.log("Mv error",err);
                    return;
                }
                resolve();
            })
        });
        video.on('error', (err) => {
            fs.rmSync(outputPath);
            reject(err);
        })
    });

}

main();