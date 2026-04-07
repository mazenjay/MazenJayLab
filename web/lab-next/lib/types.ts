export type ArticleOverview = {
  id: number;
  title: string;
  summary: string;
  tags: string[];
  date: string;
  slug: string;
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
