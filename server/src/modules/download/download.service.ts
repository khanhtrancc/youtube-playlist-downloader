import { Video } from 'src/models/video';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileHelper } from 'src/modules/common/file.helper';
import * as stream from 'stream';
import * as ffmpeg from 'ffmpeg';

@Injectable()
export class DownloadService {
  constructor(private readonly fileHelper: FileHelper) {}

  private videos: Video[] = [];
  private emitter = new EventEmitter();
  private maxThread = 10;

  setMaxThread(thread) {
    this.maxThread = thread;
  }

  getMaxThread() {
    return this.maxThread;
  }

  addVideo(video: Video) {
    if (this.videos.length >= this.maxThread) {
      return false;
    }
    this.videos.push(video);
    this.download(video);
    return true;
  }

  getVideos() {
    return this.videos;
  }

  on(type: 'update', handleFunc: (videos: Video[]) => any) {
    this.emitter.on(type, handleFunc);
  }

  getCurrentThread() {
    return this.videos.length;
  }

  hasVideo(video: Video) {
    const index = this.videos.findIndex((item) => item.id === video.id);
    return index >= 0;
  }

  removeVideo(video: Video) {
    const index = this.videos.findIndex((item) => item.id === video.id);
    if (index >= 0) {
      this.videos.splice(index, 1);
    }
  }

  download(video: Video) {
    const statusObj = video.video_file;

    statusObj.status = 'downloading';
    statusObj.updated_at = Date.now();
    statusObj.description = 'Start downloading';

    this.emitter.emit('update', [video]);

    const link = 'http://www.youtube.com/watch?v=' + video.id;
    const downloader = ytdl(link, {
      quality: 'highestaudio',
    });
    const tmpBasePath = this.fileHelper.getPathOfFolder(
      video.playlist_id,
      'tmp',
    );
    const videoBasePath = this.fileHelper.getPathOfFolder(
      video.playlist_id,
      'video',
    );
    const tmpOutputPath = `${tmpBasePath}/${video.id}.mp4`;

    const fileStream = fs.createWriteStream(tmpOutputPath);
    fileStream.on('error', (err) => {
      console.log('Create stream error error', err);
      statusObj.status = 'retry';
      statusObj.updated_at = Date.now();
      statusObj.description = '' + err;
      statusObj.retry_count++;
      this.emitter.emit('update', [video]);
      fileStream.end();
    });

    fileStream.on('ready', () => {
      downloader.pipe(fileStream);
    });

    downloader.on('progress', (chunkLength, downloaded, total) => {
      const percent = Math.round((downloaded / total) * 100);
      const toMb = (byte) => (byte / 1024 / 1024).toFixed(2);

      statusObj.description = `${percent}% downloaded (${toMb(
        downloaded,
      )}MB of ${toMb(total)}MB)`;
      statusObj.percent = percent;
      statusObj.updated_at = Date.now();
    });

    downloader.on('end', () => {
      fs.copyFile(
        tmpOutputPath,
        `${videoBasePath}/${video.id}.mp4`,
        (err) => {
          this.fileHelper.removeFileIfExisted(tmpOutputPath);

          if (err) {
            statusObj.status = 'retry';
            statusObj.retry_count++;
            statusObj.updated_at = Date.now();
            this.removeVideo(video);
            this.emitter.emit('update', [video]);
            return;
          }
          statusObj.status = 'downloaded';
          statusObj.updated_at = Date.now();
          this.removeVideo(video);
          this.emitter.emit('update', [video]);
        },
      );
    });

    downloader.on('error', (err) => {
      this.fileHelper.removeFileIfExisted(tmpOutputPath);

      statusObj.status = 'retry';
      statusObj.retry_count++;
      statusObj.updated_at = Date.now();
      this.removeVideo(video);
      this.emitter.emit('update', [video]);
    });
  }

  @Cron('* * * * * *')
  updateProgress() {
    this.emitter.emit('update', this.videos);
  }
}
