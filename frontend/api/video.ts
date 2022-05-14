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
  const api = `${config.api}/api/playlist/sync-state`;
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

function start({
  playlist_id,
  start,
  end,
  thread,
  action,
}: {
  playlist_id: string;
  start: string;
  end: string;
  thread: string;
  action: "download" | "convert";
}) {
  const api = `${config.api}/api/${action}/start`;
  return axios
    .post(api, {
      playlist_id,
      start,
      end,
      thread,
    })
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

function stop({
  playlist_id,
  action,
}: {
  playlist_id: string;
  action: "download" | "convert";
}) {
  const api = `${config.api}/api/${action}/stop`;
  return axios
    .post(api, { playlist_id })
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

function getRunningState() {
  const dapi = `${config.api}/api/download/state`;
  const capi = `${config.api}/api/convert/state`;
  return Promise.all([
    axios.get(dapi).then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    }),
    axios.get(capi).then((res) => {
      if (res.data.code === 200) {
        return res.data.data;
      }
      return null;
    }),
  ])
    .then((data) => {
      return {
        isDownloading: data[0] && data[0].isRunning,
        isConverting: data[1] && data[1].isRunning,
      };
    })
    .catch((err) => {
      return { isDownloading: false, isConverting: false };
    });
}



export const videoApi = {
  getVideosOfPlaylist,
  removeVideo,
  replaceName,
  syncWithFile,
  start,
  stop,
  getRunningState,
};
