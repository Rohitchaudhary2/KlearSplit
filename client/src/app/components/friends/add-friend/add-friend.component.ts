import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, of, Subject, switchMap } from 'rxjs';
import { SearchedUser, User } from '../friend.model';
import { API_URLS } from '../../../constants/api-urls';

@Component({
  selector: 'app-add-friend',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './add-friend.component.html',
  styleUrl: './add-friend.component.css',
})
export class AddFriendComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AddFriendComponent>);
  users = signal<User[]>([]);
  searchSubject = new Subject<string>();
  loading = signal(false);
  private httpClient = inject(HttpClient);

  searchInput = signal('');
  selectedUser = signal<User | undefined>(undefined);

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(500),
        switchMap((query) => {
          if (query.trim() === '') {
            this.loading.set(false); // Set loading to false if query is empty
            return of({
              success: 'false',
              message: 'Query is empty',
              data: [],
            }); // Return an empty result
          } else {
            this.loading.set(true); // Set loading to true for non-empty queries
            return this.searchUsers(query); // Call the API for valid queries
          }
        }),
      )
      .subscribe((users) => {
        this.users.set(users.data);
        this.loading.set(false);
      });
  }

  onSearchInputChange() {
    this.loading.set(true);
    this.searchSubject.next(this.searchInput());
  }

  searchUsers(query: string) {
    return this.httpClient.get<SearchedUser>(`${API_URLS.getUsers}${query}`, {
      withCredentials: true,
    });
  }

  selectUser(user: User) {
    this.searchInput.set(user.email);
    this.users.set([]);
    this.selectedUser.set(user);
  }

  onAdd(): void {
    this.dialogRef.close({ email: this.searchInput() });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
