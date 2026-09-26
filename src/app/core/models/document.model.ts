export type DocumentCategory = 'verbale' | 'statuto' | 'regolamento' | 'bilancio' | 'altro';

export interface Document {
  id:          string;
  title:       string;
  description: string | null;
  category:    DocumentCategory;
  fileUrl:     string;
  fileName:    string;
  fileSize:    number;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateDocumentDto {
  title:       string;
  description: string;
  category:    DocumentCategory;
  fileUrl:     string;
  fileName:    string;
  fileSize:    number;
}
