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
})
export class MessageComponent {
  // Input properties to pass data from parent components
  message = input<Message>();
  currentUserId = input();
  friendImageUrl = input();
  friendName = input();
  currentUserImageUrl = input();

  /**
   * Checks if the current message is sent by the current user.
   *
   * @returns {boolean} - Returns true if the message's sender_id matches the current user's ID, else false
   */
  isCurrentUserMessage(): boolean {
    return this.message()?.sender_id === this.currentUserId();
  }
}
