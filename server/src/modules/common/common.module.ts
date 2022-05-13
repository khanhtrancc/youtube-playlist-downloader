import { Module } from '@nestjs/common';
import { FileHelper } from 'src/modules/common/file.helper';
import { EventsGateway } from './events.gateway';
import { DbHelper } from './db.helper';
@Module({
  imports: [],
  controllers: [],
  providers: [FileHelper, DbHelper, EventsGateway],
  exports: [FileHelper, DbHelper, EventsGateway],
})
export class CommonModule {}
