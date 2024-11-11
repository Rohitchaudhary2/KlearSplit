import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../auth/auth.service';
import { ChartDataset, ChartOptions } from 'chart.js';
import { FriendsService } from '../friends/friends.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  authService = inject(AuthService);
  private friendService = inject(FriendsService);
  private toastrService = inject(ToastrService);

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

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

  pieChartData2 = {
    labels: ['Category A', 'Category B', 'Category C'],
    datasets: [
      {
        data: [40, 30, 30],
        backgroundColor: ['#4BC0C0', '#FF6384', '#36A2EB'],
        hoverOffset: 20,
      },
    ],
  };

  pieChartData3 = {
    labels: ['Segment 1', 'Segment 2', 'Segment 3'],
    datasets: [
      {
        data: [25, 45, 30],
        backgroundColor: ['#FF9F40', '#9966FF', '#4BC0C0'],
        hoverOffset: 20,
      },
    ],
  };

  barChartData = {
    labels: ['January', 'February', 'March'],
    datasets: [
      {
        label: 'Monthly Sales',
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
        text: 'Expense Distribution by Amount Range', // Title for the first pie chart
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
    plugins: {
      ...this.baseChartOptions.plugins,
      title: {
        display: true,
        text: 'Category Distribution', // Title for the second pie chart
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

  pieChartOptions3: ChartOptions<'pie'> = {
    ...this.baseChartOptions,
    plugins: {
      ...this.baseChartOptions.plugins,
      title: {
        display: true,
        text: 'Category Distribution', // Title for the second pie chart
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
    this.loadExpenseData('3de5115e-4d6f-4327-8e41-69dd34ba03c6');
  }

  private loadExpenseData(conversationId: string): void {
    this.friendService.fetchExpensesByRange(conversationId).subscribe({
      next: (response) => {
        this.pieChartData1.datasets[0].data = response;
        this.chart?.update();
      },
      error: () => {
        this.toastrService.error('Error fetching the expense data', 'Error');
      },
    });
  }
}
