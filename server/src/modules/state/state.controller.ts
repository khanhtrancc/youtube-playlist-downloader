import { Controller, Get } from '@nestjs/common';
import { ResponseFactory } from 'src/helpers/response';
import { NetworkHelper } from '../common/network.helper';
import { StateService } from './state.service';

@Controller('/api/state')
export class StateController {
  constructor(
    private readonly stateService: StateService,
    private readonly networkHelper: NetworkHelper,
  ) {}

  @Get()
  getState() {
    const state = this.stateService.state;

    return ResponseFactory.success(state);
  }
}
