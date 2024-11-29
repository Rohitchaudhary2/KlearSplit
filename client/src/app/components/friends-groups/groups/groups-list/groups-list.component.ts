import { CurrencyPipe, NgClass } from "@angular/common";
import { Component, inject, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ToastrService } from "ngx-toastr";

import { SearchBarComponent } from "../../shared/search-bar/search-bar.component";
import { CreateGroupComponent } from "../create-group/create-group.component";
import { GroupData } from "../groups.model";
import { GroupsService } from "../groups.service";

@Component({
  selector: "app-groups-list",
  standalone: true,
  imports: [
    FormsModule,
    CurrencyPipe,
    MatIconModule,
    MatTooltipModule,
    NgClass,
    SearchBarComponent,
  ],
  templateUrl: "./groups-list.component.html",
  styleUrl: "./groups-list.component.css"
})
export class GroupsListComponent {
  private readonly dialog = inject(MatDialog);
  private readonly groupService = inject(GroupsService);
  private readonly toastr = inject(ToastrService);

  selectedGroup = output<GroupData | undefined>();
  currentGroup = signal<GroupData | undefined>(undefined);
  
  searchTerm = signal("");

  // Searches from the existing group list
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
  }

  // Opens the dialog box to create a new group.
  onCreateGroupClick(): void {
    const dialogRef = this.dialog.open(CreateGroupComponent, {
      width: "500px",
      enterAnimationDuration: "500ms",
      exitAnimationDuration: "500ms",
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result) {
        return;
      }
      
      // Call the createGroup method in the GroupService to send a group invite to the selected users
      this.groupService.createGroup(result).subscribe({
        next: () => {
          this.toastr.success("Group created successfully", "Success");
        }
      });
    });
  }

  // This function is triggered when a group is selected and emits out an output signal to the parent component to set which group is selected
  onSelectGroup(group: GroupData | undefined): void {
    this.currentGroup.set(group);
    this.selectedGroup.emit(group);
  }
}
