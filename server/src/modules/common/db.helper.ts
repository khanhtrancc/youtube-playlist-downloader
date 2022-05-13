import { Injectable } from '@nestjs/common';

const loki = require('lokijs');

@Injectable()
export class DbHelper {
  public db: any;
  constructor() {
    const adapter = new loki.LokiFsAdapter();

    this.db = new loki('data.lokidb', {
      env: "NODEJS",
      autoload: true,
      autosave: true,
      autosaveInterval: 4000,
      adapter,
    });
  }
}
