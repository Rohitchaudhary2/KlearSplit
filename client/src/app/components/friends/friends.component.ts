import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddFriendComponent } from './add-friend/add-friend.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { API_URLS } from '../../constants/api-urls';
import { Friend, FriendData } from './friend.model';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent implements OnInit {
  private dialog = inject(MatDialog);
  private httpClient = inject(HttpClient);
  searchTerm = signal('');
  tokenService = inject(TokenService);
  private authService = inject(AuthService);
  user_name = `${this.authService.currentUser()?.first_name} ${this.authService.currentUser()?.last_name}`;

  private toastr = inject(ToastrService);

  private friendRequests = signal<FriendData[]>([]);

  requests = signal(this.friendRequests());

  private friends = signal<FriendData[]>([]);

  friendList = signal(this.friends());

  selectedUser = signal<FriendData | undefined>(undefined);

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

  onAddFriendClick() {
    const dialogRef = this.dialog.open(AddFriendComponent, {
      width: '500px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.httpClient
          .post(API_URLS.appFriend, result, {
            withCredentials: true,
          })
          .subscribe({
            next: () => {
              this.toastr.success('Request Sent Successfully', 'Success', {
                timeOut: 3000,
              });
              this.fetchFriendRequests();
            },
            error: (err) => {
              this.toastr.error(
                err?.error?.message || 'Request Failed!',
                'Error',
                {
                  timeOut: 3000,
                },
              );
            },
          });
      }
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
            {
              timeOut: 3000,
            },
          );
        },
      });
  }

  onWithdrawRequest(id: string) {
    this.httpClient
      .delete(`${API_URLS.withdrawRequest}/${id}`, { withCredentials: true })
      .subscribe({
        next: () => {
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
            {
              timeOut: 3000,
            },
          );
        },
      });
  }

  setSelectedUser(friend: FriendData) {
    this.selectedUser.set(friend);
  }

  viewExpense(id: string) {
    //send conversation id to backend to get all expenses.
    return id;
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
          this.toastr.success(`${type} Successfully`, 'Success', {
            timeOut: 3000,
          });
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
