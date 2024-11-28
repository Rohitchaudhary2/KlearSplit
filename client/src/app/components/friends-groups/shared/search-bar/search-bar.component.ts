import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "app-search-bar",
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: "./search-bar.component.html",
  styleUrl: "./search-bar.component.css"
})
export class SearchBarComponent {
  placeholder = input("Search...");
  actionButtonIcon = input("add");
  actionButtonTitle = input("Action");
  searchChange = output<string>();
  actionButtonClick = output<void>();

  searchTerm = "";

  // This method is triggered when there is a change in the input field and it emits out a signal with the search term
  onSearchChange(): void {
    this.searchChange.emit(this.searchTerm);
  };

  // Emits which button is clicked add friend or create new group.
  onActionButtonClick(): void {
    this.actionButtonClick.emit();
  };
}
