import { Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-friends-expense',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './friends-expense.component.html',
  styleUrl: './friends-expense.component.css',
})
export class FriendsExpenseComponent {
  selected_payer = signal(undefined);

  participant1 = signal(undefined);
  participant2 = signal(undefined);

  form = new FormGroup({
    expense_name: new FormControl('', {
      validators: [Validators.required],
    }),
    total_amount: new FormControl(0, {
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      validators: [Validators.maxLength(150)],
    }),
    split_type: new FormControl<
      'EQUAL' | 'UNEQUAL' | 'PERCENTAGE' | 'SETTLEMENT'
    >('EQUAL', { validators: [Validators.required] }),
    receipt_url: new FormControl(''),
  });
}
