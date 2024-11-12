import {
  Component,
  inject,
  OnInit,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../auth/auth.service';
import { ChartDataset, ChartOptions } from 'chart.js';
import { ToastrService } from 'ngx-toastr';
import { DashboardService } from './dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private toastrService = inject(ToastrService);
  private dashboardService = inject(DashboardService);
  balanceAmount = signal<number>(0);

  @ViewChildren(BaseChartDirective) charts?: QueryList<BaseChartDirective>;

  pieChartData1: {
    labels: string[];
    datasets: ChartDataset<'pie'>[];
  } = {
    labels: ['1-1000', '1001-5000', '5001-10000', '10001-15000', '>15000'],
    datasets: [
      {
        data: [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        hoverOffset: 20,
      },
    ],
  };

  pieChartData2: {
    labels: string[];
    datasets: ChartDataset<'pie'>[];
  } = {
    labels: ['Amount Lent', 'Amount Borrowed'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#2E7D32', '#F44336'],
        hoverOffset: 20,
      },
    ],
  };

  pieChartData3: {
    labels: string[];
    datasets: ChartDataset<'pie'>[];
  } = {
    labels: ['Friend 1', 'Friend 2', 'Friend 3', 'Friend 4', 'Others'],
    datasets: [
      {
        data: [],
        backgroundColor: ['#FF9F40', '#9966FF', '#4BC0C0', '#2E7D32', 'grey'],
        hoverOffset: 20,
      },
    ],
  };

  pieChartData4: {
    labels: string[];
    datasets: ChartDataset<'pie'>[];
  } = {
    labels: ['Group 1', 'Group 2', 'Group 3', 'Group 4', 'Others'],
    datasets: [
      {
        data: [1000, 950, 900, 850, 800],
        backgroundColor: ['#FF9F40', '#9966FF', '#4BC0C0', '#2E7D32', 'grey'],
        hoverOffset: 20,
      },
    ],
  };

  barChartData: {
    labels: string[];
    datasets: ChartDataset<'bar'>[];
  } = {
    labels: [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ],
    datasets: [
      {
        label: 'Monthly Expense',
        data: [],
        backgroundColor: [
          '#FF0000',
          '#00FF00',
          '#0000FF',
          '#FFFF00',
          '#800080',
          '#00FFFF',
          '#FF00FF',
          '#FFA500',
          '#FFC0CB',
          '#A52A2A',
          '#808080',
          '#000000',
        ],
      },
    ],
  };

  // Centralized base ChartOptions configuration
  private baseChartOptions: ChartOptions<'pie' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'end',
        labels: {
          font: {
            size: 10,
          },
          padding: 10,
          boxWidth: 20,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeInOutQuad',
        from: 0.3,
        to: 0.5,
        loop: true,
      },
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
  };

  // Specific options for each chart, extending the base configuration
  pieChartOptions1: ChartOptions<'pie'> = {
    ...this.baseChartOptions,
    plugins: {
      ...this.baseChartOptions.plugins,
      title: {
        display: true,
        text: 'Number of Expenses by Amount Range', // Title for the first pie chart
        font: {
          size: 18,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
  };

  pieChartOptions2: ChartOptions<'pie'> = {
    ...this.baseChartOptions,
    elements: {
      arc: {
        offset: [10, 10], // Adjust this array for consistent spacing
        borderRadius: 5,
      },
    },
    plugins: {
      ...this.baseChartOptions.plugins,
      title: {
        display: true,
        text: `Balance Amount: ${this.balanceAmount()}`,
        font: {
          size: 18,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
    cutout: '40%',
  };

  pieChartOptions3: ChartOptions<'pie'> = {
    ...this.baseChartOptions,
    plugins: {
      ...this.baseChartOptions.plugins,
      title: {
        display: true,
        text: 'Top Cash Flow Partners',
        font: {
          size: 18,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
  };

  pieChartOptions4: ChartOptions<'pie'> = {
    ...this.baseChartOptions,
    plugins: {
      ...this.baseChartOptions.plugins,
      title: {
        display: true,
        text: 'Top Cash Flow Groups',
        font: {
          size: 18,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
    },
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
      },
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'easeInOutQuad',
        from: 0.3,
        to: 0.5,
        loop: true,
      },
    },
    hover: {
      mode: 'nearest',
      intersect: true,
    },
  };

  ngOnInit(): void {
    this.loadAllExpenses();
  }

  private loadAllExpenses() {
    this.dashboardService.getAllExpenses().subscribe({
      next: (response) => {
        this.pieChartData1.datasets[0].data = response.expensesRange;
        this.pieChartData2.datasets[0].data = response.balanceAmounts;
        this.balanceAmount.set(
          response.balanceAmounts[0] - response.balanceAmounts[1],
        );
        this.pieChartOptions2 = {
          ...this.pieChartOptions2,
          plugins: {
            ...this.pieChartOptions2.plugins,
            title: {
              ...this.pieChartOptions2.plugins?.title,
              text: `Balance Amount: ${Math.abs(this.balanceAmount())}`,
              color: this.balanceAmount() < 0 ? '#F44336' : '#2E7D32',
            },
          },
        };
        this.pieChartData3.datasets[0].data = response.topFriends;
        this.pieChartData3.labels = response.topFriendsName;
        this.barChartData.datasets[0].data = response.monthlyExpense;
        this.charts?.forEach((chart) => chart?.chart?.update());
      },
    });
  }
}
