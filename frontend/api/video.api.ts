import axios from "axios";
import { config } from "../config";
import { handleResponse } from "./common.api";

function getVideosOfPlaylist(playlistId: string) {
  const api = `${config.serverApi}/api/video`;
  return handleResponse(
    axios.get(api, { params: { playlist_id: playlistId } })
  );
}

function removeVideo(id: string) {
  const api = `${config.serverApi}/api/video`;
  return handleResponse(axios.delete(api, { params: { id } }));
}

function replaceName(playlistId: string, search: string, replace: string) {
  const api = `${config.serverApi}/api/video/replace-name`;
  return handleResponse(
    axios.post(api, { playlist_id: playlistId, search, replace })
  );
}

function syncWithFile(playlistId: string) {
  const api = `${config.serverApi}/api/playlist/sync-state`;
  return handleResponse(axios.post(api, { playlist_id: playlistId }));
}

function start({
  action,
  ...body
}: {
  playlist_id: string;
  start: string;
  end: string;
  thread: string;
  action: "download" | "convert";
}) {
  const api = `${config.serverApi}/api/${action}/start`;
  return handleResponse(axios.post(api, body));
}

function stop({
  playlist_id,
  action,
}: {
  playlist_id: string;
  action: "download" | "convert";
}) {
  const api = `${config.serverApi}/api/${action}/stop`;
  return handleResponse(axios.post(api, { playlist_id }));
}

function addVideo(data: { playlist_id: string; url: string }) {
  const api = `${config.serverApi}/api/video/add`;
  return handleResponse(axios.post(api, data));
}

export const videoApi = {
  getVideosOfPlaylist,
  removeVideo,
  replaceName,
  syncWithFile,
  start,
  stop,
  addVideo,
};
