export type ArticleOverview = {
  id: number;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  slug: string;
  /** 文章类型，任意字符串（与 kind_label 展示一致时由后端填同一值） */
  kind: string;
  kind_label: string;
};

export type ProjectTech = {
  name: string;
  icon: string;
};

export type Project = {
  title: string;
  subtitle: string;
  summary: string;
  icon?: string;
  theme_color: string;
  status: string;
  repo_url?: string;
  launch_url?: string;
  techs?: ProjectTech[];
};

export type ArticlesPagePayload = {
  total: number;
  records: ArticleOverview[];
  has_more: boolean;
};

export type SearchHit = {
  type: string;
  id: number;
  title: string;
  summary: string;
  icon?: string;
  link: string;
};

export type SearchPagePayload = {
  total: number;
  records: SearchHit[];
};
