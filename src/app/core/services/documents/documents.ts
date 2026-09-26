import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Document, CreateDocumentDto } from '../../models/document.model';

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/documents`;

  getAll(): Observable<Document[]> {
    return this.http.get<Document[]>(this.base);
  }

  uploadFile(file: File): Observable<{ url: string; fileName: string; fileSize: number }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<{ url: string; fileName: string; fileSize: number }>(
      `${environment.apiUrl}/uploads/documents`,
      fd,
    );
  }

  create(dto: CreateDocumentDto): Observable<Document> {
    return this.http.post<Document>(this.base, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  deleteMany(ids: string[]): Observable<void> {
    return this.http.delete<void>(this.base, { body: { ids } });
  }
}
