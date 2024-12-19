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

import { ConfirmationDialogComponent } from "../../../confirmation-dialog/confirmation-dialog.component";
import { FormErrorMessageService } from "../../../shared/form-error-message.service";
import { ExpenseFormComponent } from "../../shared/expense-form/expense-form.component";
import { GroupMemberData } from "../groups.model";
import { GroupsPayerComponent } from "./groups-payer/groups-payer.component";
import { GroupsSplitTypeComponent } from "./groups-split-type/groups-split-type.component";

@Component({
  selector: "app-groups-expense",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    ExpenseFormComponent
  ],
  templateUrl: "./groups-expense.component.html",
  styleUrl: "./groups-expense.component.css",
})
export class GroupsExpenseComponent implements OnInit {
  private readonly formErrorMessages = inject(FormErrorMessageService);
  private readonly dialogRef = inject(MatDialogRef<GroupsExpenseComponent>);
  private readonly dialog = inject(MatDialog);
  data = inject(MAT_DIALOG_DATA);
  participants!: GroupMemberData[];
  selectedParticipants!: GroupMemberData[];
  imageName = signal<string>("Upload Bill Receipt");
  splitType = "EQUAL";
  payer_share!: number;
  debtors!: { debtor_id: string, debtor_share: number }[];

  /**
   * Constructor to update the expense form and set up participants based on the type of data passed.
   * It handles two cases: adding an expense or editing an existing one. It also calculates and patches the share
   * for each participant based on the split type (UNEQUAL or PERCENT).
   */
  constructor() {
    // Check if the first element of `data` is 'Add Expense', indicating this is a new expense.
    // If 'Add Expense', participants are the first and second items from `data` (user and their friend)
    this.participants = this.data[3];
    this.selectedParticipants = [ ...this.participants ];
    this.form.patchValue({
      payer_id: this.data[1].group_membership_id,
    });
  }

  // Create a new instance of FormGroup with the defined controls for the form
  form = new FormGroup({
    expense_name: new FormControl("", {
      validators: [ Validators.required, Validators.maxLength(50) ],
    }),
    total_amount: new FormControl(0, {
      validators: [
        Validators.required,
        Validators.min(0.1),
        Validators.max(9999999999.99),
      ],
    }),
    description: new FormControl("", {
      validators: [ Validators.maxLength(150) ],
    }),
    payer_id: new FormControl("", {
      validators: [ Validators.required ],
    }),
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
      this.debtors = this.selectedParticipants.map((participant) => ({
        debtor_id: participant.group_membership_id,
        debtor_share: this.form.value.total_amount!/(this.selectedParticipants.length ?? 1)
      }));
      const payer = this.debtors.find((debtor) =>
        this.form.value.payer_id === debtor.debtor_id);
      this.payer_share = payer ? payer.debtor_share : 0;
      this.debtors = this.debtors.filter((debtor) => this.form.value.payer_id !== debtor.debtor_id);
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

    formData.append("payer_share", JSON.stringify(this.payer_share));
    formData.append("debtors", JSON.stringify(this.debtors));

    // Close the dialog and pass the formData and other relevant expense data
    this.dialogRef.close({
      formData: formData,
      expenseData: { ...this.form.value, debtors: this.debtors, payer_share: this.payer_share },
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
  getPayerName(): string {
    const id = this.form.value.payer_id;
    if (id === this.data[1].group_membership_id) {
      return "you";
    } else {
      const payer = this.participants.find((participant) => id === participant.group_membership_id);
      return `${payer!.first_name} ${ payer!.last_name || ""}`;
    }
  }

  /**
   * Opens a dialog to allow the user to select a payer from the participants.
   *
   * This method opens a dialog where the user can choose the payer, and once the dialog is closed,
   * it updates the form with the selected payer's ID.
   */
  openPayerDialog(): void {
    const dialogRef = this.dialog.open(GroupsPayerComponent, {
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
    };

    // Open the SplitType dialog and pass the participants and expense data to it
    const dialogRef = this.dialog.open(GroupsSplitTypeComponent, {
      panelClass: "second-dialog",
      width: "30%",
      data: { participants: this.participants, totalAmount: expenseData },
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

      this.selectedParticipants = result.selectedParticipants;

      this.splitType =
        result.split_type !== "PERCENTAGE" ? result.split_type : "PERCENT";
      this.form.get("split_type")?.setValue(result.split_type);
      const payer = result.debtors.find((debtor: {debtor_id: string, debtor_share: number}) =>
        this.form.value.payer_id === debtor.debtor_id);
      this.payer_share = payer ? payer.debtor_share : 0;
      this.debtors = result.debtors.filter((debtor: {debtor_id: string, debtor_share: number}) =>
        this.form.value.payer_id !== debtor.debtor_id);
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
