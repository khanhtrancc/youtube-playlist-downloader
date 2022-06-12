import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { StateController } from './state.controller';
import { StateService } from './state.service';

@Module({
  imports: [CommonModule],
  controllers: [StateController],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
