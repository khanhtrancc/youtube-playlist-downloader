import { Module } from '@nestjs/common';
import { FileHelper } from 'src/modules/common/file.helper';
import { EventsGateway } from './events.gateway';
import { DbHelper } from './db.helper';
import { NetworkHelper } from './network.helper';
@Module({
  imports: [],
  controllers: [],
  providers: [FileHelper, DbHelper, EventsGateway, NetworkHelper],
  exports: [FileHelper, DbHelper, EventsGateway, NetworkHelper],
})
export class CommonModule {}
