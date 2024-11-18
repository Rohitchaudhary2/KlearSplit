import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-split-type',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule],
  templateUrl: './split-type.component.html',
  styleUrl: './split-type.component.css',
})
export class SplitTypeComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<SplitTypeComponent>);
  private data = inject(MAT_DIALOG_DATA);
  participants = this.data[0];
  expenseData = this.data[1];
  activeItem = 'EQUAL';
  private updating = false;

  // Variables to store the share values for UNEQUAL and PERCENTAGE modes
  private unequalParticipant1Share: number | null = null;
  private unequalParticipant2Share: number | null = null;

  private percentageParticipant1Share: number | null = null;
  private percentageParticipant2Share: number | null = null;

  form = new FormGroup({
    participant1_share: new FormControl(0, {
      validators: [Validators.required],
    }),
    participant2_share: new FormControl(0, {
      validators: [Validators.required],
    }),
  });

  ngOnInit(): void {
    this.dialogRef.updateSize('25%');
    this.activeItem = this.expenseData.split_type;

    // Initialize participant share values based on the split type (UNEQUAL or PERCENTAGE)
    this.initializeShares();

    // Call to inputFieldControls method to configure the form input fields based on the active item
    this.inputFieldControls();

    // Subscribe to value changes for both participant shares
    this.subscribeToShareChanges('participant1_share');
    this.subscribeToShareChanges('participant2_share');
  }

  /**
   * Initialize the participant shares based on the split type
   */
  private initializeShares(): void {
    if (this.activeItem === 'UNEQUAL') {
      this.unequalParticipant1Share = parseFloat(
        this.expenseData.participant1_share,
      );
      this.unequalParticipant2Share = parseFloat(
        this.expenseData.participant2_share,
      );
    } else if (this.activeItem === 'PERCENTAGE') {
      this.percentageParticipant1Share = parseFloat(
        this.expenseData.participant1_share,
      );
      this.percentageParticipant2Share = parseFloat(
        this.expenseData.participant2_share,
      );
    }
  }

  /**
   * Subscribes to value changes for a given form control (either 'participant1_share' or 'participant2_share'),
   * validates the entered value based on the active split type (UNEQUAL or PERCENTAGE),
   * and updates the other participant's share accordingly.
   *
   * @param controlName - The name of the form control to subscribe to ('participant1_share' or 'participant2_share')
   */
  private subscribeToShareChanges(controlName: string) {
    this.form.get(controlName)?.valueChanges.subscribe((value) => {
      // Ensure the value is within valid bounds depending on the active item type (UNEQUAL or PERCENTAGE)
      if (
        this.activeItem === 'UNEQUAL' &&
        (value! > this.expenseData.total_amount || value! < 0)
      ) {
        if (value! > this.expenseData.total_amount)
          value = this.expenseData.total_amount;
        else if (value! < 0) value = 0;
        this.form.get(controlName)?.setValue(value);
      } else if (
        this.activeItem === 'PERCENTAGE' &&
        (value! > 100 || value! < 0)
      ) {
        if (value! > 100) value = 100;
        else if (value! < 0) value = 0;
        this.form.get(controlName)?.setValue(value);
      }
      if (controlName === 'participant1_share') {
        this.updateShare('participant2_share', value!);
      } else {
        this.updateShare('participant1_share', value!);
      }
    });
  }

  /**
   * Updates the share value for a specific participant based on the other participant's share.
   *
   * @param {('participant1_share' | 'participant2_share')} participant - The participant whose share needs to be updated ('participant1_share' or 'participant2_share').
   * @param {number} otherShare - The current share value of the other participant, used to calculate the updated share.
   */
  private updateShare(
    participant: 'participant1_share' | 'participant2_share',
    otherShare: number,
  ): void {
    if (this.updating) return;

    this.updating = true;

    if (this.activeItem === 'UNEQUAL') {
      this.form
        .get(participant)
        ?.setValue(this.expenseData.total_amount - otherShare);
    } else if (this.activeItem === 'PERCENTAGE') {
      this.form.get(participant)?.setValue(100 - otherShare);
    }

    this.updating = false;
  }

  /**
   * Controls the input fields for participant shares based on the active item type (EQUAL, PERCENTAGE, or UNEQUAL).
   *
   * This method adjusts the share values of two participants and enables or disables the corresponding input fields
   * depending on the selected option.
   */
  inputFieldControls() {
    // Default share value (split equally between two participants)
    const defaultShare = parseFloat(this.expenseData.total_amount) / 2;

    if (this.activeItem === 'EQUAL') {
      this.setShareValues(defaultShare, defaultShare, false); // Disable both inputs for equal share
    } else if (this.activeItem === 'PERCENTAGE') {
      const percentage1 = this.percentageParticipant1Share ?? 50;
      const percentage2 = this.percentageParticipant2Share ?? 50;
      this.setShareValues(percentage1, percentage2, true); // Enable both inputs for percentage share
    } else {
      const unequal1 = this.unequalParticipant1Share ?? defaultShare;
      const unequal2 = this.unequalParticipant2Share ?? defaultShare;
      this.setShareValues(unequal1, unequal2, true); // Enable both inputs for unequal share
    }
  }

  /**
   * Helper function to set the values of participant shares and enable/disable the input controls.
   *
   * @param value1 - The value to set for participant 1's share.
   * @param value2 - The value to set for participant 2's share.
   * @param enableInputs - A flag to indicate whether the inputs should be enabled (true) or disabled (false).
   */
  private setShareValues(
    value1: number,
    value2: number,
    enableInputs: boolean,
  ) {
    // Get the form controls for participant shares
    const participant1ShareControl = this.form.get('participant1_share');
    const participant2ShareControl = this.form.get('participant2_share');

    participant1ShareControl?.setValue(value1);
    participant2ShareControl?.setValue(value2);
    if (enableInputs) {
      participant1ShareControl?.enable();
      participant2ShareControl?.enable();
    } else {
      participant1ShareControl?.disable();
      participant2ShareControl?.disable();
    }
  }

  /**
   * Sets the active split type and stores the current share values
   * for UNEQUAL or PERCENTAGE when switching between modes.
   *
   * This method is responsible for:
   * 1. Storing the participant share values when switching modes (UNEQUAL, PERCENTAGE).
   * 2. Updating the active item to the new mode.
   * 3. Enabling/Disabling the input fields accordingly by calling inputFieldControls.
   *
   * @param {string} item - The new split type to be activated (either 'UNEQUAL' or 'PERCENTAGE').
   */
  setActive(item: string) {
    const participant1_share = this.form.get('participant1_share')?.value;
    const participant2_share = this.form.get('participant2_share')?.value;
    // Before switching to another mode, store the current share values for UNEQUAL or PERCENTAGE
    if (this.activeItem === 'UNEQUAL') {
      this.unequalParticipant1Share = participant1_share ?? null;
      this.unequalParticipant2Share = participant2_share ?? null;
    } else if (this.activeItem === 'PERCENTAGE') {
      this.percentageParticipant1Share = participant1_share ?? null;
      this.percentageParticipant2Share = participant2_share ?? null;
    }

    this.activeItem = item;

    this.inputFieldControls();
  }

  /**
   * Sends the selected split type and participant shares to the friends-expense component.
   *
   * Validates the sum of the shares based on the active split type:
   * - For 'UNEQUAL', the sum must be equal to the total expense amount.
   * - For 'PERCENTAGE', the sum must be equal to 100.
   *
   * If the validation passes, it closes the dialog with the split information.
   */
  sendSplitType() {
    const participant1_share = this.form.value.participant1_share!;
    const participant2_share = this.form.value.participant2_share!;
    if (
      (this.activeItem === 'UNEQUAL' &&
        participant1_share + participant2_share !==
          parseFloat(this.expenseData.total_amount)) ||
      (this.activeItem === 'PERCENTAGE' &&
        participant1_share + participant2_share !== 100)
    ) {
      return;
    }

    // If validation is successful, close the dialog and pass the selected split data
    this.dialogRef.close({
      split_type: this.activeItem,
      participant1_share,
      participant2_share,
    });
  }

  /**
   * Closes the dialog without saving any data.
   *
   * This method is triggered when the user closes the dialog box.
   */
  onCancel(): void {
    this.dialogRef.close(null);
  }
}
