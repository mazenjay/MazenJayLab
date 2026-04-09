package postgres

import (
	"context"

	"mjlab/internal/domain"
	"mjlab/internal/infra/database/dbutil"

	"gorm.io/gorm"
)

type ProjectRepo struct {
	db *gorm.DB
}

func (r *ProjectRepo) Get(ctx context.Context, ids ...uint) ([]*domain.Project, error) {
	var projects []*domain.Project

	if len(ids) == 0 {
		return projects, nil
	}

	err := r.db.WithContext(ctx).Where("id IN ?", ids).Find(&projects).Error
	if err != nil {
		return nil, err
	}

	return projects, nil
}

func (r *ProjectRepo) List(ctx context.Context, q domain.Query) ([]*domain.Project, int64, error) {
	var projects []*domain.Project
	var total int64

	db := r.db.WithContext(ctx).Model(&domain.Project{})

	if q.Keywords != "" {
		keyword := "%" + q.Keywords + "%"
		db = db.Where("title ILIKE ? OR summary ILIKE ? OR subtitle ILIKE ?", keyword, keyword, keyword)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	orderClause := dbutil.BuildOrderClause(q)
	if orderClause != "" {
		db = db.Order(orderClause)
	}

	if q.Limit > 0 {
		db = db.Limit(q.Limit)
	}
	if q.Offset > 0 {
		db = db.Offset(q.Offset)
	}

	err := db.Find(&projects).Error
	if err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

func (r *ProjectRepo) Save(ctx context.Context, p *domain.Project) error {
	return r.db.WithContext(ctx).Create(p).Error
}

func (r *ProjectRepo) Update(ctx context.Context, p *domain.Project) error {
	return r.db.WithContext(ctx).
		Model(&domain.Project{}).
		Where("id = ?", p.ID).
		Select("sort_order", "repo_url", "launch_url").
		Updates(p).Error
}

func (r *ProjectRepo) Delete(ctx context.Context, id uint) error {
	return r.db.WithContext(ctx).Delete(&domain.Project{}, id).Error
}
