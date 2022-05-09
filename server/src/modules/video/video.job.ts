import { CronJob } from 'cron';
import { downloader } from 'src/helpers/downloader';
import { Video } from 'src/models/video';
import { VideoService } from './video.service';

let videoService = null;

const downloadJob = new CronJob({
  cronTime: '* * * * * *',
  runOnInit: true,
  onTick: () => {
    addNewVideos();
    checkRetry();
  },
});

function startDownloadJob() {
  if (downloadJob.running) {
    return;
  }
  downloadJob.start();
  videoService = new VideoService();

  downloader.getEmitter().on('update', (video: Video) => {
    videoService.updateDoc(video);
  });
}

function addNewVideos() {
  if (!videoService) {
    return;
  }
  //get video has waiting status and start download
  const needDownloadVideos: Video[] = videoService.where({
    'video_file.status': 'waiting',
  });
  needDownloadVideos.reverse();
  if (needDownloadVideos.length > 0) {
    downloader.addVideo(needDownloadVideos[0]);
  }
}

function checkRetry() {
  if (!videoService) {
    return;
  }
  const retryVideos = videoService.where({
    'video_file.status': 'retry',
  });
  for (let i = 0; i < retryVideos.length; i++) {
    const video: Video = retryVideos[i];
    if (video.video_file.retry_count >= 10) {
      video.video_file.status = 'error';
      video.video_file.updated_at = Date.now();
      videoService.updateDoc(video);
      continue;
    }

    if (video.video_file.updated_at < Date.now() - 5000) {
      video.video_file.status = 'waiting';
      video.video_file.updated_at = Date.now();
      videoService.updateDoc(video);
    }
  }
}

export const videoJob = {
  startDownloadJob,
};
