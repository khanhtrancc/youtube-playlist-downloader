import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Playlist } from 'src/models/playlist';
import { Request } from 'express';
import { PlaylistService } from './playlist.service';
import { ResponseFactory } from 'src/helpers/response';
import { db } from 'src/helpers/db';
import { YoutubeApi } from 'src/helpers/youtube';
import { config } from 'src/config';
import { VideoService } from '../video/video.service';
import { file } from 'src/helpers/file';

@Controller()
export class PlaylistController {
  constructor(
    private readonly playlistService: PlaylistService,
    private readonly videoService: VideoService,
  ) {}

  @Get('/api/playlist')
  get() {
    const playlists = this.playlistService.getPlaylists({ status: 'active' });
    return ResponseFactory.success(playlists);
  }

  @Post('/api/playlist')
  async add(@Req() req: Request) {
    const { id } = req.body;
    if (!id) {
      return ResponseFactory.badRequest('Missing Playlist Id (id)');
    }

    const existedPlaylists = this.playlistService.getPlaylists({ id });
    if (existedPlaylists.length > 0) {
      return ResponseFactory.badRequest('Playlist existed');
    }

    const youtubeApi = new YoutubeApi(config.googleApiAccessToken);
    const playlist = await youtubeApi.getPlaylistInfo(id);
    if (!playlist) {
      return ResponseFactory.badRequest('Playlist Id (id) invalid');
    }

    const videos = await youtubeApi.getVideosOfPlaylist(id);
    this.videoService.add(videos);
    playlist.total_video = videos.length;

    this.playlistService.addPlaylist(playlist);
    file.createPlaylistFolderIfNeed(playlist);

    const newList = this.playlistService.getPlaylists({ status: 'active' });
    return ResponseFactory.success(newList);
  }

  @Delete('/api/playlist')
  async delete(@Req() req: Request) {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return ResponseFactory.badRequest('Missing Playlist Id (id)');
    }
    const existedPlaylists = this.playlistService.getPlaylists({ id });
    if (existedPlaylists.length > 0) {
      const playlist = existedPlaylists[0];
      this.videoService.deleteVideosOfPlaylist(id);
      this.playlistService.delete(id);
      //todo: Remove videos and files
    }

    const newList = this.playlistService.getPlaylists({ status: 'active' });
    return ResponseFactory.success(newList);
  }
}
