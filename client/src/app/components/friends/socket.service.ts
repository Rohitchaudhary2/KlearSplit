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

  /**
   * Joins a room with a specific conversation ID.
   * This allows the client to listen to messages within the specified conversation.
   *
   * @param conversationId - The ID of the conversation room to join
   */
  joinRoom(conversationId: string): void {
    this.socket.emit('joinRoom', conversationId); // Emit 'joinRoom' event to the server
  }

  /**
   * Sends a message to the server for a specific conversation.
   * The message is emitted through the 'sendMessage' event.
   *
   * @param messageData - The message data object containing conversation ID, sender ID, and message content
   */
  sendMessage(messageData: Partial<MessageData>): void {
    this.socket.emit('sendMessage', messageData);
  }

  /**
   * Listens for new messages from the server.
   * The callback function is called every time a new message is received.
   *
   * @param callback - The function to call with the new message data when a new message arrives
   */
  onNewMessage(callback: (message: MessageData) => void): void {
    this.socket.on('newMessage', callback); // Listen for 'newMessage' events
  }

  /**
   * Disconnects from the socket server.
   */
  disconnect(): void {
    this.socket.disconnect(); // Disconnect the socket
  }

  /**
   * Leaves the specified conversation room.
   * This removes the client from receiving further messages in the room.
   *
   * @param conversationId - The ID of the conversation room to leave
   */
  leaveRoom(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('leaveRoom', conversationId);
    }
  }

  /**
   * Removes the listener for new messages.
   * This is called when user goes from one conversation to the other.
   */
  removeNewMessageListener(): void {
    this.socket.off('newMessage');
  }
}
