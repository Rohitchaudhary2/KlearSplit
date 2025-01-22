import { CommonModule } from "@angular/common";
import { Component, inject, input, output, signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { ToastrService } from "ngx-toastr";

import { ExpenseData } from "../../friends/friend.model";
import { FriendsService } from "../../friends/friends.service";

interface ErrorRow {
  row: number;
  errors: string[] | string;
}

@Component({
  selector: "app-bulk-insertion",
  standalone: true,
  imports: [ MatFormFieldModule, MatSelectModule, MatButtonModule, CommonModule ],
  templateUrl: "./bulk-insertion.component.html",
  styleUrl: "./bulk-insertion.component.css"
})
export class BulkInsertionComponent {
  private readonly friendsService = inject(FriendsService);
  private toaster = inject(ToastrService);

  errorMessage = signal<string | null>(null);
  isFileSelected = signal<boolean>(false);

  selectedFile = signal<File | null>(null);
  errorArray = signal<ErrorRow[]>([]);
  type = input<string>();
  cancel = output<void>();
  addedExpenses = output<ExpenseData[]>();

  closeBulkInsertion = output();

  onFileSelected(event: Event) {
    const inputFile = event.target as HTMLInputElement;
    const file = inputFile.files?.[0];

    if (file) {
      const fileName = file.name;
      const fileExtension = fileName.split(".").pop()?.toLowerCase();

      const isValidExtension = fileExtension === "csv";

      if (isValidExtension) {
        this.isFileSelected.set(true);
        this.selectedFile.set(file);
        this.errorMessage.set(null);
      } else {
        this.isFileSelected.set(false);
        this.selectedFile.set(null);
        this.errorMessage.set(
          "Please select a .csv file only"
        );
      }
    } else {
      this.resetFileSelection();
    }
  }

  private resetFileSelection() {
    this.isFileSelected.set(false);
    this.selectedFile.set(null);
    this.errorMessage.set(null);
  }

  closeBulkInsertionTab() {
    this.closeBulkInsertion.emit();
  }

  onUpload() {
    const file = this.selectedFile();
    if (this.isFileSelected() && file) {
      // Clear previous errors
      this.errorArray.set([]);

      if(this.type() === "friends") {
        this.friendsService.bulkAddExpenses(file).subscribe({
          next: (response) => {
            this.addedExpenses.emit(response.data);
            this.toaster.success("Expenses added successfully!", "Success");
          },
          error: (err) => {
            if (Array.isArray(err.error.message)) {
              this.errorArray.set(
                err.error.message.map((msg: ErrorRow) => ({
                  row: msg.row,
                  errors: msg.errors,
                }))
              );
            } else {
              this.toaster.error(err.error.message, "Error");
            }
          },
          complete: () => {
            this.resetFileSelection();
          },
        });
      }
    }
  }
}
