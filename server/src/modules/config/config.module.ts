import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { ConvertModule } from '../convert/convert.module';
import { DownloadModule } from '../download/download.module';
import { ConfigController } from './config.controller';

@Module({
  imports: [CommonModule, DownloadModule, ConvertModule],
  controllers: [ConfigController],
  providers: [],
  exports: [],
})
export class ConfigModule {}
