import { Module } from '@nestjs/common';
import { PlaylistController } from './playlist/playlist.controller';
import { PlaylistService } from './playlist/playlist.service';
import { VideoController } from './video/video.controller';
import { VideoService } from './video/video.service';

@Module({
  imports: [],
  controllers: [PlaylistController, VideoController],
  providers: [PlaylistService, VideoService],
})
export class AppModule {}
