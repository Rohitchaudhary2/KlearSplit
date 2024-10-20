import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
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
  dialogRef = inject(MatDialogRef<SplitTypeComponent>);
  data = inject(MAT_DIALOG_DATA);
  participants = this.data[0];
  total_amount = this.data[1];
  activeItem = 'EQUAL'; // Default active item
  cdr = inject(ChangeDetectorRef);
  private updating = false;

  form = new FormGroup({
    participant1_share: new FormControl(0, {
      validators: [Validators.required],
    }),
    participant2_share: new FormControl(0, {
      validators: [Validators.required],
    }),
  });

  inputFieldControls() {
    if (this.activeItem === 'EQUAL') {
      const halfAmount = parseFloat(this.total_amount) / 2;
      this.form.get('participant1_share')?.setValue(halfAmount);
      this.form.get('participant2_share')?.setValue(halfAmount);
      this.form.get('participant1_share')?.disable(); // Disable the first input
      this.form.get('participant2_share')?.disable(); // Disable the second input
    } else if (this.activeItem === 'PERCENTAGE') {
      this.form.get('participant1_share')?.setValue(50);
      this.form.get('participant2_share')?.setValue(50);
      this.form.get('participant1_share')?.enable(); // Enable the first input
      this.form.get('participant2_share')?.enable(); // Enable the second input
    } else {
      const halfAmount = parseFloat(this.total_amount) / 2;
      this.form.get('participant1_share')?.setValue(halfAmount);
      this.form.get('participant2_share')?.setValue(halfAmount);
      this.form.get('participant1_share')?.enable(); // Enable the first input
      this.form.get('participant2_share')?.enable();
    }
  }

  setActive(item: string) {
    this.activeItem = item; // Set the active item
    this.inputFieldControls();
  }

  ngOnInit(): void {
    this.dialogRef.updateSize('25%');
    this.inputFieldControls();

    this.form.get('participant1_share')?.valueChanges.subscribe((value) => {
      if (this.activeItem === 'UNEQUAL' && value! > this.total_amount) {
        this.form.get('participant1_share')?.setValue(this.total_amount);
        value = this.total_amount;
      } else if (this.activeItem === 'PERCENTAGE' && value! > 100) {
        this.form.get('participant1_share')?.setValue(100);
        value = 100;
      }
      this.updateParticipant2Share(value!);
    });

    this.form.get('participant2_share')?.valueChanges.subscribe((value) => {
      if (this.activeItem === 'UNEQUAL' && value! > this.total_amount) {
        this.form.get('participant2_share')?.setValue(this.total_amount);
        value = this.total_amount;
      } else if (this.activeItem === 'PERCENTAGE' && value! > 100) {
        this.form.get('participant2_share')?.setValue(100);
        value = 100;
      }
      this.updateParticipant1Share(value!);
    });
  }

  updateParticipant1Share(participant2Share: number) {
    if (this.updating) return;

    this.updating = true;
    if (this.activeItem === 'UNEQUAL')
      this.form
        .get('participant1_share')
        ?.setValue(this.total_amount - participant2Share);
    else if (this.activeItem === 'PERCENTAGE')
      this.form.get('participant1_share')?.setValue(100 - participant2Share);
    this.updating = false;
  }

  updateParticipant2Share(participant1Share: number) {
    if (this.updating) return;

    this.updating = true;
    if (this.activeItem === 'UNEQUAL')
      this.form
        .get('participant2_share')
        ?.setValue(this.total_amount - participant1Share);
    else if (this.activeItem === 'PERCENTAGE')
      this.form.get('participant2_share')?.setValue(100 - participant1Share);
    this.updating = false;
  }

  sendSplitType() {
    this.dialogRef.close({
      split_type: this.activeItem,
      participant1_share: this.form.value.participant1_share,
      participant2_share: this.form.value.participant2_share,
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
