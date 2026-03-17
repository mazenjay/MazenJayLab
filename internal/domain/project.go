package domain

import "time"

type Project struct {
	ID          uint
	Title       string
	Description string
	Path        string
	Content     string
	CoverURL    string
	DemoURL     string
	SourceURL   string
	ViewCount   uint
	IsPublished bool
	Tag         string

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (p Project) TableName() string {
	return "projects"
}
