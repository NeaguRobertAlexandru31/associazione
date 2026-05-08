export interface ArticleBlock {
  subtitle?: string;
  paragraph: string;
  image?:    string;
}

export interface Article {
  id:          string;
  name:        string;
  categories:  string[];
  blocks:      ArticleBlock[];
  cover?:      string;
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateArticleBlockDto {
  subtitle?:  string;
  paragraph:  string;
  image?:     string;
}

export interface CreateArticleDto {
  name:       string;
  categories: string[];
  blocks:     CreateArticleBlockDto[];
  cover?:     string;
}
