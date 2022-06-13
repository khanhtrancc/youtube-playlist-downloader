import axios from "axios";
import { config } from "../config";
import { handleResponse } from "./common.api";

function getPlaylists() {
  const api = `${config.serverApi}/api/playlist`;
  return handleResponse(axios.get(api));
}

function addPlaylist(id: string) {
  const api = `${config.serverApi}/api/playlist`;
  return handleResponse(axios.post(api, { id }));
}

function removePlaylist(id: string) {
  const api = `${config.serverApi}/api/playlist`;
  return handleResponse(axios.delete(api, { params: { id } }));
}

function exportData(
  playlist_id: string,
  start: string,
  end: string,
  type: string
) {
  const api = `${config.serverApi}/api/playlist/export`;
  return handleResponse(axios.post(api, { playlist_id, type, start, end }));
}

function removeFile(playlist_id: string) {
  const api = `${config.serverApi}/api/playlist/remove-file`;
  return handleResponse(axios.post(api, { playlist_id }));
}

export const playlistApi = {
  getPlaylists,
  addPlaylist,
  removePlaylist,
  exportData,
  removeFile,
};
