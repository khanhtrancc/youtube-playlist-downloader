import { Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { config } from 'src/config';
import { Video } from 'src/models/video';
import { EventsGateway } from '../common/events.gateway';
import { FileHelper } from '../common/file.helper';
import { StateService } from '../state/state.service';
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
    private readonly stateService: StateService,
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
    } else if (this.downloadService.getVideos().length === 0) {
      //check finish
      const retryVideos: Video[] = this.videoService.where({
        'video_file.status': 'retry',
      });
      if (retryVideos.length === 0) {
        if (this.stateService.state.currentAction === 'downloading') {
          this.stateService.changeState({
            currentAction: 'none',
          });
          this.eventGateway.emit('message', 'Finished downloading videos');
        }
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
    const allVideos = this.videoService.get({});

    const videos = allVideos.filter(
      (video) =>
        video.video_file.status === 'downloading' ||
        video.video_file.status === 'error' ||
        video.video_file.status === 'retry' ||
        video.video_file.status === 'waiting',
    );

    for (const item of videos) {
      const tmpBasePath = this.fileHelper.getPathOfFolder(
        item.playlist_id,
        'tmp',
      );

      const tmpOutputPath = `${tmpBasePath}/${item.id}.mp4`;
      this.fileHelper.removeFileOrDirIfExisted(tmpOutputPath);
      item.video_file.status = 'none';
      item.video_file.updated_at = Date.now();
      this.videoService.updateDoc(item);
    }
    console.log(
      `Found ${videos.length} unfinished downloading videos. Reseting...`,
    );
    this.isReady = true;
  }
}
