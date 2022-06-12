import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Observable } from 'rxjs';
import { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway {
  clients: Socket[] = [];

  handleConnection(socket: Socket) {
    this.clients.push(socket);
    //Only keep 2 connection
    if (this.clients.length > 1) {
      const oldSocket = this.clients.shift();
      oldSocket.disconnect();
    }
  }

  handleDisconnect(socket: Socket) {
    const index = this.clients.findIndex((item) => item.id === socket.id);
    if (index > 0) {
      this.clients.splice(index, 1);
    }
  }

  emit(event: string, data: any) {
    this.clients.forEach((socket) => {
      socket.emit(event, data);
    });
  }
}
