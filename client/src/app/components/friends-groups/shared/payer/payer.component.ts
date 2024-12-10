import { Component, input, output } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-payer",
  standalone: true,
  imports: [ MatButtonModule ],
  templateUrl: "./payer.component.html",
  styleUrl: "./payer.component.css"
})
export class PayerComponent {
  participants = input<{id: string, first_name: string, last_name: string} []>();
  payer = output<string>();
  cancel = output<void>();

  sendPayer(id: string) {
    this.payer.emit(id);
  }
}
