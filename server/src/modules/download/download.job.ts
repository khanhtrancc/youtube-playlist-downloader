import { Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { config } from 'src/config';
import { Video } from 'src/models/video';
import { EventsGateway } from '../common/events.gateway';
import { FileHelper } from '../common/file.helper';
import { VideoService } from '../video/video.service';
import { DownloadService } from './download.service';

@Injectable()
export class DownloadJob {
  private isReady = false;
  constructor(
    private readonly videoService: VideoService,
    private readonly downloadService: DownloadService,
    private readonly eventGateway: EventsGateway,
    private readonly fileHelper: FileHelper,
  ) {
    this.downloadService.on('update', (videos) => {
      if (!videos || videos.length === 0) {
        return;
      }
      videos.forEach((video) => {
        this.videoService.updateDoc(video);
      });
      this.eventGateway.emit('progress', videos);
    });
    this.downloadService.on('state', (state) => {
      console.log('Change download state', state);
      this.eventGateway.emit('download-state', state);
    });
  }

  @Cron('* * * * * *')
  findNeedDownloadVideo() {
    if (!this.isReady) {
      return;
    }
    //get video has waiting status and start download
    const needDownloadVideos: Video[] = this.videoService.where({
      'video_file.status': 'waiting',
    });

    needDownloadVideos.reverse();
    if (needDownloadVideos.length > 0) {
      this.downloadService.addVideo(needDownloadVideos[0]);
    } else if (
      this.downloadService.isRunning &&
      this.downloadService.getVideos().length === 0
    ) {
      //check finish
      const retryVideos: Video[] = this.videoService.where({
        'video_file.status': 'retry',
      });
      if (retryVideos.length === 0) {
        this.downloadService.changeRunningState(false);
      }
    }
  }

  @Interval(config.retryDelayTime)
  checkRetry() {
    if (!this.isReady) {
      return;
    }

    const retryVideos: Video[] = this.videoService.where({
      'video_file.status': 'retry',
    });

    for (let i = 0; i < retryVideos.length; i++) {
      const video: Video = retryVideos[i];
      const statusObj = video.video_file;
      if (statusObj.retry_count >= config.maxRetryCount) {
        statusObj.status = 'error';
        statusObj.updated_at = Date.now();
        this.videoService.updateDoc(video);
        continue;
      }

      if (statusObj.updated_at < Date.now() - config.retryDelayTime) {
        statusObj.status = 'waiting';
        statusObj.updated_at = Date.now();
        this.videoService.updateDoc(video);
      }
    }
  }

  @Timeout(1000)
  resetUnfinishedVideos() {
    const videos = this.videoService.where({
      'video_file.status': 'downloading',
    });
    console.log(`Found ${videos.length} unfinished videos. Reseting...`);
    videos.forEach((item) => {
      const tmpBasePath = this.fileHelper.getPathOfFolder(
        item.playlist_id,
        'tmp',
      );

      const tmpOutputPath = `${tmpBasePath}/${item.id}.mp4`;
      this.fileHelper.removeFileOrDirIfExisted(tmpOutputPath);
      item.video_file.status = 'none';
      this.videoService.updateDoc(item);
    });
    this.isReady = true;
  }
}
