import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
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

  ngOnDestroy(): void {
    if (this.selectedUser()) {
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
      this.socketService.disconnect();
    }
  }

  onSelectUser(friend: FriendData) {
    if (this.selectedUser()) {
      // Leave the previous room
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
      // Remove the existing 'onNewMessage' listener
      this.socketService.removeNewMessageListener();
    }

    this.selectedUser.set(friend);

    // Fetch messages for the newly selected user
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

    // Join the room for the new conversation
    this.socketService.joinRoom(this.selectedUser()!.conversation_id);

    // Listen for new messages from the server for the new room
    this.socketService.onNewMessage((message: messageData) => {
      this.messages.set([...this.messages(), message]);
      this.cdr.detectChanges();
      this.scrollToBottom();
    });
  }

  scrollToBottom() {
    if (this.messageContainer()) {
      const container = this.messageContainer()?.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  sendMessage(): void {
    if (this.messageInput.trim()) {
      const messageData = {
        conversation_id: this.selectedUser()!.conversation_id,
        sender_id: this.tokenService.getUserId(),
        message: this.messageInput,
      };
      this.socketService.sendMessage(messageData);
      this.messageInput = '';
    }
  }

  viewExpense(id: string) {
    return id;
  }

  getArchiveStatus(): string {
    const user = this.selectedUser();
    if (
      user?.archival_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.archival_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.archival_status === 'FRIEND2')
    ) {
      return 'Unarchived';
    }
    return 'Archived';
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
      return 'Unblocked';
    }
    return 'Blocked';
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
                progressBar: true,
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
            err?.error?.message || `Settle up before this action!`,
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
