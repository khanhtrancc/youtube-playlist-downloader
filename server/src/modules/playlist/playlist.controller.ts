import { Controller, Delete, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PlaylistService } from './playlist.service';
import { ResponseFactory } from 'src/helpers/response';
import { YoutubeApi } from 'src/helpers/youtube';
import { config } from 'src/config';
import { VideoService } from '../video/video.service';
import { FileHelper } from 'src/modules/common/file.helper';
import * as fs from 'fs';
import { EventsGateway } from '../common/events.gateway';
import { NetworkHelper } from '../common/network.helper';
import { StateService } from '../state/state.service';

@Controller('/api/playlist')
export class PlaylistController {
  constructor(
    private readonly playlistService: PlaylistService,
    private readonly videoService: VideoService,
    private readonly fileHelper: FileHelper,
    private readonly eventGateway: EventsGateway,
    private readonly networkHelper: NetworkHelper,
    private readonly stateService: StateService,
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

      if (fs.existsSync(videoPath)) {
        videos[i].video_file.status = 'downloaded';
      } else {
        videos[i].video_file.status = 'none';
      }
      videos[i].video_file.description = 'Sync from file';
      videos[i].video_file.retry_count = 0;
      videos[i].video_file.updated_at = Date.now();

      const audioPath = `${audioBasePath}/${videos[i].id}.mp3`;
      if (fs.existsSync(audioPath)) {
        videos[i].audio_file.status = 'converted';
      } else {
        videos[i].audio_file.status = 'none';
      }
      videos[i].audio_file.description = 'Sync from file';
      videos[i].audio_file.retry_count = 0;
      videos[i].audio_file.updated_at = Date.now();

      this.videoService.updateDoc(videos[i]);
    }

    const newList = this.videoService.get({ playlist_id });
    return ResponseFactory.success(newList);
  }

  @Post('/export')
  async export(@Req() req: Request) {
    const { playlist_id, type } = req.body;
    if (typeof playlist_id !== 'string') {
      return ResponseFactory.badRequest('Missing  playlist_id');
    }

    if (!this.stateService.isReadyToNewAction()) {
      return ResponseFactory.badRequest(
        'Cannot export when server does other action: ' +
          this.stateService.state.currentAction,
      );
    }

    this.stateService.changeState({ currentAction: 'exporting' });

    const videos = this.videoService.where({ playlist_id });
    videos.reverse();
    const publicFolderPath = this.fileHelper.getPathOfFolder(
      playlist_id,
      'public',
    );
    const basePath = `${publicFolderPath}/${type}`;
    const zipPath = `${publicFolderPath}/${type}.zip`;
    const serverAdd = this.stateService.state.serverAddress;

    const copyFile = async () => {
      console.log('Start remove old file', basePath);
      this.fileHelper.removeFileOrDirIfExisted(basePath);
      this.fileHelper.removeFileOrDirIfExisted(zipPath);
      this.fileHelper.createFolderIfNeed(basePath);

      const audioBasePath = this.fileHelper.getPathOfFolder(
        playlist_id,
        'audio',
      );
      const videoBasePath = this.fileHelper.getPathOfFolder(
        playlist_id,
        'video',
      );
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        let filePath;
        if (type === 'audio' && video.audio_file.status === 'converted') {
          filePath = `${audioBasePath}/${video.id}.mp3`;
        } else if (
          type === 'video' &&
          video.video_file.status === 'downloaded'
        ) {
          filePath = `${videoBasePath}/${video.id}.mp4`;
        }

        if (filePath) {
          try {
            const newPath = `${basePath}/${('000' + i).slice(-3)}-${
              video.name
            }.${type === 'video' ? 'mp4' : 'mp3'}`;
            fs.copyFileSync(filePath, newPath);
          } catch (err) {
            console.log('Export: copy error', err);
          }
        }
      }
    };

    this.eventGateway.emit('export', 'Test link');
    console.log('START COPY files');
    copyFile().then(() => {
      const folderLink = `http://${serverAdd}${this.fileHelper.getRelativeLinkForPublicPath(
        basePath,
      )}`;
      this.eventGateway.emit('export', folderLink);

      console.group('Copy success', folderLink);
      this.fileHelper
        .zipFolder(basePath, zipPath)
        .then(() => {
          const zipLink = `http://${serverAdd}${this.fileHelper.getRelativeLinkForPublicPath(
            zipPath,
          )}`;
          console.log('Zip success', zipLink);

          this.eventGateway.emit('export-zip', zipLink);
        })
        .catch((err) => {
          console.log('Zip error', err);
        });
    });

    console.log('Finish copy file.Response export');
    return ResponseFactory.success(true);
  }

  @Post('/remove-file')
  async removeFile(@Req() req: Request) {
    const { playlist_id } = req.body;
    if (typeof playlist_id !== 'string') {
      return ResponseFactory.badRequest('Missing  playlist_id');
    }

    const videos = this.videoService.where({ playlist_id });
    videos.reverse();
    const basePath = this.fileHelper.getBasePathForPlaylist(playlist_id);
    this.fileHelper.removeFileOrDirIfExisted(basePath);

    return ResponseFactory.success(true);
  }
}
