import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { StateModule } from '../state/state.module';
import { VideoModule } from '../video/video.module';
import { ConvertController } from './convert.controller';
import { ConvertJob } from './convert.job';
import { ConvertService } from './convert.service';

@Module({
  imports: [CommonModule, PlaylistModule, VideoModule, StateModule],
  controllers: [ConvertController],
  providers: [ConvertService, ConvertJob],
  exports: [ConvertService],
})
export class ConvertModule {}
