import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Project, CreateProjectDto } from '../../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/projects`;

  getAll(): Observable<Project[]> {
    return this.http.get<Project[]>(this.base);
  }

  getById(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  uploadImages(files: File[]): Observable<{ urls: string[] }> {
    const fd = new FormData();
    files.forEach(f => fd.append('files', f));
    return this.http.post<{ urls: string[] }>(`${environment.apiUrl}/uploads/projects`, fd);
  }

  create(dto: CreateProjectDto): Observable<Project> {
    return this.http.post<Project>(this.base, dto);
  }

  update(id: string, dto: Partial<CreateProjectDto>): Observable<Project> {
    return this.http.patch<Project>(`${this.base}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  deleteMany(ids: string[]): Observable<void> {
    return this.http.delete<void>(this.base, { body: { ids } });
  }
}
