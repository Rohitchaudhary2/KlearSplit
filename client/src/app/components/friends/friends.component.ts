import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  effect,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URLS } from '../../constants/api-urls';
import { FriendData, message, messageData } from './friend.model';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FriendsListComponent } from './friends-list/friends-list.component';
import { SocketService } from './socket.service';
import { MatDialog } from '@angular/material/dialog';
import { FriendsExpenseComponent } from './friends-expense/friends-expense.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [FormsModule, FriendsListComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent implements OnDestroy {
  messageContainer = viewChild<ElementRef>('messageContainer');
  private httpClient = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);

  tokenService = inject(TokenService);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private readonly getMessagesUrl = API_URLS.getMessages;
  user = this.authService.currentUser();
  user_name = `${this.authService.currentUser()?.first_name} ${this.authService.currentUser()?.last_name}`;

  selectedUser = signal<FriendData | undefined>(undefined);
  messageInput = '';

  messages = signal<messageData[]>([]);

  // Function to send a message
  sendMessage(): void {
    if (this.messageInput.trim()) {
      const messageData = {
        conversation_id: this.selectedUser()!.conversation_id,
        sender_id: this.tokenService.getUserId(), // Replace with actual sender ID
        message: this.messageInput,
      };
      this.socketService.sendMessage(messageData); // Send the message via the service
      this.messageInput = ''; // Clear the input field after sending
    }
  }

  ngOnDestroy(): void {
    if (this.selectedUser()) {
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id); // Leave the room on destroy
      this.socketService.disconnect();
    }
  }

  onSelectUser(friend: FriendData) {
    this.selectedUser.set(friend);
  }

  temp = effect(() => {
    if (this.selectedUser()) {
      this.httpClient
        .get<message>(
          `${this.getMessagesUrl}/${this.selectedUser()?.conversation_id}`,
          {
            withCredentials: true,
          },
        )
        .subscribe({
          next: (messages) => {
            this.messages.set(messages.data);
            this.cdr.detectChanges();
            this.scrollToBottom();
          },
        });
      // Join the room for the current conversation
      // this.socketService.joinRoom(this.selectedUser()!.conversation_id);
      // Listen for new messages from the server
      this.socketService.onNewMessage((message: messageData) => {
        this.messages.set([...this.messages(), message]);
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    }
  });

  scrollToBottom() {
    if (this.messageContainer()) {
      const container = this.messageContainer()?.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  viewExpense(id: string) {
    //send conversation id to backend to get all expenses.
    return id;
  }

  getArchiveStatus(): string {
    const user = this.selectedUser();
    if (
      user?.archival_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.archival_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.archival_status === 'FRIEND2')
    ) {
      return 'Unarchived'; // Use 'unblocked' when you want to unblock
    }
    return 'Archived'; // Default case
  }

  getArchiveLabel(): string {
    const user = this.selectedUser();
    return user?.archival_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.archival_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.archival_status === 'FRIEND2')
      ? 'Unarchive'
      : 'Archive';
  }

  getBlockStatus(): string {
    const user = this.selectedUser();
    if (
      user?.block_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.block_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.block_status === 'FRIEND2')
    ) {
      return 'Unblocked'; // Use 'unblocked' when you want to unblock
    }
    return 'Blocked'; // Default case
  }

  getBlockLabel(): string {
    const user = this.selectedUser();
    return user?.block_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.block_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.block_status === 'FRIEND2')
      ? 'Unblock'
      : 'Block';
  }

  archiveBlock(id: string, type: string) {
    this.httpClient
      .patch(
        `${API_URLS.archiveBlockRequest}/${id}`,
        { type },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          if (type === 'archived') {
            this.toastr.success(
              `${this.getArchiveStatus()} Successfully`,
              'Success',
              {
                timeOut: 3000,
              },
            );
          } else {
            this.toastr.success(
              `${this.getBlockStatus()} Successfully`,
              'Success',
              {
                timeOut: 3000,
              },
            );
          }
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || `Deletion Request Failed!`,
            'Error',
            {
              timeOut: 3000,
            },
          );
        },
      });
  }

  openAddExpenseDialog() {
    const dialogRef = this.dialog.open(FriendsExpenseComponent, {
      width: '500px',
      data: [this.user, this.selectedUser()],
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.httpClient
          .post(
            `${API_URLS.addExpense}/${this.selectedUser()?.conversation_id}`,
            result,
            {
              withCredentials: true,
            },
          )
          .subscribe({
            next: () => {
              this.toastr.success('Expense Created successfully', 'Success', {
                timeOut: 3000,
              });
            },
            error: (err) => {
              this.toastr.error(
                err?.error?.message || 'Expense Creation failed!',
                'Error',
                { timeOut: 3000 },
              );
            },
          });
      }
    });
  }
}
