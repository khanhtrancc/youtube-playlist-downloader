import { Video } from 'src/models/video';
import * as ytdl from 'ytdl-core';
import * as fs from 'fs';
import { EventEmitter } from 'events';
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FileHelper } from 'src/modules/common/file.helper';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class ConvertService {
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
    this.convert(video);
    return true;
  }

  getVideos() {
    return this.videos;
  }

  on(
    type: 'update' | 'state',
    handleFunc: ((videos: Video[]) => any) | ((state: boolean) => any),
  ) {
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

  convert(video: Video) {
    const statusObj = video.audio_file;

    statusObj.status = 'converting';
    statusObj.updated_at = Date.now();
    statusObj.description = 'Start converting';

    this.emitter.emit('update', [video]);

    const tmpBasePath = this.fileHelper.getPathOfFolder(
      video.playlist_id,
      'tmp',
    );
    const audioBasePath = this.fileHelper.getPathOfFolder(
      video.playlist_id,
      'audio',
    );
    const videoBasePath = this.fileHelper.getPathOfFolder(
      video.playlist_id,
      'video',
    );
    const tmpOutputPath = `${tmpBasePath}/${video.id}.mp3`;

    try {
      const command = ffmpeg(`${videoBasePath}/${video.id}.mp4`);
      command
        .audioBitrate(128)
        .save(tmpOutputPath)
        .on('progress', function (progress) {
          statusObj.updated_at = Date.now();
          statusObj.description = progress?.timemark || 'Converting';
        })
        .on('end', () => {
          fs.copyFile(
            tmpOutputPath,
            `${audioBasePath}/${video.id}.mp3`,
            (err) => {
              this.fileHelper.removeFileOrDirIfExisted(tmpOutputPath);

              if (err) {
                console.log('Copy error', err);
                statusObj.status = 'retry';
                statusObj.retry_count++;
                statusObj.updated_at = Date.now();
                this.removeVideo(video);
                this.emitter.emit('update', [video]);
                return;
              }
              statusObj.status = 'converted';
              statusObj.updated_at = Date.now();
              this.removeVideo(video);
              this.emitter.emit('update', [video]);
            },
          );
        })
        .on('error', (err) => {
          console.log('Convert error event', err);
          this.fileHelper.removeFileOrDirIfExisted(tmpOutputPath);
          statusObj.status = 'retry';
          statusObj.updated_at = Date.now();
          statusObj.description = '' + err;
          statusObj.retry_count++;
          this.emitter.emit('update', [video]);
        })
        .run();
    } catch (err) {
      console.log('Convert error', err);
      this.fileHelper.removeFileOrDirIfExisted(tmpOutputPath);
      statusObj.status = 'retry';
      statusObj.updated_at = Date.now();
      statusObj.description = '' + err;
      statusObj.retry_count++;
      this.emitter.emit('update', [video]);
    }
  }

  @Cron('* * * * * *')
  updateProgress() {
    this.emitter.emit('update', this.videos);
  }
}
