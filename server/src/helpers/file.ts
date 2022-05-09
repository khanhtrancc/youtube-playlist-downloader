import { Playlist } from 'src/models/playlist';
import * as path from 'path';
import * as fs from 'fs';

function getBasePathForPlaylist(playlist: Playlist): string {
  const playlistShortName = playlist.name
    .trim()
    .split(' ')
    .map((item) => item[0].toUpperCase())
    .reduce((pre, cur) => pre + cur);
  const baseOutputPath = path.join(
    process.cwd(),
    `./public/${playlistShortName}-${playlist.id.slice(-4)}`,
  );
  return baseOutputPath;
}

function getPathOfFolder(
  playlist: Playlist,
  type: 'audio' | 'video' | 'tmp' | 'public',
): string {
  const basePath = getBasePathForPlaylist(playlist);
  switch (type) {
    case 'audio':
      return `${basePath}/audios`;
    case 'video':
      return `${basePath}/videos`;
    case 'tmp':
      return `${basePath}/tmp`;
    case 'public':
      return `${basePath}/public`;
  }
}

function createPlaylistFolderIfNeed(playlist: Playlist) {
  ['audio', 'video', 'tmp', 'public'].forEach((type) => {
    const path = getPathOfFolder(playlist, type as any);
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  });
}

export const file = {
  getBasePathForPlaylist,
  createPlaylistFolderIfNeed,
  getPathOfFolder,
};
