import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MedicineService } from '../../services/medicine.service';
import { MedicineDetails } from '../../models/medicine';
import { getErrorMessage } from '../../services/error-message';

function maxTwoDecimals(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === '') {
    return null;
  }
  return /^\d+(\.\d{1,2})?$/.test(String(value)) ? null : { decimals: true };
}

function todayAsString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function notInPast(control: AbstractControl): ValidationErrors | null {
  if (!control.value) {
    return null;
  }
  return control.value < todayAsString() ? { pastDate: true } : null;
}

@Component({
  selector: 'app-add-medicine-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './add-medicine-dialog.html',
  styleUrl: './add-medicine-dialog.css'
})
export class AddMedicineDialog {
  private fb = inject(FormBuilder);
  private medicineService = inject(MedicineService);
  private dialogRef = inject(MatDialogRef<AddMedicineDialog, MedicineDetails>);

  today = todayAsString();
  saving = signal(false);
  error = signal('');

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    brand: ['', [Validators.required, Validators.maxLength(100)]],
    expiryDate: ['', [Validators.required, notInPast]],
    quantity: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    price: [null as number | null, [Validators.required, Validators.min(0.01), maxTwoDecimals]],
    notes: ['', Validators.maxLength(1000)]
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;
    this.saving.set(true);
    this.error.set('');

    this.medicineService
      .addMedicine({
        fullName: value.fullName!.trim(),
        brand: value.brand!.trim(),
        expiryDate: value.expiryDate!,
        quantity: Number(value.quantity),
        price: Number(value.price),
        notes: value.notes?.trim() || null
      })
      .subscribe({
        next: medicine => this.dialogRef.close(medicine),
        error: (err: HttpErrorResponse) => {
          this.error.set(getErrorMessage(err));
          this.saving.set(false);
        }
      });
  }
}
