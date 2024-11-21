import { Component, inject, OnInit, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";

import { ConfirmationDialogComponent } from "../../confirmation-dialog/confirmation-dialog.component";
import { FormErrorMessageService } from "../../shared/form-error-message.service";
import { PayerComponent } from "./payer/payer.component";
import { SplitTypeComponent } from "./split-type/split-type.component";

@Component({
  selector: "app-friends-expense",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: "./friends-expense.component.html",
  styleUrl: "./friends-expense.component.css",
})
export class FriendsExpenseComponent implements OnInit {
  private formErrorMessages = inject(FormErrorMessageService);
  private dialogRef = inject(MatDialogRef<FriendsExpenseComponent>);
  private dialog = inject(MatDialog);
  data = inject(MAT_DIALOG_DATA);
  participants;
  imageName = signal<string>("Upload Bill Receipt");
  splitType = "EQUAL";

  /**
   * Constructor to update the expense form and set up participants based on the type of data passed.
   * It handles two cases: adding an expense or editing an existing one. It also calculates and patches the share
   * for each participant based on the split type (UNEQUAL or PERCENT).
   */
  constructor() {
    // Check if the first element of `data` is 'Add Expense', indicating this is a new expense.
    if (this.data[0] === "Add Expense") {
      // If 'Add Expense', participants are the first and second items from `data` (user and their friend)
      this.participants = [ this.data[1], this.data[2].friend ];
      this.form.patchValue({
        payer_id: this.participants[0]?.user_id,
      });
    } else {
      // Otherwise, it's an existing expense that is being edited
      // Participants are the third and fourth items from `data` (user and their friend)
      this.participants = [ this.data[2], this.data[3].friend ];
      const expenseToBeUpdated = this.data[1];
      this.splitType =
        expenseToBeUpdated.split_type !== "PERCENTAGE"
          ? expenseToBeUpdated.split_type
          : "PERCENT";

      let participant1Share = "";
      let participant2Share = "";

      const totalAmount = parseFloat(expenseToBeUpdated.total_amount);
      const debtorAmount = parseFloat(expenseToBeUpdated.debtor_amount);
      const payerAmount = totalAmount - debtorAmount;

      if (this.splitType === "UNEQUAL") {
        if (expenseToBeUpdated.payer_id === this.participants[0].user_id) {
          participant1Share = JSON.stringify(payerAmount);
          participant2Share = JSON.stringify(debtorAmount);
        } else {
          participant1Share = JSON.stringify(debtorAmount);
          participant2Share = JSON.stringify(payerAmount);
        }
      } else if (this.splitType === "PERCENT") {
        const debtorPercentage = (debtorAmount / totalAmount) * 100;
        const payerPercentage = (payerAmount / totalAmount) * 100;
        if (expenseToBeUpdated.payer_id === this.participants[0].user_id) {
          participant1Share = JSON.stringify(payerPercentage);
          participant2Share = JSON.stringify(debtorPercentage);
        } else {
          participant1Share = JSON.stringify(debtorPercentage);
          participant2Share = JSON.stringify(payerPercentage);
        }
      }

      // Update the form values with the expense data and the calculated shares
      this.form.patchValue({
        expense_name: expenseToBeUpdated.expense_name,
        total_amount: expenseToBeUpdated.total_amount,
        description: expenseToBeUpdated.description || "",
        payer_id: expenseToBeUpdated.payer_id,
        split_type: expenseToBeUpdated.split_type,
        receipt: expenseToBeUpdated.receipt || "",
        participant1_share: participant1Share,
        participant2_share: participant2Share,
      });
    }
  }

  // Create a new instance of FormGroup with the defined controls for the form
  form = new FormGroup({
    expense_name: new FormControl("", {
      validators: [ Validators.required, Validators.maxLength(50) ],
    }),
    total_amount: new FormControl("", {
      validators: [
        Validators.required,
        Validators.min(0.1),
        Validators.max(999999999999.99),
      ],
    }),
    description: new FormControl("", {
      validators: [ Validators.maxLength(150) ],
    }),
    payer_id: new FormControl("", {
      validators: [ Validators.required ],
    }),
    participant1_share: new FormControl(""),
    participant2_share: new FormControl(""),
    split_type: new FormControl<"EQUAL" | "UNEQUAL" | "PERCENTAGE">("EQUAL", {
      validators: [ Validators.required ],
    }),
    receipt: new FormControl<File | null>(null),
  });

  /**
   * Initializes the component and adjusts the size of the dialog window.
   * This lifecycle hook runs once when the component is initialized.
   */
  ngOnInit(): void {
    this.dialogRef.updateSize("30%");
  }

  /**
   * Retrieves the error message for a specific form field.
   *
   * @param field - The name of the form control field to check for errors.
   *
   * @returns A string containing the error message for the field, or null if there are no errors.
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
  selectImage(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.form.get("receipt")?.setValue(file);
      this.imageName.set(file.name);
    }
  }

  /**
   * Handles the form submission for adding an expense.
   * This method processes the form data, handles the sharing logic (EQUAL, UNEQUAL, PERCENTAGE),
   * and prepares the form data to be sent (including optional file uploads).
   */
  onAdd(): void {
    // If the split type is 'EQUAL', divide the total amount equally between both participants
    if (this.form.value.split_type === "EQUAL") {
      this.form
        .get("participant1_share")
        ?.setValue(
          JSON.stringify(parseFloat(this.form.value.total_amount!) / 2),
        );
      this.form
        .get("participant2_share")
        ?.setValue(
          JSON.stringify(parseFloat(this.form.value.total_amount!) / 2),
        );
    }

    // Exit the function if the form is not valid
    if (!this.form.valid) {
      return;
    }

    const formData = new FormData();
    // Loop through each form control and append values to formData
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);
      // Only append the value if the control has a value
      if (control?.value) {
        // Special handling for the 'receipt' field, which is expected to be a File object
        if (controlName === "receipt") {
          formData.append(controlName, control.value as File);
        } else {
          formData.append(controlName, control.value as string);
        }
      }
    });

    // Handle debtor share logic for split types UNEQUAL and PERCENTAGE
    let debtorShare;
    if (
      this.form.value.split_type === "UNEQUAL" ||
      this.form.value.split_type === "PERCENTAGE"
    ) {
      debtorShare =
        this.form.value.payer_id === this.participants[0].user_id
          ? this.form.value.participant2_share
          : this.form.value.participant1_share;
    }

    const debtorId =
      this.form.value.payer_id === this.participants[0].user_id
        ? this.participants[1].user_id
        : this.participants[0].user_id;

    // If there is a debtor share, append it to the formData
    if (debtorShare) {
      formData.append("debtor_share", debtorShare as string);
    }
    formData.append("debtor_id", debtorId as string);

    // Close the dialog and pass the formData and other relevant expense data
    this.dialogRef.close({
      formData: formData,
      expenseData: { ...this.form.value, debtorId, debtorShare },
    });
  }

  /**
   * Retrieves the name of the payer based on the form's payer ID.
   *
   * If the payer is the current user, it returns 'you'. Otherwise, it returns the
   * full name of the second participant.
   *
   * @returns {string} The name of the payer (either 'you' or the second participant's full name).
   */
  getPayerName() {
    const id = this.form.value.payer_id;
    if (id === this.participants[0].user_id) {
      return "you";
    } else {
      return `${this.participants[1].first_name}${this.participants[1].last_name ? ` ${this.participants[1].last_name}` : ""}`;
    }
  }

  /**
   * Opens a dialog to allow the user to select a payer from the participants.
   *
   * This method opens a dialog where the user can choose the payer, and once the dialog is closed,
   * it updates the form with the selected payer's ID.
   */
  openPayerDialog(): void {
    const dialogRef = this.dialog.open(PayerComponent, {
      panelClass: "second-dialog",
      width: "30%",
      data: this.participants,
      backdropClass: "dialog-bg-trans",
      position: {
        right: "7%",
      },
    });

    // After the dialog is closed, handle the result (selected payer)
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.form.get("payer_id")?.setValue(result.id);
      }
    });
  }

  /**
   * Opens the dialog for selecting the split type and updating the participant shares.
   *
   * This method gathers the necessary data from the form, passes it to the `SplitTypeComponent`,
   * and then updates the form values based on the result from the dialog.
   */
  openSplitTypeDialog(): void {
    // Created an object with the current expense data to pass to the dialog
    const expenseData = {
      total_amount: this.form.value.total_amount,
      split_type: this.form.value.split_type,
      participant1_share: this.form.value.participant1_share,
      participant2_share: this.form.value.participant2_share,
    };

    // Open the SplitType dialog and pass the participants and expense data to it
    const dialogRef = this.dialog.open(SplitTypeComponent, {
      panelClass: "second-dialog",
      width: "30%",
      data: [ this.participants, expenseData ],
      backdropClass: "dialog-bg-trans",
      position: {
        right: "7%",
      },
    });

    // After the dialog is closed, handling the result (split type and participant shares)
    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }

      this.splitType =
        result.split_type !== "PERCENTAGE" ? result.split_type : "PERCENT";
      this.form.get("split_type")?.setValue(result.split_type);
      this.form
        .get("participant1_share")
        ?.setValue(JSON.stringify(result.participant1Share));
      this.form
        .get("participant2_share")
        ?.setValue(JSON.stringify(result.participant2Share));
    });
  }

  /**
   * Opens a confirmation dialog when the user tries to close Add Expense dialog box.
   *
   * If the user confirms, the current dialog is closed, discarding any unsaved changes.
   */
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
