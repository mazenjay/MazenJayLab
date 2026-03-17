package model

type ArticleOverview struct {
	ID       uint   `json:"id"`
	Title    string `json:"title"`
	Summary  string `json:"summary"`
	Tags []string `json:"tags"`
	Date     string `json:"date"`
	Slug string `json:"slug"`
}


type Page struct {
	Total int64 `json:"total"`
	Records any `json:"records"`
	HasMore bool `json:"has_more"`
}