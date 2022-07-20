import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { VideoService } from './video.service';
import { ResponseFactory } from 'src/helpers/response';
import { PlaylistService } from '../playlist/playlist.service';
import * as fs from 'fs';
import { FileHelper } from 'src/modules/common/file.helper';
import { YoutubeApi } from 'src/helpers/youtube';
import { config } from 'src/config';

@Controller('/api/video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  get(@Req() req: Request) {
    const { playlist_id } = req.query;
    if (!playlist_id) {
      return ResponseFactory.badRequest('Missing Playlist Id (playlist_id)');
    }
    const videos = this.videoService.get({ playlist_id });
    return ResponseFactory.success(videos);
  }

  @Post('/add')
  async add(@Req() req: Request) {
    const { url, playlist_id } = req.body;
    if (!url || typeof url !== 'string') {
      return ResponseFactory.badRequest('Missing Video URL (url)');
    }

    const youtubeApi = new YoutubeApi(config.googleApiAccessToken);
    const id = youtubeApi.getVideoId(url);

    const existedVideos = this.videoService.get({ id, playlist_id });
    if (existedVideos.length > 0) {
      return ResponseFactory.badRequest('Video exists');
    }
    const video = await youtubeApi.getVideoFromUrl(id);
    if (!video) {
      return ResponseFactory.badRequest('Video not found!');
    }
    video.playlist_id = playlist_id;
    this.videoService.add([video]);

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Delete()
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

  @Post('/replace-name')
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
      const regex = RegExp(search);
      item.name = item.name.replace(regex, replace);
      this.videoService.updateDoc(item);
    });

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }
}
function Add() {
  throw new Error('Function not implemented.');
}
