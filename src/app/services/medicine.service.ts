import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AddMedicine, Medicine, MedicineDetails, PagedResult } from '../models/medicine';

export interface MedicineFilter {
  search: string;
  filter: string;
  sortBy: string;
  sortDir: string;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/medicines`;

  getMedicines(f: MedicineFilter): Observable<PagedResult<Medicine>> {
    const params = new HttpParams()
      .set('search', f.search)
      .set('filter', f.filter)
      .set('sortBy', f.sortBy)
      .set('sortDir', f.sortDir)
      .set('page', f.page)
      .set('pageSize', f.pageSize);

    return this.http.get<PagedResult<Medicine>>(this.url, { params });
  }

  getMedicine(id: number): Observable<MedicineDetails> {
    return this.http.get<MedicineDetails>(`${this.url}/${id}`);
  }

  addMedicine(medicine: AddMedicine): Observable<MedicineDetails> {
    return this.http.post<MedicineDetails>(this.url, medicine);
  }
}
