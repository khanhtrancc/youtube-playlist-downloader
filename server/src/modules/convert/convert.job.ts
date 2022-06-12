import { Injectable } from '@nestjs/common';
import { Cron, Interval, Timeout } from '@nestjs/schedule';
import { config } from 'src/config';
import { Video } from 'src/models/video';
import { EventsGateway } from '../common/events.gateway';
import { FileHelper } from '../common/file.helper';
import { StateService } from '../state/state.service';
import { VideoService } from '../video/video.service';
import { ConvertService } from './convert.service';

@Injectable()
export class ConvertJob {
  private isReady = false;

  constructor(
    private readonly videoService: VideoService,
    private readonly convertService: ConvertService,
    private readonly eventGateway: EventsGateway,
    private readonly fileHelper: FileHelper,
    private readonly stateService: StateService,
  ) {
    this.convertService.on('update', (videos) => {
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

    //get video has waiting status and start convert
    const needConvertVideos: Video[] = this.videoService.where({
      'audio_file.status': 'waiting',
    });

    needConvertVideos.reverse();
    if (needConvertVideos.length > 0) {
      this.convertService.addVideo(needConvertVideos[0]);
    } else if (this.convertService.getVideos().length === 0) {
      //check finish
      const retryVideos: Video[] = this.videoService.where({
        'audio_file.status': 'retry',
      });
      if (retryVideos.length === 0) {
        if (this.stateService.state.currentAction === 'converting') {
          this.stateService.changeState({
            currentAction: 'none',
          });
          this.eventGateway.emit('message', 'Finished converting videos');
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
      'audio_file.status': 'retry',
    });

    for (let i = 0; i < retryVideos.length; i++) {
      const video: Video = retryVideos[i];
      const statusObj = video.audio_file;
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
        video.audio_file.status === 'converting' ||
        video.audio_file.status === 'error' ||
        video.audio_file.status === 'retry' ||
        video.audio_file.status === 'waiting',
    );

    for (const item of videos) {
      const tmpBasePath = this.fileHelper.getPathOfFolder(
        item.playlist_id,
        'tmp',
      );

      const tmpOutputPath = `${tmpBasePath}/${item.id}.mp3`;
      this.fileHelper.removeFileOrDirIfExisted(tmpOutputPath);
      item.audio_file.status = 'none';
      item.audio_file.updated_at = Date.now();
      this.videoService.updateDoc(item);
    }
    console.log(
      `Found ${videos.length} unfinished converting videos. Reseting...`,
    );
    this.isReady = true;
  }
}
