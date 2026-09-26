import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Document, CreateDocumentDto, DocumentCategory } from '../../../core/models/document.model';
import { DocumentsService } from '../../../core/services/documents/documents';
import { Toolbar } from '../../../shared/components/private/toolbar/toolbar';

interface FilePreview {
  file:      File;
  uploading: boolean;
  url:       string | null;
  fileName:  string;
  fileSize:  number;
  error:     boolean;
}

const VERBALE_TEMPLATE = `VERBALE DI ASSEMBLEA [ORDINARIA / STRAORDINARIA]
________________________________________________

Associazione: [Nome dell'associazione]
Sede: [Indirizzo della sede legale]
Data: [GG/MM/AAAA]
Ora di inizio: [HH:MM]
Luogo: [Luogo di svolgimento]

PRESENTI
Soci presenti: [N]
Deleghe ricevute: [N]
Totale aventi diritto al voto: [N]
Quorum richiesto: [N] — Quorum raggiunto: [Sì / No]

Presiede: [Nome e Cognome del Presidente]
Funge da segretario: [Nome e Cognome del Segretario]

Il Presidente dichiara aperta la seduta e dà lettura dell'ordine del giorno:

ORDINE DEL GIORNO
1. [Primo punto]
2. [Secondo punto]
3. Varie ed eventuali

────────────────────────────────────────
PUNTO 1 — [Titolo del primo punto]

[Descrizione della discussione. Il Presidente illustra... I soci intervengono...]

Si procede alla votazione:
  Favorevoli: [N]  —  Contrari: [N]  —  Astenuti: [N]

DELIBERA N. 1/[ANNO]: [Testo esatto della delibera].

────────────────────────────────────────
PUNTO 2 — [Titolo del secondo punto]

[Descrizione della discussione.]

Si procede alla votazione:
  Favorevoli: [N]  —  Contrari: [N]  —  Astenuti: [N]

DELIBERA N. 2/[ANNO]: [Testo esatto della delibera].

────────────────────────────────────────
PUNTO 3 — Varie ed eventuali

[Nessun argomento / eventuali comunicazioni.]

────────────────────────────────────────
Esauriti gli argomenti all'ordine del giorno, la seduta è tolta alle ore [HH:MM].

Il presente verbale viene letto, approvato e sottoscritto seduta stante.


Il Presidente                    Il Segretario
_____________________            _____________________
[Nome e Cognome]                 [Nome e Cognome]
`;

const CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: 'verbale',     label: 'Verbale'     },
  { value: 'statuto',     label: 'Statuto'     },
  { value: 'regolamento', label: 'Regolamento' },
  { value: 'bilancio',    label: 'Bilancio'    },
  { value: 'altro',       label: 'Altro'       },
];

@Component({
  selector: 'app-documents',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Toolbar],
  templateUrl: './documents.html',
})
export class Documents implements OnInit {
  private docsService = inject(DocumentsService);
  private sanitizer   = inject(DomSanitizer);

  documents    = signal<Document[]>([]);
  loading      = signal(true);
  saving       = signal(false);

  showModal      = signal(false);
  showTemplate   = signal(false);
  templateCopied = signal(false);
  detailDoc    = signal<Document | null>(null);

  checkedIds   = signal<Set<string>>(new Set());
  readonly checkedCount = computed(() => this.checkedIds().size);

  filePreview  = signal<FilePreview | null>(null);

  readonly categories = CATEGORIES;

  form: CreateDocumentDto = { title: '', description: '', category: 'verbale', fileUrl: '', fileName: '', fileSize: 0 };

