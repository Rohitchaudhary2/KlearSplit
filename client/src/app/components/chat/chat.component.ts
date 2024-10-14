// chat.component.ts
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../shared/socket.service'; // Adjust the path as necessary
import { TokenService } from '../auth/token.service'; // Adjust the path as necessary
import { Message, MessageResponse } from './message.model';
import { API_URLS } from '../../constants/api-urls';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  imports: [FormsModule],
})
export class ChatComponent implements OnInit, OnDestroy {
  conversationId = '08d503f3-f739-4ba3-9fda-f60981b721f8'; // Replace with your actual conversation ID
  messages: Message[] = []; // Array to store messages
  messageInput = ''; // Bind to the input field
  private socketService = inject(SocketService); // Inject the SocketService
  private tokenService = inject(TokenService); // Inject the TokenService
  private http = inject(HttpClient);
  private readonly getMessagesUrl = API_URLS.getMessages;

  ngOnInit(): void {
    this.http
      .get<MessageResponse>(`${this.getMessagesUrl}/${this.conversationId}`, {
        withCredentials: true,
      })
      .subscribe({
        next: (messages) => {
          this.messages = messages.data;
        },
      });
    // Join the room for the current conversation
    this.socketService.joinRoom(this.conversationId);

    // Listen for new messages from the server
    this.socketService.onNewMessage((message: Message) => {
      this.messages.push(message); // Add new message to the array
    });
  }

  // Function to send a message
  sendMessage(): void {
    if (this.messageInput.trim()) {
      const messageData = {
        conversation_id: this.conversationId,
        sender_id: this.tokenService.getUserId(), // Replace with actual sender ID
        message: this.messageInput,
      };
      this.socketService.sendMessage(messageData); // Send the message via the service
      this.messageInput = ''; // Clear the input field after sending
    }
  }

  ngOnDestroy(): void {
    this.socketService.leaveRoom(this.conversationId); // Leave the room on destroy
    this.socketService.disconnect(); // Optionally disconnect from the socket
  }
}
