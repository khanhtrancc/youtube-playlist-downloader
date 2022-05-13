import { Injectable } from '@nestjs/common';
import { Cron, Timeout } from '@nestjs/schedule';
import { Video } from 'src/models/video';
import { EventsGateway } from '../common/events.gateway';
import { FileHelper } from '../common/file.helper';
import { VideoService } from '../video/video.service';
import { DownloadService } from './download.service';

@Injectable()
export class DownloadJob {
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
  }

  @Cron('* * * * * *')
  findNeedDownloadVideo() {
    //get video has waiting status and start download
    let needDownloadVideos: Video[] = this.videoService.where({
      'video_file.status': 'waiting',
    });

    needDownloadVideos.reverse();
    if (needDownloadVideos.length > 0) {
      this.downloadService.addVideo(needDownloadVideos[0]);
    }
  }

  @Cron('*/5 * * * * *')
  checkRetry() {
    let retryVideos: Video[] = this.videoService.where({
      'video_file.status': 'waiting',
    });

    for (let i = 0; i < retryVideos.length; i++) {
      const video: Video = retryVideos[i];
      const statusObj = video.video_file;
      if (statusObj.retry_count >= 10) {
        statusObj.status = 'error';
        statusObj.updated_at = Date.now();
        this.videoService.updateDoc(video);
        continue;
      }

      if (statusObj.updated_at < Date.now() - 5000) {
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
      this.fileHelper.removeFileIfExisted(tmpOutputPath);
      item.video_file.status = 'none';
      this.videoService.updateDoc(item);
    });
  }
}
