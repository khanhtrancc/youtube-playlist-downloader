import axios from "axios";
import { config } from "../config";

function getPlaylists() {
  const api = `${config.api}/api/playlist`;
  return axios
    .get(api)
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

function addPlaylist(id: string) {
  const api = `${config.api}/api/playlist`;
  return axios
    .post(api, { id })
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

function removePlaylist(id: string) {
  const api = `${config.api}/api/playlist`;
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

export const playlistApi = {
  getPlaylists,
  addPlaylist,
  removePlaylist,
};
