package sqlite3

import (
	"context"
	"errors"
	"log/slog"
	"mjlab/internal/domain"
	"mjlab/internal/infrastructure/config"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func init() {

	config := config.GetDatabaseConfig()
	source := config.Source

	db, err := gorm.Open(sqlite.Open(source), &gorm.Config{})
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
	}

	sqlite3 := &SQLite3Store{db: db}
	domain.InitDBStore(sqlite3)
}

type SQLite3Store struct {
	db *gorm.DB
}

func (s *SQLite3Store) GetArticle(ctx context.Context, id uint) (*domain.Article, error) {
	if id == 0 {
		return nil, errors.New("invalid article id")
	}

	var article domain.Article
	if err := s.db.WithContext(ctx).First(&article, "id = ? AND deleted_at IS NULL", id).Error; err != nil {
		return nil, err
	}

	return &article, nil
}

func (s *SQLite3Store) ListArticles(ctx context.Context, query domain.Query) ([]*domain.Article, int64, error) {
	var articles []*domain.Article
	var total int64

	db := s.db.WithContext(ctx).Model(&domain.Article{}).Where("deleted_at IS NULL")
	if query.Keywords != "" {
		db = db.Where("title LIKE ? OR summary LIKE ?", "%"+query.Keywords+"%", "%"+query.Keywords+"%")
	}
	if query.Sort != "" {
		db = db.Order(query.Sort)
	}
	if query.SortOrder != "" {
		db = db.Order(query.SortOrder)
	}

	if err := db.Offset(query.Offset).Limit(query.Limit).Find(&articles).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	return articles, total, nil
}
