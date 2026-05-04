export interface Article {
  id:          string;
  name:        string;
  description: string;
  categories:  string[];
  images:      string[];
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateArticleDto {
  name:        string;
  description: string;
  categories:  string[];
  images:      string[];
}
