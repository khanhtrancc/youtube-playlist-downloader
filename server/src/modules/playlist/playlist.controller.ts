import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Playlist } from 'src/models/playlist';
import { Request } from 'express';
import { PlaylistService } from './playlist.service';
import { ResponseFactory } from 'src/helpers/response';
import { YoutubeApi } from 'src/helpers/youtube';
import { config } from 'src/config';
import { VideoService } from '../video/video.service';
import { FileHelper } from 'src/modules/common/file.helper';
import * as fs from 'fs';

@Controller('/api/playlist')
export class PlaylistController {
  constructor(
    private readonly playlistService: PlaylistService,
    private readonly videoService: VideoService,
    private readonly fileHelper: FileHelper,
  ) {}

  @Get()
  get() {
    const playlists = this.playlistService.getPlaylists({ status: 'active' });
    return ResponseFactory.success(playlists);
  }

  @Post()
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
    this.fileHelper.createPlaylistFolderIfNeed(playlist.id);

    const newList = this.playlistService.getPlaylists({ status: 'active' });
    return ResponseFactory.success(newList);
  }

  @Delete()
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

  @Post('/sync-state')
  async syncState(@Req() req: Request) {
    const { playlist_id } = req.body;
    if (typeof playlist_id !== 'string') {
      return ResponseFactory.badRequest('Missing playlist_id');
    }

    const playlist = this.playlistService.getPlaylistById(playlist_id);
    if (!playlist) {
      return ResponseFactory.badRequest('Invalid playlist_id');
    }

    this.fileHelper.createPlaylistFolderIfNeed(playlist.id);

    const videos = this.videoService.get({ playlist_id });
    const videoBasePath = this.fileHelper.getPathOfFolder(playlist.id, 'video');
    const audioBasePath = this.fileHelper.getPathOfFolder(playlist.id, 'audio');
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
}
