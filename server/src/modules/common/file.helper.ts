import * as path from 'path';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import * as rimraf from 'rimraf';
import { join } from 'path';
const archiver = require('archiver');

@Injectable()
export class FileHelper {
  getCwdPath() {
    return process.cwd();
  }

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

  removeFileOrDirIfExisted(path: string) {
    if (fs.existsSync(path)) {
      try {
        if (fs.lstatSync(path).isDirectory()) {
          rimraf.sync(path);
        } else {
          fs.unlinkSync(path);
        }
      } catch (err) {
        console.log('Remove file after error error', path, err);
      }
    }
  }

  createFolderIfNeed(path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  zipFolder(sourcePath: string, targetPath: string) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(targetPath);
      const archive = archiver('zip');

      output.on('close', function () {
        resolve(targetPath);
      });

      archive.on('error', function (err) {
        reject(err);
      });

      archive.pipe(output);

      // append files from a sub-directory, putting its contents at the root of archive
      archive.directory(sourcePath, false);

      archive.finalize();
    });
  }

  getRelativeLinkForPublicPath(path: string){
    const basePath = join(process.cwd(),'./public');
    return path.replace(basePath,'');
  }
}
