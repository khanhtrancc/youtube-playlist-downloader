import { Controller, Get } from '@nestjs/common';
import { ResponseFactory } from 'src/helpers/response';
import { config } from 'src/config';
import { FileHelper } from 'src/modules/common/file.helper';
import { NetworkHelper } from '../common/network.helper';
import { DownloadService } from '../download/download.service';
import { ConvertService } from '../convert/convert.service';

@Controller('/api/config')
export class ConfigController {
  constructor(
    private readonly fileHelper: FileHelper,
    private readonly networkHelper: NetworkHelper,
    private readonly downloadService: DownloadService,
    private readonly convertService: ConvertService,
  ) {}

  @Get()
  getServerAddress() {
    const adds = this.networkHelper.getLocalAddress();
    let add = 'http://localhost:' + config.port;
    console.log('Address', adds);
    if (adds.length > 0) {
      add = `http://${adds[0]}:${config.port}`;
    }
    const res = {
      serverAddress: add,
      isDownloading: this.downloadService.getCurrentThread() > 0,
      isConverting: this.convertService.getCurrentThread() > 0,
    };
    return ResponseFactory.success(res);
  }
}
