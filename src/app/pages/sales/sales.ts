import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Sale, SalesSummary } from '../../models/sale';
import { SaleService } from '../../services/sale.service';
import { getErrorMessage } from '../../services/error-message';
import { SaleDialog } from '../../dialogs/sale-dialog/sale-dialog';

@Component({
  selector: 'app-sales',
  imports: [CurrencyPipe, DatePipe, MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './sales.html',
  styleUrl: './sales.css'
})
export class SalesPage implements OnInit {
  private saleService = inject(SaleService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  columns = ['soldOn', 'medicineName', 'quantity', 'unitPrice', 'totalAmount'];
  pageSizes = [10, 50, 100, 200, 500];

  summary = signal<SalesSummary | null>(null);
  sales = signal<Sale[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal('');

  page = 1;
  pageSize = 10;

  ngOnInit(): void {
    this.loadSales();
    this.loadSummary();
  }

  loadSummary(): void {
    this.saleService.getSummary().subscribe({
      next: summary => this.summary.set(summary),
      error: () => this.summary.set(null)
    });
  }

  loadSales(): void {
    this.loading.set(true);
    this.error.set('');

    this.saleService.getSales(this.page, this.pageSize).subscribe({
      next: result => {
        this.sales.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadSales();
  }

  openAddSale(): void {
    this.dialog
      .open(SaleDialog, { width: '560px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(sale => {
        if (sale) {
          this.snackBar.open(`Sold ${sale.quantity} x ${sale.medicineName}.`, 'OK', { duration: 3000 });
          this.page = 1;
          this.loadSales();
          this.loadSummary();
        }
      });
  }
}
