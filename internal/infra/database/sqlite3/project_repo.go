package sqlite3

import (
	"context"
	"gorm.io/gorm"
	"mjlab/internal/domain"
)

type ProjectRepo struct {
	db *gorm.DB
}

// Get 根据传入的一个或多个 ID 获取作品列表
func (r *ProjectRepo) Get(ctx context.Context, ids ...uint) ([]*domain.Project, error) {
	var projects []*domain.Project

	if len(ids) == 0 {
		return projects, nil
	}

	// GORM 会自动将传入的切片转换为 SQL 的 IN (?, ?, ?) 语法
	err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&projects).Error
	if err != nil {
		return nil, err
	}

	return projects, nil
}

// List 根据 Query 条件查询作品列表，并返回总记录数和数据
func (r *ProjectRepo) List(ctx context.Context, q domain.Query) ([]*domain.Project, int64, error) {
	var projects []*domain.Project
	var total int64

	// 初始化一个查询会话
	db := r.db.WithContext(ctx).Model(&domain.Project{})

	// 1. 处理关键词模糊搜索 (匹配标题或简介)
	// SQLite 中的 LIKE 默认忽略大小写，可以直接使用
	if q.Keywords != "" {
		keyword := "%" + q.Keywords + "%"
		db = db.Where("title LIKE ? OR summary LIKE ? OR subtitle LIKE ?", keyword, keyword, keyword)
	}

	// 2. 先计算满足条件的总记录数 (用于前端分页)
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 3. 处理排序规则
	orderClause := buildOrderClause(q)
	if orderClause != "" {
		db = db.Order(orderClause)
	}

	// 4. 处理分页 (Offset 和 Limit)
	if q.Limit > 0 {
		db = db.Limit(q.Limit)
	}
	if q.Offset > 0 {
		db = db.Offset(q.Offset)
	}

	// 5. 执行最终查询
	err := db.Find(&projects).Error
	if err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

// Save 新增一个作品
func (r *ProjectRepo) Save(ctx context.Context, p *domain.Project) error {
	return r.db.WithContext(ctx).Create(p).Error
}

// Update 更新作品的所有字段
func (r *ProjectRepo) Update(ctx context.Context, p *domain.Project) error {
	return r.db.WithContext(ctx).
		Model(&domain.Project{}).
		Where("id = ?", p.ID).
		Select("sort_order", "repo_url", "launch_url").
		Updates(p).Error
}

// Delete 根据 ID 软删除一个作品 (如果模型包含 gorm.DeletedAt 字段)
func (r *ProjectRepo) Delete(ctx context.Context, id uint) error {
	// 这里传递 &domain.Project{} 是为了告诉 GORM 操作的是哪张表
	return r.db.WithContext(ctx).Delete(&domain.Project{}, id).Error
}
