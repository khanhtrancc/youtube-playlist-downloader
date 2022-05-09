import axios from "axios";
import { config } from "../config";

function getVideosOfPlaylist(playlistId: string) {
  const api = `${config.api}/api/video`;
  return axios
    .get(api, { params: { playlist_id: playlistId } })
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}

function removeVideo(id: string) {
  const api = `${config.api}/api/video`;
  return axios
    .delete(api, { params: { id } })
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}

function replaceName(playlistId: string, search: string, replace: string) {
  const api = `${config.api}/api/video/replace-name`;
  return axios
    .post(api, { playlist_id: playlistId, search, replace })
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}

function syncWithFile(playlistId: string) {
  const api = `${config.api}/api/video/sync-state`;
  return axios
    .post(api, { playlist_id: playlistId })
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}

function download(
  playlistId: string,
  start: string,
  end: string,
  thread: string
) {
  const api = `${config.api}/api/video/download`;
  return axios
    .post(api, { playlist_id: playlistId, start, end, thread })
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}


function stop(
  playlistId: string,
) {
  const api = `${config.api}/api/video/stop`;
  return axios
    .post(api, { playlist_id: playlistId})
    .then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    })
    .catch((err) => {
      console.log("Request", api, err);
      return null;
    });
}

export const videoApi = {
  getVideosOfPlaylist,
  removeVideo,
  replaceName,
  syncWithFile,
  download,
  stop,
};
