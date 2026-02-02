package sqlite3

import (
	"context"
	"log/slog"
	"mjlab/internal/domain"
	"mjlab/internal/domain/store"
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
	store.InitDBStore(sqlite3)
}

type SQLite3Store struct {
	db *gorm.DB
}

func (s *SQLite3Store) GetArticle(ctx context.Context, id uint) (*domain.Article, error) {
	return nil, nil
}

func (s *SQLite3Store) ListArticles(ctx context.Context, query store.Query) ([]*domain.Article, int, error) {
	return nil, 0, nil
}
