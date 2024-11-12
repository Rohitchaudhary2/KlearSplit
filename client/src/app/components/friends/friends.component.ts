import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewInit,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CombinedExpense,
  CombinedMessage,
  ExpenseData,
  ExpenseDeletedEvent,
  ExpenseResponse,
  FriendData,
  MessageData,
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
import { ViewExpensesComponent } from './friends-expense/view-expenses/view-expenses.component';
import { FriendsService } from './friends.service';
import { MessageComponent } from './message/message.component';
import { ExpenseComponent } from './expense/expense.component';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    FormsModule,
    FriendsListComponent,
    FriendsExpenseComponent,
    NgClass,
    MessageComponent,
    ExpenseComponent,
  ],
  templateUrl: './friends.component.html',
  styleUrl: './friends.component.css',
})
export class FriendsComponent implements OnDestroy, AfterViewInit {
  messageContainer = viewChild<ElementRef>('messageContainer');
  private cdr = inject(ChangeDetectorRef);
  private toastr = inject(ToastrService);
  private dialog = inject(MatDialog);
  private friendsService = inject(FriendsService);

  private tokenService = inject(TokenService);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  user = this.authService.currentUser();
  user_name = `${this.authService.currentUser()?.first_name}${this.authService.currentUser()?.last_name ? ` ${this.authService.currentUser()?.last_name}` : ''}`;

  selectedUser = signal<FriendData | undefined>(undefined);
  messageInput = '';

  messages = signal<MessageData[]>([]);
  showMessages = signal<'Messages' | 'Expenses' | 'All'>('All');

  expenses = signal<ExpenseData[] | []>([]);
  combinedView = signal<(CombinedMessage | CombinedExpense)[]>([]);

  charCount = 0;
  charCountExceeded = false;

  isImageLoaded = false;
  pageMessage = 1;
  pageSizeMessage = 10;
  pageExpense = 1;
  pageSizeExpense = 10;
  pageCombined = 1;
  pageSizeCombined = 20;
  loading = false;
  allMessagesLoaded = false;
  allExpensesLoaded = false;
  allCombinedLoaded = false;
  scrollPosition = 0;
  errorNumber = 0;

  addExpenseLoader = false;

