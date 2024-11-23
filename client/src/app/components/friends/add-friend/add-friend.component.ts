import { Component, inject, OnInit, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { debounceTime, of, Subject, switchMap } from "rxjs";

import { FormErrorMessageService } from "../../shared/form-error-message.service";
import { SearchedUser } from "../friend.model";
import { FriendsService } from "../friends.service";

@Component({
  selector: "app-add-friend",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: "./add-friend.component.html",
})
export class AddFriendComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<AddFriendComponent>);
  private readonly formErrorMessages = inject(FormErrorMessageService);
  private readonly friendsService = inject(FriendsService);
  private readonly searchSubject = new Subject<string>();
  users = signal<SearchedUser[]>([]);
  loading = signal(false);
  selectedUser = signal<SearchedUser | undefined>(undefined);

  form = new FormGroup({
    searchInputControl: new FormControl("", [
      Validators.email,
      Validators.required,
    ]),
  });

  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(500),
        switchMap((query) => {
          if (query.trim() === "") {
            this.loading.set(false);
            return of({
              success: "false",
              message: "Query is empty",
              data: [],
            });
          } else {
            this.loading.set(true);
            return this.friendsService.searchUsers(query);
          }
        }),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  /**
   * Handles changes in the search input field.
   *
   * This method is triggered whenever the user types in the search field. It clears any previously selected user,
   * sets the loading state to true, and emits the new search query to `searchSubject` to initiate the search.
   *
   * @param {string} searchQuery - The new search query entered by the user (this is derived from the form control).
   */
  onSearchInputChange(searchQuery: string) {
    this.selectedUser.set(undefined);
    this.loading.set(true);
    this.searchSubject.next(searchQuery);
  }

  /**
   * Retrieves the error message for a given form field.
   *
   * @param {string} field - The name of the form field for which the error message is being requested.
   *
   * @returns {string | null} The error message if validation fails, or null if the field is valid.
   */
  getFormErrors(field: string): string | null {
    return this.formErrorMessages.getErrorMessage(this.form, field);
  }

  /**
   * Handles user selection from the search results.
   *
   * This method is called when the user selects a specific user from the search results. It updates the form field
   * with the selected user's email, clears the search results, and sets the `selectedUser` signal with the selected user.
   *
   * @param {SearchedUser} user - The user selected from the search results.
   */
  selectUser(user: SearchedUser) {
    this.form.get("searchInputControl")!.setValue(user.email);
    this.users.set([]);
    this.selectedUser.set(user);
  }

  /**
   * Handles form submission to add a friend.
   *
   * This method is triggered when the user clicks the "Add" button after selecting a user or writing a valid email. It checks if the form is valid
   * and, if so, closes the dialog and returns the selected user's email.
   */
  onAdd() {
    if (this.form.valid) {
      this.dialogRef.close({ email: this.form.value.searchInputControl });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
