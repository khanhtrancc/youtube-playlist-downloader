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
    console.log('New connection', socket.handshake.url, socket.id);
    this.clients.push(socket);
  }

  handleDisconnect(socket: Socket) {
    console.log('Disconnnect connection', socket.handshake.url, socket.id);
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
