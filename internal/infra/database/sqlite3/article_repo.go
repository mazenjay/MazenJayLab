package sqlite3

import (
	"context"
	"errors"
	"mjlab/internal/domain"
	"strings"

	"gorm.io/gorm"
)

var _ domain.ArticleRepository = (*ArticleRepo)(nil)

type ArticleRepo struct {
	db *gorm.DB
}

func (r *ArticleRepo) Get(ctx context.Context, ids ...uint) ([]*domain.Article, error) {
	if len(ids) == 0 {
		return []*domain.Article{}, nil
	}

	var articles []*domain.Article
	if err := r.db.WithContext(ctx).
		Where("id IN ?", ids).
		Find(&articles).Error; err != nil {
		return nil, err
	}

	return articles, nil
}

func (r *ArticleRepo) List(ctx context.Context, query domain.Query) ([]*domain.Article, int64, error) {
	var (
		articles []*domain.Article
		total    int64
	)

	db := r.db.WithContext(ctx).Model(&domain.Article{})

	db = db.Where("is_published = ?", true)

	if query.Keywords != "" {
		like := "%" + query.Keywords + "%"
		db = db.Where("title LIKE ? OR summary LIKE ?", like, like)
	}

	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	orderClause := buildOrderClause(query)
	if orderClause != "" {
		db = db.Order(orderClause)
	}

	if query.Limit > 0 {
		db = db.Limit(query.Limit)
	}
	if query.Offset > 0 {
		db = db.Offset(query.Offset)
	}

	if err := db.Find(&articles).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}

func buildOrderClause(query domain.Query) string {
	allowedSort := map[string]string{
		"id":         "id",
		"title":      "title",
		"view_count": "view_count",
		"created_at": "created_at",
		"updated_at": "updated_at",
	}

	field, ok := allowedSort[strings.ToLower(query.Sort)]
	if !ok {
		field = "id"
	}

	order := "ASC"
	if strings.ToLower(query.SortOrder) == "desc" {
		order = "DESC"
	}

	return field + " " + order
}

func (r *ArticleRepo) Save(ctx context.Context, article *domain.Article) error {
	return r.db.WithContext(ctx).
		Create(article).Error
}

func (r *ArticleRepo) Update(ctx context.Context, article *domain.Article) error {
	if article.ID == 0 {
		return errors.New("invalid article id")
	}

	return r.db.WithContext(ctx).
		Model(&domain.Article{}).
		Where("id = ?", article.ID).
		Updates(article).Error
}

func (r *ArticleRepo) Delete(ctx context.Context, id uint) error {
	if id == 0 {
		return errors.New("invalid article id")
	}

	return r.db.WithContext(ctx).
		Delete(&domain.Article{}, id).Error
}
