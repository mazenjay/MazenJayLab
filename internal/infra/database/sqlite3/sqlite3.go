package sqlite3

import (
	"context"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"log"
	"mjlab/internal/domain"
)

func New(source string) *SQLite {
	db, err := gorm.Open(sqlite.Open(source), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database", "error", err)
	}
	return &SQLite{db: db}
}

type SQLite struct {
	db *gorm.DB
}

func (s *SQLite) Article() domain.ArticleRepository {
	return &ArticleRepo{db: s.db}
}

func (s *SQLite) Do(ctx context.Context, fn func(uow domain.UnitOfWork) error) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txUow := &SQLite{db: tx}
		return fn(txUow)
	})
}
