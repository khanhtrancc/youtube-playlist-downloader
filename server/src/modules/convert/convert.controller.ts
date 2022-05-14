import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ResponseFactory } from 'src/helpers/response';
import { PlaylistService } from '../playlist/playlist.service';
import { numberUtils } from 'src/helpers/number';
import { VideoService } from '../video/video.service';
import { FileHelper } from '../common/file.helper';
import { ConvertService } from './convert.service';

@Controller('/api/convert')
export class ConvertController {
  constructor(
    private readonly videoService: VideoService,
    private readonly convertService: ConvertService,
    private readonly playlistService: PlaylistService,
    private readonly fileHelper: FileHelper,
  ) {}

  @Post('/start')
  async start(@Req() req: Request) {
    const { thread, end, start, playlist_id } = req.body;
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

    const videos = this.videoService.get({ playlist_id });
    const startIndex = numberUtils.parseInt(start, 0);
    const endIndex = numberUtils.parseInt(end, videos.length);
    const maxThread = numberUtils.parseInt(thread, 10);

    const playlist = this.playlistService.getPlaylistById(playlist_id);

    this.fileHelper.createPlaylistFolderIfNeed(playlist_id);
    this.convertService.setMaxThread(maxThread);

    // change status of videos to waiting
    for (
      let i = startIndex;
      i <= endIndex && i < videos.length && i >= 0;
      i++
    ) {
      const video = videos[i];
      const statusObj = video.audio_file;
      if (statusObj.status === 'converted') {
        if (this.convertService.hasVideo(video)) {
          continue;
        }
      }

      statusObj.status = 'waiting';
      statusObj.retry_count = 0;

      this.videoService.updateDoc(video);
    }

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Post('/stop')
  async stop(@Req() req: Request) {
    const { playlist_id } = req.body;
    if (typeof playlist_id !== 'string') {
      return ResponseFactory.badRequest('Missing  playlist_id');
    }

    const videos = this.videoService.where({ playlist_id });
    // change status of videos
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      if (
        video.audio_file.status === 'waiting' ||
        video.audio_file.status === 'retry' ||
        (video.audio_file.status === 'converting' &&
          !this.convertService.hasVideo(video))
      ) {
        video.audio_file.status = 'none';
        this.videoService.updateDoc(video);
      }
    }

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }
}
