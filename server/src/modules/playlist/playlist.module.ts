import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { StateModule } from '../state/state.module';
import { VideoModule } from '../video/video.module';
import { PlaylistController } from './playlist.controller';
import { PlaylistService } from './playlist.service';

@Module({
  imports: [CommonModule, StateModule , VideoModule],
  controllers: [PlaylistController],
  providers: [PlaylistService],
  exports: [PlaylistService],
})
export class PlaylistModule {}
