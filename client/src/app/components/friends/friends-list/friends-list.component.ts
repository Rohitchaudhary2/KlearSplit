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
import { HttpParams } from '@angular/common/http';
import { FriendData } from '../friend.model';
import { CurrencyPipe } from '@angular/common';
import { FriendsService } from '../friends.service';
import { ConfirmationDialogComponent } from '../../confirmation-dialog/confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule, TooltipPosition } from '@angular/material/tooltip';

@Component({
  selector: 'app-friends-list',
  standalone: true,
  imports: [FormsModule, CurrencyPipe, MatIconModule, MatTooltipModule],
  templateUrl: './friends-list.component.html',
  styleUrl: '../friends.component.css',
})
export class FriendsListComponent implements OnInit {
  private dialog = inject(MatDialog);
  private toastr = inject(ToastrService);
  private friendsService = inject(FriendsService);
  searchTerm = signal('');
  positionOptions: TooltipPosition[] = [
    'after',
    'before',
    'above',
    'below',
    'left',
    'right',
  ];

  private friendRequests = signal<FriendData[]>([]);
  requests = signal(this.friendRequests());

  private friends = signal<FriendData[]>([]);
  friendList = signal(this.friends());

  selectedUser = output<FriendData | undefined>();

  balanceAmount = input<string>();

  fetchFriendRequests() {
    const params = new HttpParams().set('status', 'PENDING');
    this.friendsService.getFriends(params).subscribe({
      next: (response) => {
        this.friendRequests.set(response.data);
        this.requests.set(this.friendRequests());
      },
    });
  }

  ngOnInit() {
    this.fetchFriendRequests();

    const params = new HttpParams().set('status', 'ACCEPTED');
    this.friendsService.getFriends(params).subscribe({
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
        this.friendsService.addFriend(result).subscribe({
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
    this.friendsService.acceptRejectRequest(id, status).subscribe({
      next: () => {
        this.toastr.success(`Request ${status} Successfully`, 'Success', {
          timeOut: 3000,
        });
        if (status === 'ACCEPTED') {
          this.friendList().unshift({
            ...this.requests().filter(
              (request) => request.conversation_id === id,
            )[0],
          });
        }
        this.requests.set(
          this.requests().filter((request) => request.conversation_id !== id),
        );
      },
    });
  }

  onWithdrawRequest(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: 'Are you sure you want to withdraw this request?',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.friendsService.withdrawRequest(id).subscribe({
          next: () => {
            this.onSelectUser(undefined);
            this.toastr.success(`Request deleted Successfully`, 'Success', {
              timeOut: 3000,
            });
            this.requests.set(
              this.requests().filter(
                (request) => request.conversation_id !== id,
              ),
            );
          },
        });
      }
    });
  }

  onSelectUser(friend: FriendData | undefined) {
    this.selectedUser.emit(friend);
  }
}
