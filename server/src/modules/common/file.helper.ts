import * as path from 'path';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FileHelper {
  getBasePathForPlaylist(playlist_id: string): string {
    const baseOutputPath = path.join(process.cwd(), `./public/${playlist_id}`);
    return baseOutputPath;
  }

  getPathOfFolder(
    playlist_id: string,
    type: 'audio' | 'video' | 'tmp' | 'public',
  ): string {
    const basePath = this.getBasePathForPlaylist(playlist_id);
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

  createPlaylistFolderIfNeed(playlist_id: string) {
    ['audio', 'video', 'tmp', 'public'].forEach((type) => {
      const path = this.getPathOfFolder(playlist_id, type as any);
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
    });
  }

  removeFileIfExisted(path: string) {
    if (fs.existsSync(path)) {
      try {
        fs.unlinkSync(path);
      } catch (err) {
        console.log('Remove file after error error', path, err);
      }
    }
  }
}
