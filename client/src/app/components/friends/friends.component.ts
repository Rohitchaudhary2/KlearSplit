import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddFriendComponent } from './add-friend/add-friend.component';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { API_URLS } from '../../constants/api-urls';
import { Friend, FriendData } from './friend.model';

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

  private toastr = inject(ToastrService);

  private friendRequests = signal<FriendData[]>([]);

  requests = signal(this.friendRequests());

  private friends = signal<FriendData[]>([]);

  friendList = signal(this.friends());

  ngOnInit() {
    const params = new HttpParams().set('status', 'PENDING');

    this.httpClient
      .get<Friend>(`${API_URLS.getFriends}`, { params, withCredentials: true })
      .subscribe({
        next: (response) => {
          this.friendRequests.set(response.data);
        },
      });
  }

  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Rohit',
  //     balanceAmount: 1000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Ritik Palial',
  //     balanceAmount: -1000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Ranveer Singh',
  //     balanceAmount: 5000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Vikas Choudhary',
  //     balanceAmount: -2000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Sachin',
  //     balanceAmount: 1000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Harsh',
  //     balanceAmount: 5000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Harman',
  //     balanceAmount: -2000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  //   {
  //     image: 'https://picsum.photos/50',
  //     name: 'Ravneet Singh',
  //     balanceAmount: 1000,
  //     conversation_id: 'gshksd5k8d',
  //   },
  // ]);

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

  onAccept(id: string) {
    this.friendList().unshift({
      ...this.requests().filter((request) => request.conversation_id === id)[0],
      balance_amount: '0',
    });
    this.requests.set(
      this.requests().filter((request) => request.conversation_id !== id),
    );
  }
}

// friends = signal([
//   {
//   conversation_id: "657hajsgjhvna",
//   status: "PENDING",
//   balance_amount: "0",
//   archival_status: "NONE",
//   block_status: "NONE",
//   friend: {
//     user_id: "gjtguye454",
//     first_name: "string",
//     last_name: "string",
//     email: "gdyjge@gsja.shf",
//     image_url: "string",
//   }
// }
//   ])
