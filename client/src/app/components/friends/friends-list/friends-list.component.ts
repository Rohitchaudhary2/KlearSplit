import {
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AddFriendComponent } from '../add-friend/add-friend.component';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Friend, FriendData } from '../friend.model';
import { API_URLS } from '../../../constants/api-urls';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './friends-list.component.html',
  styleUrl: '../friends.component.css',
})
export class FriendsListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private httpClient = inject(HttpClient);
  searchTerm = signal('');

  private friendRequests = signal<FriendData[]>([]);
  requests = signal(this.friendRequests());

  private friends = signal<FriendData[]>([]);
  friendList = signal(this.friends());

  selectedUser = output<FriendData | undefined>();

  balanceAmount = input<string>();

  fetchFriendRequests() {
    const params = new HttpParams().set('status', 'PENDING');

    this.httpClient
      .get<Friend>(`${API_URLS.getFriends}`, { params, withCredentials: true })
      .subscribe({
        next: (response) => {
          this.friendRequests.set(response.data);
          this.requests.set(this.friendRequests());
        },
      });
  }

  ngOnInit() {
    this.fetchFriendRequests();

    const params = new HttpParams().set('status', 'ACCEPTED');
    this.httpClient
      .get<Friend>(`${API_URLS.getFriends}`, { params, withCredentials: true })
      .subscribe({
        next: (response) => {
          this.friends.set(response.data);
          this.friendList.set(this.friends());
        },
      });
  }

  getBalanceAsNumber(balanceAmount: string): number {
    return parseFloat(balanceAmount);
  }

  onSearchChange() {
    const regex = new RegExp(this.searchTerm(), 'i'); // Case-insensitive search
    this.requests.set(
      this.friendRequests().filter((user) => regex.test(user.friend.email)),
    );
    this.friendList.set(
      this.friends().filter((user) => regex.test(user.friend.email)),
    );
  }

  onAddFriendClick() {
    const dialogRef = this.dialog.open(AddFriendComponent, {
      width: '500px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.httpClient
          .post(API_URLS.addFriend, result, {
            withCredentials: true,
          })
          .subscribe({
            next: () => {
              this.toastr.success('Request Sent Successfully', 'Success', {
                timeOut: 3000,
              });
              this.fetchFriendRequests();
            },
          });
      }
    });
  }

  onAcceptReject(id: string, status: string) {
    this.httpClient
      .patch(
        `${API_URLS.acceptRejectRequest}/${id}`,
        { status },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          this.toastr.success(`Request ${status} Successfully`, 'Success', {
            timeOut: 3000,
          });
          if (status === 'ACCEPTED') {
            this.friendList().unshift({
              ...this.requests().filter(
                (request) => request.conversation_id === id,
              )[0],
              balance_amount: '0',
            });
            this.requests.set(
              this.requests().filter(
                (request) => request.conversation_id !== id,
              ),
            );
          } else {
            this.requests.set(
              this.requests().filter(
                (request) => request.conversation_id !== id,
              ),
            );
          }
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || `${status} Request Failed!`,
            'Error',
          );
        },
      });
  }

  onWithdrawRequest(id: string) {
    this.httpClient
      .delete(`${API_URLS.withdrawRequest}/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.onSelectUser(undefined);
          this.toastr.success(`Request deleted Successfully`, 'Success', {
            timeOut: 3000,
          });
          this.requests.set(
            this.requests().filter((request) => request.conversation_id !== id),
          );
        },
        error: (err) => {
          this.toastr.error(
            err?.error?.message || `Deletion Request Failed!`,
            'Error',
          );
        },
      });
  }

  onSelectUser(friend: FriendData | undefined) {
    this.selectedUser.emit(friend);
  }
}
