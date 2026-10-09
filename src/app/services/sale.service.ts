import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { PagedResult } from '../models/medicine';
import { Sale, SalesSummary } from '../models/sale';

@Injectable({ providedIn: 'root' })
export class SaleService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/sales`;

  getSales(page: number, pageSize: number): Observable<PagedResult<Sale>> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResult<Sale>>(this.url, { params });
  }

  getSummary(): Observable<SalesSummary> {
    return this.http.get<SalesSummary>(`${this.url}/summary`);
  }

  addSale(medicineId: number, quantity: number): Observable<Sale> {
    return this.http.post<Sale>(this.url, { medicineId, quantity });
  }
}
