package domain

import (
	"gorm.io/gorm"
)

type Article struct {
	gorm.Model         // 包含 ID, CreatedAt, UpdatedAt, DeletedAt
	Title       string `gorm:"type:varchar(255);not null"`
	Slug        string `gorm:"type:varchar(255);unique;index"` // 用于URL优化的别名，如 /article/my-first-post
	Summary     string `gorm:"type:varchar(500)"`              // 文章摘要
	Path        string `gorm:"type:varchar(255)"`              // 文件路径
	ViewCount   uint   `gorm:"default:0"`                      // 阅读量
	IsPublished bool   `gorm:"default:true"`                   // 是否发布
}

func (Article) TableName() string {
	return "articles"
}
