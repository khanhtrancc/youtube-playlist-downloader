import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PlaylistService } from '../playlist/playlist.service';
import { VideoService } from '../video/video.service';
import { DownloadController } from './download.controller';
import { DownloadJob } from './download.job';
import { DownloadService } from './download.service';

@Module({
  imports: [CommonModule],
  controllers: [DownloadController],
  providers: [DownloadService, VideoService, PlaylistService, DownloadJob],
  exports: [],
})
export class DownloadModule {}
