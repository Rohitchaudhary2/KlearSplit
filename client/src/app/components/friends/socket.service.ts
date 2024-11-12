import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment'; // Make sure this path is correct
import { MessageData } from './friend.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // Initialize the socket connection using the environment's socket URL
    this.socket = io(environment.socketUrl);
  }

  joinRoom(conversationId: string): void {
    this.socket.emit('joinRoom', conversationId);
  }

  sendMessage(MessageData: {
    conversation_id: string | null;
    sender_id: string | null;
    message: string | null;
  }): void {
    this.socket.emit('sendMessage', MessageData);
  }

  onNewMessage(callback: (message: MessageData) => void): void {
    this.socket.on('newMessage', callback); // Listen for 'newMessage' events
  }

  disconnect(): void {
    this.socket.disconnect(); // Disconnect the socket
  }

  leaveRoom(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('leaveRoom', conversationId);
    }
  }

  removeNewMessageListener(): void {
    this.socket.off('newMessage');
  }
}
