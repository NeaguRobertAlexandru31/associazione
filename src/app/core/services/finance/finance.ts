import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type TransactionType = 'donazione' | 'quota';

export interface Transaction {
  id:        string;
  type:      TransactionType;
  amount:    number;
  name:      string;
  email:     string | null;
  method:    string;
  category?: string;
  year?:     number;
  createdAt: string;
}

export interface FinanceSummary {
  totale:          number;
  totaleQuote:     number;
  totaleDonazioni: number;
  questoMese:      number;
  transactions:    Transaction[];
}

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private http = inject(HttpClient);

  getSummary(): Observable<FinanceSummary> {
    return this.http.get<FinanceSummary>(`${environment.apiUrl}/finance/summary`);
  }
}
