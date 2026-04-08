package sqlite3

import (
	"context"
	"log/slog"
	"mjlab/internal/domain"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// 连接池：SQLite 同一时刻仍只有一个写者，但 WAL 下可多连接并发读；池过小会拖慢只读 API。
// 写冲突主要靠 DSN 里的 busy_timeout + WAL 缓解，而不是把 MaxOpenConns 设为 1。
const (
	sqliteMaxOpenConns = 25
	sqliteMaxIdleConns = 10
)

// sqliteDSN 追加并发与锁相关参数，减轻「database is locked」（多 goroutine 写时）。
// _busy_timeout 单位：毫秒；WAL 允许读写更好并发；NORMAL 为 WAL 下常用同步级别。
func sqliteDSN(path string) string {
	if path == "" {
		return path
	}
	const q = "_busy_timeout=10000&_journal_mode=WAL&_synchronous=NORMAL&_foreign_keys=ON"
	if strings.Contains(path, "?") {
		return path + "&" + q
	}
	return path + "?" + q
}

func New(source string) *SQLite {
	dir := filepath.Dir(source)

	if err := os.MkdirAll(dir, 0755); err != nil {
		slog.Error("Failed to create database directory", "dir", dir, "error", err)
		os.Exit(1)
	}

	dsn := sqliteDSN(source)
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		slog.Error("Failed to connect to database", "source", source, "error", err)
		os.Exit(1)
	}

	sqlDB, err := db.DB()
	if err != nil {
		slog.Error("Failed to get sql.DB", "error", err)
		os.Exit(1)
	}
	sqlDB.SetMaxOpenConns(sqliteMaxOpenConns)
	sqlDB.SetMaxIdleConns(sqliteMaxIdleConns)
	sqlDB.SetConnMaxLifetime(0)
	sqlDB.SetConnMaxIdleTime(10 * time.Minute)

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
