import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URLS } from '../../constants/api-urls';
import {
  Expense,
  ExpenseData,
  ExpenseResponse,
  FriendData,
  message,
  messageData,
} from './friend.model';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { FriendsListComponent } from './friends-list/friends-list.component';
import { SocketService } from './socket.service';
import { DialogPosition, MatDialog } from '@angular/material/dialog';
import { FriendsExpenseComponent } from './friends-expense/friends-expense.component';
import { NgClass } from '@angular/common';
import { SettlementComponent } from './friends-expense/settlement/settlement.component';
import { concatMap } from 'rxjs';
import { ViewExpensesComponent } from './friends-expense/view-expenses/view-expenses.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    FormsModule,
    FriendsListComponent,
    FriendsExpenseComponent,
    NgClass,
  ],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent implements OnDestroy, AfterViewInit {
  messageContainer = viewChild<ElementRef>('messageContainer');
  private httpClient = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);

  private tokenService = inject(TokenService);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private readonly getMessagesUrl = API_URLS.getMessages;
  private readonly getExpensesUrl = API_URLS.getExpenses;
  user = this.authService.currentUser();
  user_name = `${this.authService.currentUser()?.first_name}${this.authService.currentUser()?.last_name ? ` ${this.authService.currentUser()?.last_name}` : ''}`;

  selectedUser = signal<FriendData | undefined>(undefined);
  messageInput = '';

  messages = signal<messageData[]>([]);
  showMessages = signal(true);

  expenses = signal<ExpenseData[] | []>([]);

  charCount = 0;
  charCountExceeded = false;

  isLoaded = false;

  onLoad() {
    this.isLoaded = true; // Set loaded state to true
  }

  ngOnDestroy(): void {
    if (this.selectedUser()) {
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
      this.socketService.disconnect();
    }
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  onSelectUser(friend: FriendData | undefined) {
    if (this.selectedUser()) {
      // Leave the previous room
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
      // Remove the existing 'onNewMessage' listener
      this.socketService.removeNewMessageListener();
    }

    this.selectedUser.set(friend);

    if (this.selectedUser()) {
      this.httpClient
        .get<message>(
          `${this.getMessagesUrl}/${this.selectedUser()?.conversation_id}`,
          { withCredentials: true },
        )
        .pipe(
          concatMap((messages) => {
            messages.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            this.messages.set(messages.data);
            this.cdr.detectChanges();
            this.scrollToBottom();

            // Fetch expenses for the same user after the messages are loaded
            return this.httpClient.get<Expense>(
              `${this.getExpensesUrl}/${this.selectedUser()?.conversation_id}`,
              { withCredentials: true },
            );
          }),
        )
        .subscribe({
          next: (expenses) => {
            expenses.data.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
            this.expenses.set(expenses.data);
            this.cdr.detectChanges();
            this.scrollToBottom();
          },
        });

      // Join the room for the new conversation
      this.socketService.joinRoom(this.selectedUser()!.conversation_id);

      // Listen for new messages from the server for the new room
      this.socketService.onNewMessage((message: messageData) => {
        this.messages.set([...this.messages(), message]);
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    }
  }

  onInputChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.charCount = textarea.value.length;
    this.charCountExceeded = this.charCount === 512;
  }

  getSettleUpStatus() {
    if (parseFloat(this.selectedUser()!.balance_amount) === 0) {
      return 'All Settled';
    } else {
      return 'Settle up';
    }
  }

  toggleView(flag: boolean) {
    this.showMessages.set(flag);
    this.cdr.detectChanges();
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (this.messageContainer()) {
      const container = this.messageContainer()?.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  sendMessage(): void {
    if (this.messageInput.trim()) {
      const messageData = {
        conversation_id: this.selectedUser()!.conversation_id,
        sender_id: this.tokenService.getUserId(),
        message: this.messageInput,
      };
      this.socketService.sendMessage(messageData);
      this.messageInput = '';
    }
  }

  viewExpense() {
    const expenseList = [...this.expenses()];
    const expenses = expenseList
      .sort((a: ExpenseData, b: ExpenseData) =>
        a.createdAt < b.createdAt ? 1 : -1,
      )
      .slice(0, 10);
    const dialogPosition: DialogPosition = {
      top: '5%',
    };
    const dialogRef = this.dialog.open(ViewExpensesComponent, {
      data: expenses,
      maxWidth: '91vw',
      maxHeight: '85vh',
      height: '85%',
      width: '100%',
      position: dialogPosition,
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    });
    dialogRef.afterClosed().subscribe();
  }

  settlement() {
    if (parseFloat(this.selectedUser()!.balance_amount) !== 0) {
      let payer_name;
      let payer_image;
      let debtor_name;
      let debtor_image;
      const total_amount = Math.abs(
        parseFloat(this.selectedUser()!.balance_amount),
      );
      if (parseFloat(this.selectedUser()!.balance_amount) > 0) {
        payer_name = `${this.user?.first_name}${this.user?.last_name ? ` ${this.user?.last_name}` : ''}`;
        payer_image = this.user?.image_url;
        debtor_name = `${this.selectedUser()?.friend?.first_name}${this.selectedUser()?.friend?.last_name ? ` ${this.selectedUser()?.friend?.last_name}` : ''}`;
        debtor_image = this.selectedUser()?.friend.image_url;
      } else {
        debtor_name = `${this.user?.first_name}${this.user?.last_name ? ` ${this.user?.last_name}` : ''}`;
        debtor_image = this.user?.image_url;
        payer_name = `${this.selectedUser()?.friend?.first_name}${this.selectedUser()?.friend?.last_name ? ` ${this.selectedUser()?.friend?.last_name}` : ''}`;
        payer_image = this.selectedUser()?.friend.image_url;
      }

      const dialogRef = this.dialog.open(SettlementComponent, {
        data: {
          payer_name,
          debtor_name,
          total_amount,
          debtor_image,
          payer_image,
        },
        // width: window.innerWidth > 600 ? '100px' : '90%',
        enterAnimationDuration: '200ms',
        exitAnimationDuration: '200ms',
      });
      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          this.httpClient
            .post<ExpenseResponse>(
              `${API_URLS.addExpense}/${this.selectedUser()?.conversation_id}`,
              result,
              {
                withCredentials: true,
              },
            )
            .subscribe({
              next: (response: ExpenseResponse) => {
                this.cdr.detectChanges();
                this.scrollToBottom();
                if (response.data.payer_id === this.user?.user_id) {
                  this.selectedUser()!.balance_amount = JSON.stringify(
                    parseFloat(this.selectedUser()!.balance_amount) +
                      parseFloat(response.data.debtor_amount),
                  );
                } else {
                  this.selectedUser()!.balance_amount = JSON.stringify(
                    parseFloat(this.selectedUser()!.balance_amount) -
                      parseFloat(response.data.debtor_amount),
                  );
                }
                this.toastr.success('Settled up successfully', 'Success');
              },
            });
        }
      });
    }
  }

  getArchiveStatus(): string {
    const user = this.selectedUser();
    if (
      user?.archival_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.archival_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.archival_status === 'FRIEND2')
    ) {
      return 'Unarchived';
    }
    return 'Archived';
  }

  getArchiveLabel(): string {
    const user = this.selectedUser();
    return user?.archival_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.archival_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.archival_status === 'FRIEND2')
      ? 'Unarchive'
      : 'Archive';
  }

  getBlockStatus(): string {
    const user = this.selectedUser();
    if (
      user?.block_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.block_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.block_status === 'FRIEND2')
    ) {
      return 'Unblocked';
    }
    return 'Blocked';
  }

  getBlockLabel(): string {
    const user = this.selectedUser();
    return user?.block_status === 'BOTH' ||
      (user?.status === 'SENDER' && user?.block_status === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.block_status === 'FRIEND2')
      ? 'Unblock'
      : 'Block';
  }

  archiveBlock(id: string, type: string) {
    this.httpClient
      .patch(
        `${API_URLS.archiveBlockRequest}/${id}`,
        { type },
        { withCredentials: true },
      )
      .subscribe({
        next: () => {
          if (type === 'archived') {
            this.toastr.success(
              `${this.getArchiveStatus()} Successfully`,
              'Success',
            );
          } else {
            this.toastr.success(
              `${this.getBlockStatus()} Successfully`,
              'Success',
            );
          }
        },
      });
  }

  openAddExpenseDialog() {
    const dialogRef = this.dialog.open(FriendsExpenseComponent, {
      data: [this.user, this.selectedUser()],
      width: window.innerWidth > 600 ? '100px' : '90%',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (!result.description) delete result.description;
      if (!result.receipt) delete result.receipt;
      if (result) {
        this.httpClient
          .post<ExpenseResponse>(
            `${API_URLS.addExpense}/${this.selectedUser()?.conversation_id}`,
            result,
            {
              withCredentials: true,
            },
          )
          .subscribe({
            next: (response: ExpenseResponse) => {
              if (response.data.payer_id === this.user?.user_id)
                response.data.payer = this.user_name;
              else
                response.data.payer = `${this.selectedUser()?.friend.first_name}${this.selectedUser()?.friend.last_name || ''}`;
              this.expenses.set([...this.expenses(), response.data]);
              this.cdr.detectChanges();
              this.scrollToBottom();
              if (response.data.payer_id === this.user?.user_id) {
                this.selectedUser()!.balance_amount = JSON.stringify(
                  parseFloat(this.selectedUser()!.balance_amount) +
                    parseFloat(response.data.debtor_amount),
                );
              } else {
                this.selectedUser()!.balance_amount = JSON.stringify(
                  parseFloat(this.selectedUser()!.balance_amount) -
                    parseFloat(response.data.debtor_amount),
                );
              }
              this.toastr.success('Expense Created successfully', 'Success');
            },
          });
      }
    });
  }
}
