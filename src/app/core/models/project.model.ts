export type ProjectCategory = 'cultura' | 'tradizione' | 'sociale' | 'educazione';
export type ProjectStatus   = 'ongoing' | 'completed';

export interface Project {
  id:          string;
  title:       string;
  description: string;
  category:    ProjectCategory;
  status:      ProjectStatus;
  images:      string[];
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateProjectDto {
  title:       string;
  description: string;
  category:    ProjectCategory;
  status:      ProjectStatus;
  images:      string[];
}
