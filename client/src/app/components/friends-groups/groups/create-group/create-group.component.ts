import { Component, inject, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";

import { ConfirmationDialogComponent } from "../../../confirmation-dialog/confirmation-dialog.component";
import { FormErrorMessageService } from "../../../shared/form-error-message.service";
import { SelectMembersDialogComponent } from "./select-members-dialog/select-members-dialog.component";

interface Group {
  group_name: string;
  group_description: string;
  image: string;
}
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
    group_name: new FormControl("", {
      validators: [ Validators.required, Validators.maxLength(100) ]
    }),
    group_description: new FormControl("", {
      validators: [ Validators.maxLength(255) ]
    }),
    image: new FormControl<File | null>(null),
  });

  membersData: {
    members: string[];
    admins: string[];
    coadmins: string[];
  } = { members: [], admins: [], coadmins: [] };

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
        right: "2%",
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      this.membersData = result;
    });
  }

  onSubmit() {
    if (!this.form.valid) {
      return;
    }

    // Remove empty fields from the group object
    const group = Object.keys(this.form.value).reduce((acc, key) => {
      const typedKey = key as keyof Group;
      const value = this.form.get(typedKey)?.value;
      // Handle File type specifically for 'image' field
      if (typedKey === "image" && value instanceof File) {
        acc[typedKey] = "image"; // Assign File type for image
      } else if (value && typeof value === "string") {
        acc[typedKey] = value; // Assign string type for other fields
      }
      return acc;
    }, {} as Partial<Group>);

    const formData = new FormData();
    formData.append("group", JSON.stringify(group));
    this.dialogRef.close({
      group,
      membersData: { ...this.membersData },
    });
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
