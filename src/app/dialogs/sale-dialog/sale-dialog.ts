import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, filter, switchMap } from 'rxjs';
import { Medicine, MedicineDetails } from '../../models/medicine';
import { Sale } from '../../models/sale';
import { MedicineService } from '../../services/medicine.service';
import { SaleService } from '../../services/sale.service';
import { getErrorMessage } from '../../services/error-message';

export interface SaleDialogData {
  medicineId?: number;
}

@Component({
  selector: 'app-sale-dialog',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './sale-dialog.html',
  styleUrl: './sale-dialog.css'
})
export class SaleDialog implements OnInit {
  private medicineService = inject(MedicineService);
  private saleService = inject(SaleService);
  private dialogRef = inject(MatDialogRef<SaleDialog, Sale>);
  data: SaleDialogData = inject(MAT_DIALOG_DATA, { optional: true }) ?? {};

  selected = signal<MedicineDetails | null>(null);
  options = signal<Medicine[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  searchControl = new FormControl('');
  quantity = 1;

  ngOnInit(): void {
    // opened from the "Sell" button, the medicine is already known
    if (this.data.medicineId) {
      this.loadMedicine(this.data.medicineId);
    }

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        filter(text => typeof text === 'string' && text.trim().length >= 2),
        switchMap(text => this.medicineService.getMedicines({
          search: text!.trim(), filter: 'all', sortBy: 'fullName', sortDir: 'asc', page: 1, pageSize: 10
        }))
      )
      .subscribe(result => this.options.set(result.items));
  }

  loadMedicine(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.medicineService.getMedicine(id).subscribe({
      next: medicine => {
        this.selected.set(medicine);
        this.quantity = 1;
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onOptionSelected(medicine: Medicine): void {
    this.options.set([]);
    this.loadMedicine(medicine.id);
  }

  changeMedicine(): void {
    this.selected.set(null);
    this.searchControl.setValue('');
    this.error.set('');
  }

  get total(): number {
    const medicine = this.selected();
    return medicine ? medicine.price * (this.quantity || 0) : 0;
  }

  save(): void {
    const medicine = this.selected();
    if (!medicine) {
      return;
    }

    if (!Number.isInteger(this.quantity) || this.quantity < 1 || this.quantity > medicine.quantity) {
      this.error.set(`Quantity must be between 1 and ${medicine.quantity}.`);
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.saleService.addSale(medicine.id, this.quantity).subscribe({
      next: sale => this.dialogRef.close(sale),
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.saving.set(false);
      }
    });
  }
}
