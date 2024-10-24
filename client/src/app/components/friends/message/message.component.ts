import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

interface Message {
  sender_id: string;
  message: string;
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [NgClass],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css',
})
export class MessageComponent {
  message = input<Message>();
  currentUserId = input();
  friendImageUrl = input();
  friendName = input();
  currentUserImageUrl = input();

  isCurrentUserMessage(): boolean {
    return this.message()?.sender_id === this.currentUserId();
  }
}
