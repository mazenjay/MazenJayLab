package domain

import "gorm.io/gorm"

type Project struct {
	gorm.Model
	Title       string `gorm:"type:varchar(255);not null"`
	Description string `gorm:"type:varchar(500)"`
	Path        string `gorm:"type:varchar(255)"`
	Content     string `gorm:"type:text"`
	CoverURL    string `gorm:"type:varchar(255)"`
	DemoURL     string `gorm:"type:varchar(255)"`
	SourceURL   string `gorm:"type:varchar(255)"`
	ViewCount   uint   `gorm:"default:0"`
	IsPublished bool   `gorm:"default:true"`
}

func (Project) TableName() string {
	return "projects"
}
