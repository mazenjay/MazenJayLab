package model

// ProjectCreateParam 管理端录入作品；icon 可走表单文件 "icon"，或由 JSON 中的 icon 字段（如 ri- / https://）指定。
type ProjectCreateParam struct {
	Title      string        `json:"title"`
	Slug       string        `json:"slug"`
	Subtitle   string        `json:"subtitle"`
	Summary    string        `json:"summary"`
	Icon       string        `json:"icon"`
	ThemeColor string        `json:"theme_color"`
	Status     string        `json:"status"`
	RepoURL    string        `json:"repo_url"`
	LaunchURL  string        `json:"launch_url"`
	SortOrder  int           `json:"sort_order"`
	Techs      []ProjectTech `json:"techs"`
}

type SearchParam struct {
	Command  string `json:"command" form:"command"`
	Keywords string `json:"keywords" form:"keywords"`
	Page     int    `json:"page" form:"page"`
	PerPage  int    `json:"per_page" form:"per_page"`
}
