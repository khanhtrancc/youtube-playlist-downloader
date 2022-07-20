import axios from 'axios';
import { Playlist } from 'src/models/playlist';
import { Video } from 'src/models/video';

export class YoutubeApi {
  accessToken: string;
  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async getVideosOfPlaylist(playlistId): Promise<Video[]> {
    const api = 'https://www.googleapis.com/youtube/v3/playlistItems';
    const baseParams = {
      part: 'snippet',
      playlistId: playlistId,
      key: this.accessToken,
      maxResults: 50,
    };
    let nextPageToken = undefined;
    const videosItems = [];
    do {
      // console.log('Get videos of page: ', nextPageToken);
      try {
        const params = {
          ...baseParams,
          pageToken: nextPageToken,
        };
        const response = await axios.get(api, { params });
        if (response.status === 200) {
          const data = response.data;
          // console.log("Res",data);
          if (data.items && data.items.length > 0) {
            videosItems.push(...data.items);
          } else {
            console.log('No video items');
          }
          if (data.nextPageToken) {
            nextPageToken = data.nextPageToken;
            continue;
          }
        }
      } catch (err) {
        console.log('Get list error', err);
      }
      nextPageToken = undefined;
    } while (nextPageToken);

    const videos: Video[] = videosItems.map((item, index) => {
      const videoId = item.snippet.resourceId.videoId;
      const thumbnails = item.snippet.thumbnails;
      let url;
      try {
        url = thumbnails.maxres
          ? thumbnails.maxres.url
          : thumbnails.default.url;
      } catch (err) {}
      return {
        index,
        name: item.snippet.title,
        id: videoId,
        playlist_id: playlistId,
        thumbnail: url,
        video_file: {
          status: 'none',
          updated_at: Date.now(),
          retry_count: 0,
          description: '',
        },
        audio_file: {
          status: 'none',
          updated_at: Date.now(),
          description: '',
          retry_count: 0,
        },
      };
    });
    return videos;
  }

  async getPlaylistInfo(playlistId): Promise<Playlist | null> {
    const api = 'https://www.googleapis.com/youtube/v3/playlists';
    const baseParams = {
      part: 'snippet',
      id: playlistId,
      key: this.accessToken,
    };
    try {
      const params = {
        ...baseParams,
      };
      const response = await axios.get(api, { params });
      if (response.status === 200) {
        const data = response.data;
        if (data.items && data.items.length == 1) {
          const info = data.items[0].snippet;
          const thumbnails = info.thumbnails;
          let url;
          try {
            url = thumbnails.maxres
              ? thumbnails.maxres.url
              : thumbnails.default.url;
          } catch (err) {}

          return {
            id: playlistId,
            name: info.title,
            channel: info.channelTitle,
            thumbnail: url,
            error_video: 0,
            total_video: 0,
            downloaded_video: 0,
            status: 'active',
          };
        }
      }
    } catch (err) {
      console.log('Get list error', err.response);
    }
    return null;
  }

  async getVideoFromUrl(id: string): Promise<Video> {
    const api = 'https://www.googleapis.com/youtube/v3/videos';
    const baseParams = {
      part: 'snippet',
      id,
      key: this.accessToken,
      maxResults: 1,
    };
    let videoData;
    try {
      const params = {
        ...baseParams,
      };
      const response = await axios.get(api, { params });
      if (response.status === 200) {
        const data = response.data;
        // console.log("Res",data);
        if (data.items && data.items.length > 0) {
          videoData = data.items[0];
        } else {
          console.log('No video items');
        }
      }
    } catch (err) {
      console.log('Get list error', err);
    }
    if (!videoData) {
      return null;
    }

    const videoId = videoData.id;
    const thumbnails = videoData.snippet.thumbnails;
    let url;
    try {
      url = thumbnails.maxres ? thumbnails.maxres.url : thumbnails.default.url;
    } catch (err) {}
    const video: Video = {
      name: videoData.snippet.title,
      id: videoId,
      playlist_id: '',
      thumbnail: url,
      video_file: {
        status: 'none',
        updated_at: Date.now(),
        retry_count: 0,
        description: '',
      },
      audio_file: {
        status: 'none',
        updated_at: Date.now(),
        description: '',
        retry_count: 0,
      },
    };
    return video;
  }

  getVideoId(url: string): string | null {
    var regExp =
      /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    var match = url.match(regExp);
    return match && match[7].length == 11 ? match[7] : null;
  }
}
