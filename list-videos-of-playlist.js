const config = require('./config');
const axios = require('axios');
const fs = require('fs');

async function main() {
    const api = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const baseParams = {
        part: 'snippet',
        playlistId: 'PL8Y18iK7OS8QRgHlOpoSy_ZrMjW8c0Nah',//play list videos
        key: config.access_token
    }
    let nextPageToken = undefined;
    const videosItems = [];
    do {
        console.log("Get videos item with token: ", nextPageToken);
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

    console.log(`Playlist has ${videosItems.length} videos`);
    const videoIds = videosItems.map(item=>({
        title: item.snippet.title,
        id: item.snippet.resourceId.videoId,
    }));

    const outputPath = './output/videoItems.json';
    fs.writeFileSync(outputPath,JSON.stringify(videoIds));
    console.log("List of videos has saved to ",outputPath);
}


main();