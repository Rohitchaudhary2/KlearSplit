import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  effect,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URLS } from '../../constants/api-urls';
import { FriendData, messageData } from './friend.model';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FriendsListComponent } from './friends-list/friends-list.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [FormsModule, FriendsListComponent],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent {
  messageContainer = viewChild<ElementRef>('messageContainer');
  private httpClient = inject(HttpClient);

  private toastr = inject(ToastrService);

  tokenService = inject(TokenService);
  private authService = inject(AuthService);
  user = this.authService.currentUser();
  user_name = `${this.authService.currentUser()?.first_name} ${this.authService.currentUser()?.last_name}`;

  selectedUser = signal<FriendData | undefined>(undefined);

  messages = signal<messageData[]>([
    {
      message_id: 'sgdhgs',
      conversation_id: 'sghsd',
      sender_id: 'saghdf',
      message:
        'lorem jaghkuasgd asgdiuasdgas digaisd iusgds disdsakd guisg dsdiusjdf usdjsbdvasd fa ',
      is_read: false,
    },
    {
      message_id: 'sgdjjhgs',
      conversation_id: 'sghsd',
      sender_id: '62975368-2292-4112-9ca0-07e2581192ff',
      message:
        'lorem jaghkuasgd asgdiuasdgas digaisd iusgds disdsakd guisg dsdiusjdf usdjsbdvasd fa ',
      is_read: false,
    },
    {
      message_id: 'sgdjhgs',
      conversation_id: 'sghsd',
      sender_id: 'saghdf',
      message: 'hello kjhdsiuhj dgauksdj,k',
      is_read: false,
    },
    {
      message_id: 'sgdjhuhgs',
      conversation_id: 'sghsd',
      sender_id: '62975368-2292-4112-9ca0-07e2581192ff',
      message:
        'lorem jaghkuasgd asgdiuasdgas digaisd iusgds disdsakd guisg dsdiusjdf usdjsbdvasd fa ',
      is_read: false,
    },
    {
      message_id: 'sgdmhgjjhgs',
      conversation_id: 'sghsd',
      sender_id: 'saghdf',
      message: 'hello jksadb sabdmn s',
      is_read: false,
    },
  ]);

  onSelectUser(friend: FriendData) {
    this.selectedUser.set(friend);
  }

  temp = effect(() => {
    if (this.selectedUser()) {
      this.scrollToBottom();
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
}
