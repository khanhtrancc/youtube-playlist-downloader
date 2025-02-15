import { Injectable } from '@nestjs/common';
import { networkInterfaces } from 'os';

@Injectable()
export class NetworkHelper {
  private localAddresses: string[] = [];

  getLocalAddress() {
    if (this.localAddresses.length > 0) {
      return this.localAddresses;
    }

    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4' && !net.internal) {
          if (!results[name]) {
            results[name] = [];
          }
          results[name].push(net.address);
          this.localAddresses.push(net.address);
        }
      }
    }
    return this.localAddresses;
  }
}
