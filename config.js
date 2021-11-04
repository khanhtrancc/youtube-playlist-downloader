require('dotenv').config();

const baseOutputPath = `./output/${process.env.PLAYLIST_ID}`;

module.exports = {
    access_token: 'AIzaSyDfWXSSAVdoV7wLhWRki3eUV7uBwhwv2tY',
    baseOutputPath,
    videoPath: `${baseOutputPath}/videos`,
    tmpPath: `${baseOutputPath}/tmp`,
    audioPath: `${baseOutputPath}/audio`,
    videoStatePath: `${baseOutputPath}/videos.json`,
    playlistId: process.env.PLAYLIST_ID,
    playlistName: process.env.PLAYLIST_NAME,
    
}