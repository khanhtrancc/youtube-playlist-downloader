import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Playlist } from 'src/models/playlist';
import { Request } from 'express';
import { VideoService } from './video.service';
import { ResponseFactory } from 'src/helpers/response';
import { db } from 'src/helpers/db';
import { YoutubeApi } from 'src/helpers/youtube';
import { config } from 'src/config';
import { Video } from 'src/models/video';
import { PlaylistService } from '../playlist/playlist.service';
import { file } from 'src/helpers/file';
import * as fs from 'fs';
import { numberUtils } from 'src/helpers/number';
import { downloader } from 'src/helpers/downloader';

@Controller()
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly playlistService: PlaylistService,
  ) {}

  @Get('/api/video')
  get(@Req() req: Request) {
    const { playlist_id } = req.query;
    if (!playlist_id) {
      return ResponseFactory.badRequest('Missing Playlist Id (playlist_id)');
    }
    const videos = this.videoService.get({ playlist_id });
    return ResponseFactory.success(videos);
  }

  @Delete('/api/video')
  async delete(@Req() req: Request) {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return ResponseFactory.badRequest('Missing Video Id (id)');
    }
    const existedVideos = this.videoService.get({ id });
    if (existedVideos.length > 0) {
      const video = existedVideos[0];
      //todo: Remove videos and files
      this.videoService.delete(id);
    }

    const newList = this.videoService.get({});
    return ResponseFactory.success(newList);
  }

  @Post('/api/video/replace-name')
  async replaceName(@Req() req: Request) {
    const { search, replace, playlist_id } = req.body;
    if (
      typeof search !== 'string' ||
      typeof replace !== 'string' ||
      typeof playlist_id !== 'string'
    ) {
      return ResponseFactory.badRequest(
        'Missing search or replace or playlist_id',
      );
    }
    const existedVideos = this.videoService.get({ playlist_id });
    existedVideos.forEach((item) => {
      item.name = item.name.replace(search, replace);
      this.videoService.updateDoc(item);
    });

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Post('/api/video/sync-state')
  async syncState(@Req() req: Request) {
    const { playlist_id } = req.body;
    if (typeof playlist_id !== 'string') {
      return ResponseFactory.badRequest('Missing playlist_id');
    }

    const playlist = this.playlistService.getPlaylistById(playlist_id);
    if (!playlist) {
      return ResponseFactory.badRequest('Invalid playlist_id');
    }

    file.createPlaylistFolderIfNeed(playlist);

    const videos = this.videoService.get({ playlist_id });
    const videoBasePath = file.getPathOfFolder(playlist, 'video');
    const audioBasePath = file.getPathOfFolder(playlist, 'audio');
    for (let i = 0; i < videos.length; i++) {
      const videoPath = `${videoBasePath}/${videos[i].id}.mp4`;
      let needUpdated = false;

      if (fs.existsSync(videoPath)) {
        videos[i].video_file.status = 'downloaded';
        videos[i].video_file.description = 'Sync from file';
        videos[i].video_file.retry_count = 0;
        videos[i].video_file.updated_at = Date.now();

        needUpdated = true;
      }

      const audioPath = `${audioBasePath}/${videos[i].id}.mp3`;
      if (fs.existsSync(audioPath)) {
        videos[i].audio_file.status = 'converted';
        videos[i].audio_file.description = 'Sync from file';
        videos[i].audio_file.retry_count = 0;
        videos[i].audio_file.updated_at = Date.now();

        needUpdated = true;
      }
      if (needUpdated) {
        this.videoService.updateDoc(videos[i]);
      }
    }

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Post('/api/video/download')
  async download(@Req() req: Request) {
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

    downloader.setMaxThread(maxThread);
    downloader.setPlaylist(playlist);

    // change status of videos to waiting
    for (
      let i = startIndex;
      i <= endIndex && i < videos.length && i >= 0;
      i++
    ) {
      const video = videos[i];
      if (video.video_file.status === 'downloaded') {
        continue;
      }
      if (video.video_file.status === 'downloading') {
        if (downloader.hasVideo(video)) {
          continue;
        }
      }

      video.video_file.status = 'waiting';
      video.video_file.retry_count = 0;

      this.videoService.updateDoc(video);
    }

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Post('/api/video/stop')
  async stop(@Req() req: Request) {
    const { playlist_id } = req.body;
    if (
      typeof playlist_id !== 'string'
    ) {
      return ResponseFactory.badRequest(
        'Missing  playlist_id',
      );
    }

    const videos = this.videoService.get({ playlist_id, status: "waiting" });
    // change status of videos
    for (
      let i = 0;
      i < videos.length;
      i++
    ) {
      const video = videos[i];
     

      video.video_file.status = 'none';
      this.videoService.updateDoc(video);
    }

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }
}
