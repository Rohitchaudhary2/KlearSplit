import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, Subject, switchMap } from 'rxjs';
import { Friend } from '../friend.model';

@Component({
  selector: 'app-add-friend',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './add-friend.component.html',
  styleUrl: './add-friend.component.css',
})
export class AddFriendComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AddFriendComponent>);
  users = signal<Friend[]>([]);
  searchSubject = new Subject<string>();
  loading = signal(false);
  private httpClient = inject(HttpClient);

  searchInput = signal('');

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(500),
        switchMap((query) => this.searchUsers(query)),
      )
      .subscribe((users) => {
        this.users.set(users);
        this.loading.set(false);
      });
  }

  onSearchInputChange() {
    this.loading.set(true);
    this.searchSubject.next(this.searchInput());
  }

  searchUsers(query: string) {
    return this.httpClient.get<Friend[]>(
      `http://localhost:3000/api/users?search=${query}`,
    );
  }

  selectUser(user: Friend) {
    this.searchInput.set(user.data[0].email); // user has a 'email' property
    this.users.set([]); // Clear the user list
  }

  onAdd(): void {
    this.dialogRef.close({ email: this.searchInput() });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
