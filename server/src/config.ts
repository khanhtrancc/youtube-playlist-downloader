
export const config =  {
  googleApiAccessToken: process.env.YOUTUBE_ACCESS_TOKEN, //access token to list videos of playlist
  port: process.env.PORT || 8080,
  maxRetryCount: 5,
  retryDelayTime: 1000,
  // baseOutputPath,
  // videoPath: `${baseOutputPath}/videos`,
  // tmpPath: `${baseOutputPath}/tmp`,
  // audioPath: `${baseOutputPath}/audio`,
  // statePath: `${baseOutputPath}/state.json`,
  // readableAudioPath: `${baseOutputPath}/final-audio`,
};
