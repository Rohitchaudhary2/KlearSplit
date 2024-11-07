import { Component, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime, of, Subject, switchMap } from 'rxjs';
import { User } from '../friend.model';
import { MatIconModule } from '@angular/material/icon';
import { FormErrorMessageService } from '../../shared/form-error-message.service';
import { FriendsService } from '../friends.service';

@Component({
  selector: 'app-add-friend',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-friend.component.html',
  styleUrl: './add-friend.component.css',
})
export class AddFriendComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AddFriendComponent>);
  users = signal<User[]>([]);
  searchSubject = new Subject<string>();
  loading = signal(false);
  form = new FormGroup({
    searchInputControl: new FormControl('', [
      Validators.email,
      Validators.required,
    ]),
  });
  formErrorMessages = inject(FormErrorMessageService);
  friendsService = inject(FriendsService);

  searchInput = signal<string | null | undefined>('');
  selectedUser = signal<User | undefined>(undefined);

  inputError = signal<string | undefined>(undefined);

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
            return this.friendsService.searchUsers(query); // Call the API for valid queries
          }
        }),
      )
      .subscribe((users) => {
        this.users.set(users.data);
        this.loading.set(false);
      });
  }

  onSearchInputChange() {
    this.selectedUser.set(undefined);
    this.loading.set(true);
    this.inputError.set(undefined);
    this.searchInput.set(this.form.value.searchInputControl);
    if (typeof this.form.value.searchInputControl === 'string')
      this.searchSubject.next(this.form.value.searchInputControl);
  }

  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  selectUser(user: User) {
    this.searchInput.set(user.email);
    this.form.get('searchInputControl')!.setValue(user.email);
    this.users.set([]);
    this.selectedUser.set(user);
  }

  onAdd() {
    if (this.form.valid) {
      this.dialogRef.close({ email: this.form.value.searchInputControl });
    } else {
      this.inputError.set('Invalid Input.');
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
