package model

type ArticleOverview struct {
	ID      uint     `json:"id"`
	Title   string   `json:"title"`
	Summary string   `json:"summary"`
	Tags    []string `json:"tags"`
	Date    string   `json:"date"`
	Slug    string   `json:"slug"`
}

type Page struct {
	Total   int64 `json:"total"`
	Records any   `json:"records"`
	HasMore bool  `json:"has_more"`
}

type ProjectTech struct {
	Name string `json:"name"`
	Icon string `json:"icon"`
}

type ProjectOverview struct {
	Title      string        `json:"title"`
	Subtitle   string        `json:"subtitle"`
	Summary    string        `json:"summary"`
	Slug       string        `json:"slug"`
	Icon       string        `json:"icon,omitempty"`
	ThemeColor string        `json:"theme_color"`
	Status     string        `json:"status"`
	RepoURL    string        `json:"repo_url,omitempty"`
	LaunchURL  string        `json:"launch_url,omitempty"`
	Techs      []ProjectTech `json:"techs,omitempty"`
}
