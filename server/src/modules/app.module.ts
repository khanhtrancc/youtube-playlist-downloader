import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { ConvertModule } from './convert/convert.module';
import { DownloadModule } from './download/download.module';
import { PlaylistModule } from './playlist/playlist.module';
import { VideoModule } from './video/video.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { StateModule } from './state/state.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), `./public/`),
      renderPath: '/public',
    }),
    PlaylistModule,
    VideoModule,
    CommonModule,
    DownloadModule,
    ConvertModule,
    StateModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}
