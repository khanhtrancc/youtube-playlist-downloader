import { Injectable } from '@nestjs/common';

const loki = require('lokijs');

@Injectable()
export class DbHelper {
  public db: any;
  public isReady: boolean = false;
  private onReadyCallbacks: (() => any)[] = [];

  constructor() {
    const adapter = new loki.LokiFsAdapter();

    this.db = new loki('data.lokidb', {
      env: 'NODEJS',
      autoload: true,
      autosave: true,
      autoloadCallback: this.init,
      autosaveInterval: 4000,
      adapter,
    });
  }

  private init = () => {
    this.isReady = true;
    while (this.onReadyCallbacks.length > 0) {
      const func = this.onReadyCallbacks.shift();
      func();
    }
  };

  onReady = (handleFunc: () => any) => {
    if (this.isReady) {
      handleFunc();
    } else {
      this.onReadyCallbacks.push(handleFunc);
    }
  };
}
