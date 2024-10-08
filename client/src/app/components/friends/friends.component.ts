import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddFriendComponent } from './add-friend/add-friend.component';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent {
  private dialog = inject(MatDialog);
  private httpClient = inject(HttpClient);
  searchTerm = signal('');

  private toastr = inject(ToastrService);
  private friendRequests = signal([
    {
      image: 'https://picsum.photos/50',
      name: 'Rohit',
      conversation_id: 'gshksdksd',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ritik Palial',
      conversation_id: 'gsjksdksd',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ranveer Singh',
      conversation_id: 'gshksdksdsx',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Vikas Choudhary',
      conversation_id: 'gshksdksd12',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Sachin',
      conversation_id: 'gshksd5ksd',
    },
  ]);

  requests = signal(this.friendRequests());

  friends = signal([
    {
      image: 'https://picsum.photos/50',
      name: 'Rohit',
      balanceAmount: 1000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ritik Palial',
      balanceAmount: -1000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ranveer Singh',
      balanceAmount: 10000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Vikas Choudhary',
      balanceAmount: -2000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Sachin',
      balanceAmount: 1000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Harsh',
      balanceAmount: 10000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Harman',
      balanceAmount: -2000,
      conversation_id: 'gshksd5k8d',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ravneet Singh',
      balanceAmount: 1000,
      conversation_id: 'gshksd5k8d',
    },
  ]);

  friendList = signal(this.friends());

  onAddFriendClick() {
    const dialogRef = this.dialog.open(AddFriendComponent, {
      width: '500px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.httpClient
          .post('http://localhost:3000/api/friends/addfriend', result, {
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

  onSearchChange() {
    const regex = new RegExp(this.searchTerm(), 'i'); // Case-insensitive search
    this.requests.set(
      this.friendRequests().filter((user) => regex.test(user.name)),
    );
    this.friendList.set(this.friends().filter((user) => regex.test(user.name)));
  }

  onAccept(id: string) {
    this.friendList().unshift({
      ...this.requests().filter((request) => request.conversation_id === id)[0],
      balanceAmount: 0,
    });
    this.requests.set(
      this.requests().filter((request) => request.conversation_id !== id),
    );
  }
}
