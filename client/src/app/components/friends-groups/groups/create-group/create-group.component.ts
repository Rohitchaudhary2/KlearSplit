import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { ConfirmationDialogComponent } from "../../../confirmation-dialog/confirmation-dialog.component";
import { FormErrorMessageService } from "../../../shared/form-error-message.service";
import { CurrentUser } from "../../../shared/types.model";
// import { AddFriendComponent } from "../../friends/add-friend/add-friend.component";
import { SelectMembersDialogComponent } from "./select-members-dialog/select-members-dialog.component";
@Component({
  selector: "app-create-group",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: "./create-group.component.html",
  styleUrl: "./create-group.component.css"
})
export class CreateGroupComponent implements OnInit {
  private readonly dialogRef = inject (MatDialogRef<CreateGroupComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly formErrorMessages = inject(FormErrorMessageService);
  loading = false;
  data = inject(MAT_DIALOG_DATA);

  imageName = signal<string>("Upload group profile");

  form = new FormGroup({
    groupName: new FormControl("", {
      validators: [ Validators.required, Validators.maxLength(100) ]
    }),
    groupDescription: new FormControl("", {
      validators: [ Validators.maxLength(255) ]
    }),
    image: new FormControl<File | null>(null),
    members: new FormControl<string[]>([], {
      validators: [ Validators.required ]
    }),
    admins: new FormControl<string[]>([]),
    coadmins: new FormControl<string[]>([]),
  });

  selectedMembers: {
    user_id: string;
    first_name: string;
    last_name: string;
    isAdmin: boolean;
    isCoAdmin: boolean
  }[] = [];

  ngOnInit(): void {
    this.dialogRef.updateSize("30%");
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
   * Trims the leading and trailing whitespace from the value of a specific form control.
   * This is used to ensure no accidental spaces are included in form fields like 'expense_name' or 'description'.
   *
   * @param controlName - The name of the form control whose value will be trimmed.
   */
  trimInput(controlName: string) {
    const control = this.form.get(controlName);
    if (control) {
      const trimmedValue = control.value.trim();
      control.setValue(trimmedValue, { emitEvent: false });
    }
  }

  /**
   * Handles the file selection event when the user selects an image or file.
   * This method updates the form control for 'receipt' with the selected file and sets the image name.
   *
   * @param event - The event triggered by the file input. It's expected to be of type 'Event' where the target
   * is an HTMLInputElement with the selected files.
   */
  selectImage(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      this.form.controls.image.setValue(input.files[0]);
      this.imageName.set(input.files[0].name);
    }
  }

  /**
   * Opens a dialog to allow the user to select a group members.
   *
   * This method opens a dialog where the user can choose the members, and once the dialog is closed,
   * it updates the form with the selected member IDs.
   */
  openMembersDialog() {
    const dialogRef = this.dialog.open(SelectMembersDialogComponent, {
      panelClass: "second-dialog",
      width: "20%",
      data: [ "Add Members" ],
      backdropClass: "dialog-bg-trans",
      position: {
        right: "5%",
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.selectedMembers = result.map((user: CurrentUser) => ({
          ...user,
          isAdmin: false,
          isCoAdmin: false,
        }));
        this.form.controls.members.setValue(
          this.selectedMembers.map((member) => member.user_id)
        );
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        members: this.selectedMembers.map((member) => ({
          id: member.user_id,
          isAdmin: member.isAdmin,
          isCoAdmin: member.isCoAdmin,
        })),
      });
    }
  }

  onCancel(): void {
    const confirmationDialogRef = this.dialog.open(
      ConfirmationDialogComponent,
      {
        data: "Your changes would be lost. Would you like to continue?",
      },
    );

    confirmationDialogRef.afterClosed().subscribe((result) => {
      // If user confirms closing of Add Expense dialog box.
      if (result) {
        this.dialogRef.close(null);
      }
    });
  }
}
