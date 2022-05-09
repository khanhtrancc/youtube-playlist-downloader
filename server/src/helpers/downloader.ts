import { Playlist } from 'src/models/playlist';
import { Video } from 'src/models/video';
import * as ytdl from 'ytdl-core';
import { file } from './file';
import * as fs from 'fs';
import { EventEmitter } from 'events';

class Downloader {
  videos: Video[] = [];
  playlist: Playlist | null = null;
  emitter = new EventEmitter();
  maxThread = 10;

  setMaxThread(thread) {
    this.maxThread = thread;
  }

  getMaxThread() {
    return this.maxThread;
  }

  setPlaylist(playlist: Playlist) {
    this.playlist = playlist;
  }

  addVideo(video: Video) {
    if (!this.playlist) {
      return false;
    }

    if (this.videos.length >= this.maxThread) {
      return false;
    }
    this.videos.push(video);
    this.download(video);
    return true;
  }

  getEmitter() {
    return this.emitter;
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
    video.video_file.status = 'downloading';
    video.video_file.updated_at = Date.now();
    video.video_file.description = 'Start downloading';
    this.emitter.emit('update', video);

    const link = 'http://www.youtube.com/watch?v=' + video.id;
    const downloader = ytdl(link, {
      quality: 'highestaudio',
    });
    const tmpBasePath = file.getPathOfFolder(this.playlist, 'tmp');
    const videoBasePath = file.getPathOfFolder(this.playlist, 'video');
    const tmpOutputPath = `${tmpBasePath}/${video.id}.mp4`;
    downloader.pipe(fs.createWriteStream(tmpOutputPath));

    downloader.on('progress', (chunkLength, downloaded, total) => {
      const percent = Math.round((downloaded / total) * 100);
      const toMb = (byte) => (byte / 1024 / 1024).toFixed(2);

      video.video_file.description = `${percent}% downloaded (${toMb(
        downloaded,
      )}MB of ${toMb(total)}MB)`;
      video.video_file.percent = percent;
      video.video_file.updated_at = Date.now();
      this.emitter.emit('update', video);
    });

    downloader.on('end', () => {
      fs.copyFile(tmpOutputPath, `${videoBasePath}/${video.id}.mp4`, (err) => {
        try {
          fs.rmSync(tmpOutputPath);
        } catch (err) {
          console.log('REmove file error', err);
        }
        if (err) {
          video.video_file.status = 'retry';
          video.video_file.retry_count++;
          video.video_file.updated_at = Date.now();
          this.removeVideo(video);
          this.emitter.emit('update', video);
          return;
        }
        video.video_file.status = 'downloaded';
        video.video_file.updated_at = Date.now();
        this.removeVideo(video);
        this.emitter.emit('update', video);
      });
    });

    downloader.on('error', (err) => {
      if (fs.existsSync(tmpOutputPath)) {
        try {
          fs.rmSync(tmpOutputPath);
        } catch (err) {
          console.log('REmove file error', err);
        }
      }

      video.video_file.status = 'retry';
      video.video_file.retry_count++;
      video.video_file.updated_at = Date.now();
      this.removeVideo(video);
      this.emitter.emit('update', video);
    });
  }
}

export const downloader = new Downloader();
