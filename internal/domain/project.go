package domain

import (
	"context"
	"gorm.io/gorm"
	"time"
)

type Project struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// 基础信息
	Title    string `gorm:"type:varchar(100);not null" json:"title"`   // 项目名称 (e.g., "Nexus API")
	Slug     string `gorm:"type:varchar(100);uniqueIndex" json:"slug"` // URL 友好标识 (e.g., "nexus-api")
	Subtitle string `gorm:"type:varchar(100)" json:"subtitle"`         // 副标题/类型 (e.g., "Golang Microservice")
	Summary  string `gorm:"type:text" json:"summary"`                  // 项目一句话简介

	// 视觉表现
	Icon       string `gorm:"type:varchar(255)" json:"icon"`                      // 图标：如果是 ri- 开头则渲染字体图标，如果是 http 开头则渲染图片
	ThemeColor string `gorm:"type:varchar(50);default:'blue'" json:"theme_color"` // 主题色 (e.g., "emerald", "orange", "purple", "blue") 控制卡片悬浮光晕

	// 状态与链接
	Status    string `gorm:"type:varchar(50);default:'Live'" json:"status"` // 状态 (e.g., "Live", "Beta", "Archived", "WIP")
	RepoURL   string `gorm:"type:varchar(255)" json:"repo_url"`             // GitHub 仓库地址 (为空则不显示按钮)
	LaunchURL string `gorm:"type:varchar(255)" json:"launch_url"`           // 线上预览/访问地址 (为空则不显示按钮)

	// 排序权重 (数字越大越靠前，或者越小越靠前，用于手动控制展示顺序)
	SortOrder int `gorm:"default:0" json:"sort_order"`

	// TechsJSON 存储前端 Project.techs 的 JSON 数组，例如 [{"name":"Go","icon":"ri-code-box-line"}]
	TechsJSON string `gorm:"type:text" json:"-"`
}

func (*Project) TableName() string {
	return "projects"
}

type ProjectRepository interface {
	Get(context.Context, ...uint) ([]*Project, error)
	List(context.Context, Query) ([]*Project, int64, error)
	Save(context.Context, *Project) error
	Update(context.Context, *Project) error
	Delete(context.Context, uint) error
}
