import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ResponseFactory } from 'src/helpers/response';
import { PlaylistService } from '../playlist/playlist.service';
import { numberUtils } from 'src/helpers/number';
import { VideoService } from '../video/video.service';
import { DownloadService } from './download.service';
import { FileHelper } from '../common/file.helper';
import { StateService } from '../state/state.service';

@Controller('/api/download')
export class DownloadController {
  constructor(
    private readonly videoService: VideoService,
    private readonly downloadService: DownloadService,
    private readonly playlistService: PlaylistService,
    private readonly fileHelper: FileHelper,
    private readonly stateService: StateService,
  ) {}

  @Post('/start')
  async start(@Req() req: Request) {
    const { thread, end, start, playlist_id, only_audio } = req.body;
    if (
      typeof start !== 'string' ||
      typeof end !== 'string' ||
      typeof thread !== 'string' ||
      typeof playlist_id !== 'string'
    ) {
      return ResponseFactory.badRequest(
        'Missing start, end, thread or playlist_id',
      );
    }

    if (!this.stateService.isReadyToNewAction()) {
      return ResponseFactory.badRequest(
        'The server is doing other action: ' +
          this.stateService.state.currentAction,
      );
    }

    const videos = this.videoService.get({ playlist_id });
    const startIndex = numberUtils.parseInt(start, 0);
    const endIndex = numberUtils.parseInt(end, videos.length);
    const maxThread = numberUtils.parseInt(thread, 10);

    this.fileHelper.createPlaylistFolderIfNeed(playlist_id);
    this.downloadService.setMaxThread(maxThread);

    // change status of videos to waiting
    for (
      let i = startIndex;
      i <= endIndex && i < videos.length && i >= 0;
      i++
    ) {
      const video = videos[i];
      const statusObj = only_audio ? video.audio_file : video.video_file;
      if (statusObj.status === 'downloaded') {
        continue;
      }
      if (statusObj.status === 'downloading') {
        if (this.downloadService.hasVideo(video)) {
          continue;
        }
      }

      statusObj.status = 'waiting';
      statusObj.retry_count = 0;

      this.videoService.updateDoc(video);
    }

    this.stateService.changeState({
      currentAction: 'downloading',
      startIndex,
      endIndex,
      handlingPlaylistId: playlist_id,
    });
    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Post('/stop')
  async stop(@Req() req: Request) {
    const { playlist_id } = req.body;
    if (typeof playlist_id !== 'string') {
      return ResponseFactory.badRequest('Missing  playlist_id');
    }

    if (this.stateService.state.currentAction !== 'downloading') {
      return ResponseFactory.badRequest(
        'The server is doing other action: ' +
          this.stateService.state.currentAction,
      );
    }

    this.downloadService.stopAllDownloading();
    const videos = this.videoService.where({ playlist_id });
    // change status of videos
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      if (
        video.video_file.status === 'waiting' ||
        video.video_file.status === 'retry' ||
        (video.video_file.status === 'downloading' &&
          !this.downloadService.hasVideo(video))
      ) {
        video.video_file.status = 'none';
        video.video_file.description = 'Stop by user';
        video.video_file.updated_at = Date.now();
        this.videoService.updateDoc(video);
      }
    }

    this.stateService.changeState({
      currentAction: 'none',
    });
    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }
}
