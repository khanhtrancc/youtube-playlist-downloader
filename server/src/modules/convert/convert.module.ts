import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { PlaylistService } from '../playlist/playlist.service';
import { VideoModule } from '../video/video.module';
import { VideoService } from '../video/video.service';
import { ConvertController } from './convert.controller';
import { ConvertJob } from './convert.job';
import { ConvertService } from './convert.service';

@Module({
  imports: [CommonModule, PlaylistModule, VideoModule],
  controllers: [ConvertController],
  providers: [ConvertService, ConvertJob],
  exports: [ConvertService],
})
export class ConvertModule {}
