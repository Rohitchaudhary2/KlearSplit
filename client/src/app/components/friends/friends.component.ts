import { Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AddFriendComponent } from './add-friend/add-friend.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent {
  private dialog = inject(MatDialog);
  friendRequests = signal([
    {
      image: 'https://picsum.photos/50',
      name: 'Rohit',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ritik Palial',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ranveer Singh',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Vikas Choudhary',
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Sachin',
    },
  ]);

  friends = signal([
    {
      image: 'https://picsum.photos/50',
      name: 'Rohit',
      balanceAmount: 1000,
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ritik Palial',
      balanceAmount: -1000,
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Ranveer Singh',
      balanceAmount: 10000,
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Vikas Choudhary',
      balanceAmount: -2000,
    },
    {
      image: 'https://picsum.photos/50',
      name: 'Sachin',
      balanceAmount: 1000,
    },
  ]);

  onAddFriendClick() {
    const dialogRef = this.dialog.open(AddFriendComponent, {
      width: '500px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // this.authService.verifyForgotPasswordUser(result).subscribe({
        //   next: () => {
        //     this.openOtpDialog(result);
        //   },
        // });
      }
    });
  }
}
