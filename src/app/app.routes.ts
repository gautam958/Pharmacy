import { Routes } from '@angular/router';
import { MedicineList } from './pages/medicine-list/medicine-list';
import { SalesPage } from './pages/sales/sales';

export const routes: Routes = [
  { path: '', redirectTo: 'medicines', pathMatch: 'full' },
  { path: 'medicines', component: MedicineList, title: 'Medicines - ABC Pharmacy' },
  { path: 'sales', component: SalesPage, title: 'Sales - ABC Pharmacy' },
  { path: '**', redirectTo: 'medicines' }
];
