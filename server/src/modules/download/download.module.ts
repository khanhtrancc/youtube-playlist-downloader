import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { StateModule } from '../state/state.module';
import { VideoModule } from '../video/video.module';
import { DownloadController } from './download.controller';
import { DownloadJob } from './download.job';
import { DownloadService } from './download.service';

@Module({
  imports: [CommonModule, PlaylistModule, VideoModule, StateModule],
  controllers: [DownloadController],
  providers: [DownloadService, DownloadJob],
  exports: [DownloadService],
})
export class DownloadModule {}
