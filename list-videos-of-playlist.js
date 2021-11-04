const config = require('./config');
const utils = require('./utils');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

utils.init();
const outputPath = config.videoStatePath;

function existState() {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(outputPath)) {
            const inpuInterface = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            inpuInterface.question("Playlist has been listed videos. Re-list will be remove all download/convert state. Do you want to re-list? (Y/N)", ans => {
                inpuInterface.close();
                if (ans === 'Y' || ans === 'y') {
                    fs.rmSync(outputPath);
                    resolve();
                } else {
                    reject();
                }
            });
        } else {
            resolve();
        }
    })

}

async function main() {
    try{
        await existState();
    } catch(error){
        process.exit();
    }

    const api = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const baseParams = {
        part: 'snippet',
        playlistId: config.playlistId,
        key: config.access_token,
        maxResults: 50,
    }
    let nextPageToken = undefined;
    const videosItems = [];
    do {
        console.log("Get videos of page: ", nextPageToken);
        try {
            const params = {
                ...baseParams,
                pageToken: nextPageToken,
            }
            const response = await axios.get(api, { params });
            if (response.status === 200) {
                const data = response.data;
                // console.log("Res",data);
                if (data.items && data.items.length > 0) {
                    videosItems.push(...data.items);
                } else {
                    console.log("No video items")
                }
                if (data.nextPageToken) {
                    nextPageToken = data.nextPageToken;
                    continue;
                }
            }
        } catch (err) {
            console.log("Get list error", err)
        }
        nextPageToken = undefined;
    } while (nextPageToken);

    console.log(`Playlist "${config.playlistName}" has ${videosItems.length} videos`);
    const videoIds = videosItems.map(item => ({
        title: item.snippet.title,
        id: item.snippet.resourceId.videoId,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(videoIds));
    console.log("List of videos has saved to ", outputPath);
}


main();