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

  pieChartData3 = {
    labels: ['Friend 1', 'Friend 2', 'Friend 3', 'Friend 4', 'Friend 5'],
    datasets: [
      {
        data: [2],
        backgroundColor: [
          '#FF9F40',
          '#9966FF',
          '#4BC0C0',
          '#2E7D32',
          '#36A2EB',
        ],
        hoverOffset: 20,
      },
    ],
  };

  barChartData = {
    labels: ['January', 'February', 'March'],
    datasets: [
      {
        label: 'Monthly Expense',
        data: [55, 49, 72],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
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
            size: 14,
          },
          padding: 20,
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
        text: 'Top Friends',
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
        // this.pieChartData2.datasets[0].data = response.topFriends.amount
        this.pieChartData3.datasets[0].data = [56445, 300, 200, 100, 50];
        this.charts?.forEach((chart) => chart?.chart?.update());
      },
    });
  }
}
