import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Medicine, MedicineSummary } from '../../models/medicine';
import { MedicineService } from '../../services/medicine.service';
import { getErrorMessage } from '../../services/error-message';
import { AddMedicineDialog } from '../../dialogs/add-medicine-dialog/add-medicine-dialog';
import { SaleDialog } from '../../dialogs/sale-dialog/sale-dialog';

@Component({
  selector: 'app-medicine-list',
  imports: [
    CurrencyPipe,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './medicine-list.html',
  styleUrl: './medicine-list.css'
})
export class MedicineList implements OnInit, OnDestroy {
  private medicineService = inject(MedicineService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private searchText$ = new Subject<string>();
  private searchSub?: Subscription;

  columns = ['fullName', 'brand', 'expiryDate', 'quantity', 'price', 'status', 'actions'];
  pageSizes = [10, 50, 100, 200, 500];

  summary = signal<MedicineSummary | null>(null);
  medicines = signal<Medicine[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal('');

  search = '';
  filter = 'all';
  sortBy = 'fullName';
  sortDir = 'asc';
  page = 1;
  pageSize = 10;

  ngOnInit(): void {
    // wait until the user stops typing before calling the api
    this.searchSub = this.searchText$
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(text => {
        this.search = text;
        this.page = 1;
        this.loadMedicines();
      });

    this.loadMedicines();
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  loadMedicines(): void {
    this.loading.set(true);
    this.error.set('');

    this.medicineService
      .getMedicines({
        search: this.search,
        filter: this.filter,
        sortBy: this.sortBy,
        sortDir: this.sortDir,
        page: this.page,
        pageSize: this.pageSize
      })
      .subscribe({
        next: result => {
          this.medicines.set(result.items);
          this.totalCount.set(result.totalCount);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(getErrorMessage(err));
          this.loading.set(false);
        }
      });
  }

  loadSummary(): void {
    this.medicineService.getSummary().subscribe({
      next: summary => this.summary.set(summary),
      error: () => this.summary.set(null)
    });
  }

  onSearch(text: string): void {
    this.searchText$.next(text.trim());
  }

  onFilterChange(filter: string): void {
    this.filter = filter;
    this.page = 1;
    this.loadMedicines();
  }

  onSortChange(sort: Sort): void {
    this.sortBy = sort.direction ? sort.active : 'fullName';
    this.sortDir = sort.direction || 'asc';
    this.page = 1;
    this.loadMedicines();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadMedicines();
  }

  // red wins over yellow when both apply
  rowClass(m: Medicine): string {
    if (m.isExpiringSoon) {
      return 'row-red';
    }
    if (m.isLowStock) {
      return 'row-yellow';
    }
    return '';
  }

  canSell(m: Medicine): boolean {
    return !m.isExpired && m.quantity > 0;
  }

  daysLeft(m: Medicine): number {
    const [y, mo, d] = m.expiryDate.split('-').map(Number);
    const expiry = new Date(y, mo - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((expiry.getTime() - today.getTime()) / 86400000);
  }

  expiryText(m: Medicine): string {
    const days = this.daysLeft(m);
    if (days < 0) {
      return `Expired ${-days} day${days === -1 ? '' : 's'} ago`;
    }
    if (days === 0) {
      return 'Expires today';
    }
    return `In ${days} day${days === 1 ? '' : 's'}`;
  }

  // small icon in front of the name, based on the type of medicine
  medicineIcon(m: Medicine): string {
    const name = m.fullName.toLowerCase();
    if (name.includes('syrup') || name.includes('suspension')) {
      return 'water_drop';
    }
    if (name.includes('injection')) {
      return 'vaccines';
    }
    if (name.includes('cream') || name.includes('gel') || name.includes('ointment')) {
      return 'sanitizer';
    }
    return 'medication';
  }

  openAddMedicine(): void {
    this.dialog
      .open(AddMedicineDialog, { width: '640px', maxWidth: '95vw' })
      .afterClosed()
      .subscribe(medicine => {
        if (medicine) {
          this.snackBar.open(`${medicine.fullName} added.`, 'OK', { duration: 3000 });
          this.loadMedicines();
          this.loadSummary();
        }
      });
  }

  openSale(m: Medicine): void {
    this.dialog
      .open(SaleDialog, { width: '560px', maxWidth: '95vw', data: { medicineId: m.id } })
      .afterClosed()
      .subscribe(sale => {
        if (sale) {
          this.snackBar.open(`Sold ${sale.quantity} x ${sale.medicineName}.`, 'OK', { duration: 3000 });
          this.loadMedicines();
          this.loadSummary();
        }
      });
  }
}
