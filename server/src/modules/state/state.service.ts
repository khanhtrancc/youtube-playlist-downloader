import { Injectable } from '@nestjs/common';
import _ from 'lodash';

import { config } from 'src/config';
import { ServerActionType, ServerState } from 'src/models/server-state';
import { NetworkHelper } from '../common/network.helper';
import { EventsGateway } from '../common/events.gateway';

@Injectable()
export class StateService {
  public state: ServerState = {
    currentAction: 'none',
    startIndex: 0,
    endIndex: 0,
    progressRate: 0,
    serverAddress: null,
    handlingPlaylistId: null,
  };

  constructor(
    private readonly networkHelper: NetworkHelper,
    private readonly eventsGateway: EventsGateway,
  ) {
    const adds = this.networkHelper.getLocalAddress();
    let add = 'http://localhost:' + config.port;
    if (adds.length > 0) {
      add = `http://${adds[0]}:${config.port}`;
    }
    this.state.serverAddress = add;
  }

  isReadyToNewAction() {
    return this.state.currentAction === 'none';
  }

  changeState(data: {
    currentAction?: ServerActionType;
    startIndex?: number;
    endIndex?: number;
    progressRate?: number;
    serverAddress?: string | null;
    handlingPlaylistId?: string | null;
  }) {
    let isNewState = false;
    Object.keys(data).forEach((key) => {
      if (data[key] !== this.state[key]) {
        this.state[key] = data[key];
        isNewState = true;
      }
    });

    if (isNewState) {
      this.eventsGateway.emit('state', this.state);
    }
  }
}
