import { Component, ElementRef, inject, signal, ViewChild } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatOptionModule } from "@angular/material/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatTooltipModule } from "@angular/material/tooltip";
import { debounceTime, of, Subject, switchMap } from "rxjs";

import { FormErrorMessageService } from "../../../../shared/form-error-message.service";
import { SearchedUser } from "../../groups.model";
import { GroupsService } from "../../groups.service";

type SelectableUser = SearchedUser & {
  isAdmin?: boolean;
  isCoAdmin?: boolean;
  role?: "admin" | "coadmin" | "member";
};

@Component({
  selector: "app-select-members-dialog",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
    MatOptionModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: "./select-members-dialog.component.html",
  styleUrl: "./select-members-dialog.component.css"
})
export class SelectMembersDialogComponent {
  @ViewChild("input", { static: false }) input!: ElementRef<HTMLInputElement>;

  private readonly dialogRef = inject(MatDialogRef<SelectMembersDialogComponent>);
  private readonly formErrorMessages = inject(FormErrorMessageService);
  private readonly groupsService = inject(GroupsService);
  private readonly searchSubject = new Subject<string>();
  data = inject(MAT_DIALOG_DATA);

  users = signal<SelectableUser[]>([]); // List of searched users
  selectedMembers = signal<SelectableUser[]>([]); // Selected members
  loading = signal(false);

  form = new FormGroup({
    searchInputControl: new FormControl("", Validators.required),
  });

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
   * This lifecycle hook runs after the component is initialized.
   * It updates the size of the dialog box and triggers the search api
   * when there is certain time passed after change in the input field
   */
  ngOnInit() {
    this.dialogRef.updateSize("25%");
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
            return this.groupsService.searchUsers(query);
          }
        }),
      )
      .subscribe({
        next: (users) => {
          this.users.set(users.data);
        },
        complete: () => {
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
    this.searchSubject.next(searchQuery.trim());
    this.loading.set(true);
  }

  /**
   * Handles user selection from the search results.
   *
   * This method is called when the user selects a specific user from the search results. It resets the form field,
   * clears the search results, and updates the `selectedMember` signal with the selected user.
   *
   * @param {SearchedUser} user - The user selected from the search results.
   */
  selectUser(user: SearchedUser) {
    if (!this.selectedMembers().find((member) => member.email === user.email)) {
      const selectableUser: SelectableUser = { ...user, role: "member", isAdmin: false, isCoAdmin: false };
      this.selectedMembers.update((members) => [ ...members, selectableUser ]);
    }
    this.users.set([]); // Clear the search results
    this.form.get("searchInputControl")!.reset(); // Clear the input field
    this.onSearchInputChange("");
    setTimeout(() => this.input.nativeElement.focus(), 0);
  }

  /**
   * Handles removal of user from the selected list.
   *
   * This method is called when you want to remove a user from the list of selected users
   *
   * @param {SearchedUser} user - The user selected for removal
   */
  removeUser(user: SearchedUser) {
    this.selectedMembers.update((members) =>
      members.filter((member) => member.email !== user.email),
    );
  }

  /**
   * Handles adding the role field to all the selected users.
   *
   * @param user - The selected user whose role needs to be set
   * @param role - The role that can be assigned to a user.
   */
  updateRole(user: SelectableUser, role: "admin" | "coadmin" | "member") {
    user.role = role;
    user.isAdmin = role === "admin";
    user.isCoAdmin = role === "coadmin";
  }
  
  // This function is triggered when the user clicks on add after selecting all the group members.
  onSave() {
    this.dialogRef.close({
      members: this.selectedMembers().map((user) => user.user_id),
      admins: this.selectedMembers()
        .filter((user) => user.isAdmin)
        .map((user) => user.user_id),
      coadmins: this.selectedMembers()
        .filter((user) => user.isCoAdmin)
        .map((user) => user.user_id),
      membersToDisplay: this.selectedMembers().map((user) =>
        ({
          name: `${user.first_name} ${user.last_name || ""}`.trim(),
          email: user.email,
          role: user.role
        })),
    });
  }

  onCancel() {
    this.dialogRef.close(null);
  }
}
