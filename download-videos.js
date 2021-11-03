const fs = require('fs');
const ytdl = require('ytdl-core');
const readline = require('readline');

const videoItems = require('./output/videoItems.json');
const videoBasePath = './output/videos';

const startIndex = 5;
const endIndex = videoItems.length - 1;
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

        if (runningThread < maxThread) {
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
        let lineCount = 0;
        Object.keys(videoStatus).forEach(key => {
            if (videoStatus[key].status === 'running') {
                lineCount++;
                console.log(`Index: ${key} - Name: ${videoItems[key].title} - Status: ${videoStatus[key].description}`)
            }
        })
        readline.moveCursor(process.stdout, 0, -lineCount);
    }, 1000);
}

function downloadVideo(index) {
    const videoItem = videoItems[index];
    return new Promise((resolve, reject) => {
        const link = 'http://www.youtube.com/watch?v=' + videoItem.id;
        const video = ytdl(link, {
            quality: 'highestaudio',
        });
        const outputPath = `./output/videos/${videoItem.title}.mp4`;
        video.pipe(fs.createWriteStream(outputPath));

        video.on('progress', (chunkLength, downloaded, total) => {
            const percent = (downloaded / total * 100).toFixed(2);
            const toMb = byte => (byte / 1024 / 1024).toFixed(2);
            videoStatus[index].description = `${percent}% downloaded (${toMb(downloaded)}MB of ${toMb(total)}MB)`;
        });
        video.on('end', () => {
            videoStatus[index].status = 'finished';
        });
        video.on('error', (err) => {
            console.log("Download error", err)
            fs.rmSync(outputPath);
            videoStatus[index].status = 'error';
        })
    });

}

main();