  onImageLoad() {
    this.isImageLoaded = true; // Set loaded state to true
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

  @HostListener('scroll', ['$event'])
  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollTop === 0 && !this.loading) {
      this.scrollPosition = element.scrollHeight;
      this.loadItems(element);
    }
  }

  onSelectUser(friend: FriendData | undefined) {
    if (this.selectedUser()) {
      // Leave the previous room
      this.socketService.leaveRoom(this.selectedUser()!.conversation_id);
      // Remove the existing 'onNewMessage' listener
      this.socketService.removeNewMessageListener();
      this.messages.set([]);
      this.expenses.set([]);
      this.combinedView.set([]);
      this.pageMessage = 1;
      this.pageExpense = 1;
      this.pageCombined = 1;
      this.messageInput = '';
      this.allMessagesLoaded = false;
      this.allExpensesLoaded = false;
      this.allCombinedLoaded = false;
    }

    this.selectedUser.set(friend);

    if (this.selectedUser()) {
      this.fetchMessagesAndExpenses(true, true, true, null);
      // Join the room for the new conversation
      this.socketService.joinRoom(this.selectedUser()!.conversation_id);

      // Listen for new messages from the server for the new room
      this.socketService.onNewMessage((message: MessageData) => {
        this.messages.set([...this.messages(), message]);
        this.combinedView.set([
          ...this.combinedView(),
          { ...message, type: 'message' },
        ]);
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    }
  }

  loadItems(element: HTMLElement) {
    if (this.showMessages() === 'All') this.onLoadCombined(element);
    else if (this.showMessages() === 'Messages') this.onLoadMessages(element);
    else this.onLoadExpenses(element);
  }

  onLoadMessages(element: HTMLElement) {
    this.fetchMessagesAndExpenses(true, false, false, element); // Load only messages
  }

  onLoadExpenses(element: HTMLElement) {
    this.fetchMessagesAndExpenses(false, true, false, element); // Load only expenses
  }

  onLoadCombined(element: HTMLElement) {
    this.fetchMessagesAndExpenses(false, false, true, element); // Load combined view
  }

  fetchMessagesAndExpenses(
    loadMessages: boolean,
    loadExpenses: boolean,
    loadCombined: boolean,
    element: HTMLElement | null,
  ) {
    if (this.loading) return;
    if (
      (loadMessages && this.allMessagesLoaded) ||
      (loadExpenses && this.allExpensesLoaded) ||
      (loadCombined && this.allCombinedLoaded)
    )
      return;

    this.loading = true;
    this.friendsService
      .fetchMessagesAndExpenses(
        this.selectedUser()!.conversation_id,
        loadMessages,
        loadExpenses,
        loadCombined,
        this.pageMessage,
        this.pageSizeMessage,
        this.pageExpense,
        this.pageSizeExpense,
        this.pageCombined,
        this.pageSizeCombined,
      )
      .subscribe({
        next: ({ messages, expenses, combined }) => {
          if (
            !this.allMessagesLoaded &&
            loadMessages &&
            messages.length < this.pageSizeMessage
          )
            this.allMessagesLoaded = true;
          if (
            !this.allExpensesLoaded &&
            loadExpenses &&
            expenses.length < this.pageSizeExpense
          )
            this.allExpensesLoaded = true;
          if (
            !this.allCombinedLoaded &&
            loadCombined &&
            combined.length < this.pageSizeCombined
          )
            this.allCombinedLoaded = true;
          this.messages.set([...messages, ...this.messages()]);
          this.expenses.set([...expenses, ...this.expenses()]);
          this.combinedView.set([...combined, ...this.combinedView()]);

          if (
            this.pageMessage === 1 ||
            this.pageExpense === 1 ||
            this.pageCombined === 1
          ) {
            this.cdr.detectChanges();
            this.scrollToBottom();
          } else {
            this.cdr.detectChanges();
            // After loading new items, calculate the new scroll position
            const newScrollHeight = element!.scrollHeight;

            // Adjust the scroll position to keep the view consistent
            const scrollDiff = newScrollHeight! - this.scrollPosition;
            element!.scrollTop = element!.scrollTop + scrollDiff - 100;
          }
          if (loadMessages) this.pageMessage++;
          if (loadExpenses) this.pageExpense++;
          if (loadCombined) this.pageCombined++;

          this.loading = false;
        },
      });
  }

  onInputChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.charCount = textarea.value.length;
    this.charCountExceeded = this.charCount === 512;
  }

  combineMessagesAndExpenses(
    messages: MessageData[],
    expenses: ExpenseData[],
  ): (CombinedMessage | CombinedExpense)[] {
    const combined = [
      ...messages.map((m) => ({ ...m, type: 'message' })),
      ...expenses.map((e) => ({ ...e, type: 'expense' })),
    ];

    // Sort combined array by createdAt
    combined.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return combined;
  }

  isCombinedExpense(
    item: CombinedMessage | CombinedExpense,
  ): item is CombinedExpense {
    return (item as CombinedExpense).payer_id !== undefined;
  }

  getSettleUpStatus() {
    if (parseFloat(this.selectedUser()!.balance_amount) === 0) {
      return 'All Settled';
    } else {
      return 'Settle up';
    }
  }

  toggleView(filter: 'Messages' | 'Expenses' | 'All') {
    this.showMessages.set(filter);
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
      data: [expenses, this.selectedUser()?.conversation_id],
      maxWidth: '91vw',
      maxHeight: '85vh',
      height: '85%',
      width: '100%',
      position: dialogPosition,
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    });
    dialogRef.componentInstance.expenseDeleted.subscribe(
      ({ id, payer_id, debtor_amount }) => {
        this.onDeleteExpense({ id, payer_id, debtor_amount });
      },
    );
    dialogRef.afterClosed().subscribe();
  }

  onDeleteExpense({ id, payer_id, debtor_amount }: ExpenseDeletedEvent) {
    this.selectedUser()!.balance_amount =
      this.user?.user_id === payer_id
        ? JSON.stringify(
            parseFloat(this.selectedUser()!.balance_amount) -
              parseFloat(debtor_amount),
          )
        : JSON.stringify(
            parseFloat(this.selectedUser()!.balance_amount) +
              parseFloat(debtor_amount),
          );
    const updatedExpenses = this.expenses().filter(
      (expense: ExpenseData) => expense.friend_expense_id !== id,
    );
    this.expenses.set(updatedExpenses);
    const updatedCombinedView = this.combinedView().filter(
      (item: CombinedMessage | CombinedExpense) => {
        if (this.isCombinedExpense(item)) return item.friend_expense_id !== id;
        else return true;
      },
    );
    this.combinedView.set(updatedCombinedView);
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
          this.friendsService
            .addExpense(this.selectedUser()!.conversation_id, result)
            .subscribe({
              next: (response: ExpenseResponse) => {
                if (response.data.payer_id === this.user?.user_id)
                  response.data.payer = this.user_name;
                else
                  response.data.payer = `${this.selectedUser()?.friend.first_name}${this.selectedUser()?.friend.last_name || ''}`;
                this.expenses.set([...this.expenses(), response.data]);
                const combinedData = [
                  ...this.combinedView(),
                  { ...response.data, type: 'message' },
                ];
                this.combinedView.set(combinedData);
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

  getArchiveLabel(): string {
    return this.getStatusLabel('archival_status', 'Archive', 'Unarchive');
  }

  getBlockLabel(): string {
    return this.getStatusLabel('block_status', 'Block', 'Unblock');
  }

  private getStatusLabel(
    statusField: 'archival_status' | 'block_status',
    defaultLabel: string,
    alternateLabel: string,
  ): string {
    const user = this.selectedUser();

    // Check conditions for unblocking/unarchiving based on block_status or archival_status
    if (
      user?.[statusField] === 'BOTH' ||
      (user?.status === 'SENDER' && user?.[statusField] === 'FRIEND1') ||
      (user?.status === 'RECEIVER' && user?.[statusField] === 'FRIEND2')
    ) {
      return alternateLabel;
    }

    return defaultLabel;
  }

  archiveBlock(id: string, type: string) {
    this.friendsService.archiveBlockRequest(id, type).subscribe({
      next: () => {
        if (type === 'archived') {
          this.toastr.success(
            `${this.getArchiveLabel()}d Successfully`,
            'Success',
          );
        } else {
          this.toastr.success(
            `${this.getBlockLabel()}ed Successfully`,
            'Success',
          );
          if (this.getBlockLabel() === 'Block') {
            if (this.selectedUser()?.block_status !== 'NONE') {
              this.selectedUser()!.block_status = 'BOTH';
            } else {
              this.selectedUser()!.block_status =
                this.selectedUser()?.status === 'SENDER'
                  ? 'FRIEND1'
                  : 'FRIEND2';
            }
          } else {
            if (this.selectedUser()?.block_status !== 'BOTH') {
              this.selectedUser()!.block_status = 'NONE';
            } else {
              this.selectedUser()!.block_status =
                this.selectedUser()?.status === 'SENDER'
                  ? 'FRIEND2'
                  : 'FRIEND1';
            }
          }
        }
      },
    });
  }

  openAddExpenseDialog() {
    const dialogRef = this.dialog.open(FriendsExpenseComponent, {
      data: [this.user, this.selectedUser()],
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '200ms',
    });
    dialogRef.afterClosed().subscribe((data) => {
      const result = data.formData;
      const expenseData = data.expenseData;

      if (result) {
        this.addExpenseLoader = true;
        this.expenses.set([
          ...this.expenses(),
          { ...expenseData, friend_expense_id: `adding` },
        ]);
        this.combinedView.set([
          ...this.combinedView(),
          { ...expenseData, friend_expense_id: `adding` },
        ]);
        this.cdr.detectChanges();
        this.scrollToBottom();
        this.friendsService
          .addExpense(this.selectedUser()!.conversation_id, result)
          .subscribe({
            next: (response: ExpenseResponse) => {
              if (response.data.payer_id === this.user?.user_id)
                response.data.payer = this.user_name;
              else
                response.data.payer = `${this.selectedUser()?.friend.first_name}${this.selectedUser()?.friend.last_name || ''}`;
              const currExpenses = this.expenses();
              currExpenses.pop();
              this.expenses.set([...currExpenses, response.data]);
              const currCombined = this.combinedView();
              currCombined.pop();
              this.combinedView.set([
                ...currCombined,
                { ...response.data, type: 'expense' },
              ]);
              this.addExpenseLoader = false;
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
            error: () => {
              const currExpenses = this.expenses();
              currExpenses[currExpenses.length - 1].friend_expense_id =
                `error${this.errorNumber}`;
              this.expenses.set(currExpenses);
              const combinedView = this.combinedView();
              let combinedViewSize = combinedView.length;
              while (true) {
                if (
                  this.isCombinedExpense(combinedView[combinedViewSize - 1])
                ) {
                  const expense = combinedView[
                    combinedViewSize - 1
                  ] as CombinedExpense;
                  expense.friend_expense_id = `error${this.errorNumber}`;
                  break;
                }
                combinedViewSize--;
              }
              this.errorNumber++;
              this.addExpenseLoader = false;
            },
          });
      }
    });
  }

  onRetryExpenseAddition(id: string) {
    this.addExpenseLoader = true;
    const expense = this.expenses().filter(
      (expense) => expense.friend_expense_id === id,
    );
    expense[0].friend_expense_id = `retrying${this.errorNumber}`;
    const combinedExpense = this.combinedView().filter((expense) => {
      if (this.isCombinedExpense(expense)) {
        return expense.friend_expense_id === id;
      }
      return false;
    });
    const combined = combinedExpense[0] as CombinedExpense;
    combined.friend_expense_id = `retrying${this.errorNumber}`;
    this.cdr.detectChanges();
    const { friend_expense_id, ...expenseData } = expense[0];
    const formData = Object.entries(expenseData).reduce(
      (formData, [key, value]) => {
        if (value) {
          formData.append(key, value);
        }
        return formData;
      },
      new FormData(),
    );
    this.friendsService
      .addExpense(this.selectedUser()!.conversation_id, formData)
      .subscribe({
        next: (response: ExpenseResponse) => {
          if (response.data.payer_id === this.user?.user_id)
            response.data.payer = this.user_name;
          else
            response.data.payer = `${this.selectedUser()?.friend.first_name}${this.selectedUser()?.friend.last_name || ''}`;
          const updatedExpenses = this.expenses().map((expense) => {
            return expense.friend_expense_id === friend_expense_id
              ? response.data
              : expense;
          });
          this.expenses.set(updatedExpenses);
          const updatedCombinedView = this.combinedView().map((item) => {
            return this.isCombinedExpense(item) &&
              item.friend_expense_id === friend_expense_id
              ? { ...response.data, type: 'expense' }
              : item;
          });
          this.combinedView.set(updatedCombinedView);
          this.addExpenseLoader = false;
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
        error: () => {
          const updatedExpenses = this.expenses().map((expense) => {
            return expense.friend_expense_id === friend_expense_id
              ? { ...expense, friend_expense_id: `error${this.errorNumber}` }
              : expense;
          });
          this.expenses.set(updatedExpenses);
          const updatedCombinedView = this.combinedView().map((item) => {
            return this.isCombinedExpense(item) &&
              item.friend_expense_id === friend_expense_id
              ? { ...item, friend_expense_id: `error${this.errorNumber}` }
              : item;
          });
          this.combinedView.set(updatedCombinedView);
          this.errorNumber++;
          this.addExpenseLoader = false;
        },
      });
  }
}
