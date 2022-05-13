import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { DownloadModule } from './download/download.module';
import { PlaylistModule } from './playlist/playlist.module';
import { VideoModule } from './video/video.module';

@Module({
  imports: [
    PlaylistModule,
    VideoModule,
    CommonModule,
    DownloadModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
