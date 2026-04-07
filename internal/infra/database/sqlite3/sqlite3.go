package sqlite3

import (
	"context"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"log/slog"
	"mjlab/internal/domain"
	"os"
	"path/filepath"
	"strings"
)

func New(source string) *SQLite {
	dir := filepath.Dir(source)
	
	if err := os.MkdirAll(dir, 0755); err != nil {
		slog.Error("Failed to create database directory", "dir", dir, "error", err)
		os.Exit(1)
	}

	db, err := gorm.Open(sqlite.Open(source), &gorm.Config{})
	if err != nil {
		slog.Error("Failed to connect to database", "source", source, "error", err)
		os.Exit(1)
	}

	err = db.AutoMigrate(
		&domain.Project{},
		&domain.Article{},
	)

	if err != nil {
		slog.Error("failed to auto migrate database", "error", err)
		os.Exit(1)
	}
	return &SQLite{db: db}
}

type SQLite struct {
	db *gorm.DB
}

func (s *SQLite) Article() domain.ArticleRepository {
	return &ArticleRepo{db: s.db}
}

func (s *SQLite) Project() domain.ProjectRepository { return &ProjectRepo{db: s.db} }

func (s *SQLite) Do(ctx context.Context, fn func(uow domain.UnitOfWork) error) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txUow := &SQLite{db: tx}
		return fn(txUow)
	})
}

func buildOrderClause(query domain.Query) string {
	allowedSort := map[string]string{
		"id":         "id",
		"created_at": "created_at",
		"sort_order": "sort_order",
	}

	field, ok := allowedSort[strings.ToLower(query.Sort)]
	if !ok {
		field = "id"
	}

	order := "DESC"
	if strings.ToLower(query.SortOrder) == "asc" {
		order = "ASC"
	}

	return field + " " + order
}
