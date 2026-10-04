import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Article, CreateArticleDto } from '../../models/article.model';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/articles`;

  getAll(): Observable<Article[]> {
    return this.http.get<Article[]>(this.base);
  }

  getById(id: string): Observable<Article> {
    return this.http.get<Article>(`${this.base}/${id}`);
  }

  uploadImages(files: File[]): Observable<{ urls: string[] }> {
    return this.http.post<{ presignedUrls: { uploadUrl: string; key: string }[] }>(
      `${environment.apiUrl}/uploads/presign`,
      { folder: 'articles', files: files.map(f => ({ name: f.name, type: f.type || 'image/jpeg' })) },
    ).pipe(
      switchMap(({ presignedUrls }) =>
        new Observable<{ urls: string[] }>(observer => {
          Promise.all(presignedUrls.map(({ uploadUrl }, i) =>
            fetch(uploadUrl, { method: 'PUT', body: files[i], headers: { 'Content-Type': files[i].type || 'image/jpeg' } })
              .then(r => { if (!r.ok) throw new Error(`S3 ${r.status}`); }),
          )).then(() => {
            this.http.post<{ urls: string[] }>(`${environment.apiUrl}/uploads/process`,
              { folder: 'articles', keys: presignedUrls.map(p => p.key), watermark: false },
            ).subscribe({ next: v => { observer.next(v); observer.complete(); }, error: e => observer.error(e) });
          }).catch(e => observer.error(e));
        }),
      ),
    );
  }

  create(dto: CreateArticleDto): Observable<Article> {
    return this.http.post<Article>(this.base, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  deleteMany(ids: string[]): Observable<void> {
    return this.http.delete<void>(this.base, { body: { ids } });
  }
}