  ngOnInit(): void {
    this.docsService.getAll().subscribe({
      next: docs => { this.documents.set(docs); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }

  openCreate(): void {
    this.form = { title: '', description: '', category: 'verbale', fileUrl: '', fileName: '', fileSize: 0 };
    this.formTitle.set('');
    this.filePreview.set(null);
    this.showModal.set(true);
  }

  closeCreate(): void { this.showModal.set(false); this.filePreview.set(null); }

  openDetail(d: Document): void { this.detailDoc.set(d); }
  closeDetail(): void           { this.detailDoc.set(null); }

  openTemplate(): void  { this.showTemplate.set(true); this.templateCopied.set(false); }
  closeTemplate(): void { this.showTemplate.set(false); }

  readonly verbaleTemplate = VERBALE_TEMPLATE;

  copyTemplate(): void {
    navigator.clipboard.writeText(VERBALE_TEMPLATE).then(() => {
      this.templateCopied.set(true);
      setTimeout(() => this.templateCopied.set(false), 2000);
    });
  }

  downloadTemplate(): void {
    const blob = new Blob([VERBALE_TEMPLATE], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'template-verbale-assemblea.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.uploadFile(input.files[0]);
    input.value = '';
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.uploadFile(file);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }

  removeFile(): void { this.filePreview.set(null); }

  private uploadFile(file: File): void {
    const MAX = 50 * 1024 * 1024;
    if (file.size > MAX) { alert(`"${file.name}" supera il limite di 50 MB.`); return; }

    const preview: FilePreview = {
      file, uploading: true, url: null,
      fileName: file.name, fileSize: file.size, error: false,
    };
    this.filePreview.set(preview);

    this.docsService.uploadFile(file).subscribe({
      next: res => {
        this.filePreview.set({ ...preview, uploading: false, url: res.url, fileName: res.fileName, fileSize: res.fileSize });
      },
      error: () => {
        this.filePreview.set({ ...preview, uploading: false, error: true });
      },
    });
  }

  formTitle = signal('');

  readonly canSubmit = computed(() => {
    const fp = this.filePreview();
    return !!this.formTitle() && fp !== null && fp.url !== null && !fp.uploading;
  });

  submit(): void {
    const fp = this.filePreview();
    if (!fp?.url) return;
    this.saving.set(true);
    const dto: CreateDocumentDto = {
      ...this.form,
      title:    this.formTitle(),
      fileUrl:  fp.url,
      fileName: fp.fileName,
      fileSize: fp.fileSize,
    };
    this.docsService.create(dto).subscribe({
      next: doc => {
        this.documents.update(list => [doc, ...list]);
        this.saving.set(false);
        this.closeCreate();
      },
      error: () => this.saving.set(false),
    });
  }

  toggleCheck(id: string, event: Event): void {
    event.stopPropagation();
    this.checkedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  isChecked(id: string): boolean { return this.checkedIds().has(id); }

  onDelete(singleId?: string): void {
    const ids = singleId ? [singleId] : [...this.checkedIds()];
    if (!ids.length) return;
    this.docsService.deleteMany(ids).subscribe({
      next: () => {
        this.documents.update(list => list.filter(d => !ids.includes(d.id)));
        if (ids.includes(this.detailDoc()?.id ?? '')) this.closeDetail();
        this.checkedIds.set(new Set());
      },
    });
  }

  categoryLabel(cat: DocumentCategory): string {
    return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
  }

  categoryColor(cat: DocumentCategory): string {
    const map: Record<DocumentCategory, string> = {
      verbale:     'bg-blue-50 text-blue-700',
      statuto:     'bg-purple-50 text-purple-700',
      regolamento: 'bg-amber-50 text-amber-700',
      bilancio:    'bg-green-50 text-green-700',
      altro:       'bg-surface-container text-on-surface-variant',
    };
    return map[cat];
  }

  cardBg(cat: DocumentCategory): string {
    const map: Record<DocumentCategory, string> = {
      verbale:     'bg-blue-50',
      statuto:     'bg-purple-50',
      regolamento: 'bg-amber-50',
      bilancio:    'bg-green-50',
      altro:       'bg-surface-container',
    };
    return map[cat];
  }

  cardIconColor(cat: DocumentCategory): string {
    const map: Record<DocumentCategory, string> = {
      verbale:     'text-blue-400',
      statuto:     'text-purple-400',
      regolamento: 'text-amber-400',
      bilancio:    'text-green-400',
      altro:       'text-on-surface-variant/40',
    };
    return map[cat];
  }

  formatSize(bytes: number): string {
    if (bytes < 1024)        return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  previewUrl(fileUrl: string, fileName: string): SafeResourceUrl {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf') {
      return this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }
    const viewer = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewer);
  }

  fileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'pdf')                   return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext))   return 'description';
    if (['xls', 'xlsx'].includes(ext))   return 'table_chart';
    return 'insert_drive_file';
  }
}
