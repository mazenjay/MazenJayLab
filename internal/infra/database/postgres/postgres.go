package postgres

import (
	"context"
	"log/slog"
	"os"
	"strings"
	"time"

	"mjlab/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

const (
	pgMaxOpenConns    = 25
	pgMaxIdleConns    = 10
	pgConnMaxLifetime = time.Hour
)

// New gcfg 传 nil 则静默；主程序传入 logging.GormConfig 与 slog/Gin 共用 writer。
func New(dsn string, gcfg *gorm.Config) *DB {
	if strings.TrimSpace(dsn) == "" {
		slog.Error("postgres DSN is empty; set [database].source or host/user/password/db_name")
		os.Exit(1)
	}
	if gcfg == nil {
		gcfg = &gorm.Config{}
	}
	db, err := gorm.Open(postgres.Open(dsn), gcfg)
	if err != nil {
		slog.Error("Failed to connect to PostgreSQL", "error", err)
		os.Exit(1)
	}

	sqlDB, err := db.DB()
	if err != nil {
		slog.Error("Failed to get sql.DB", "error", err)
		os.Exit(1)
	}
	sqlDB.SetMaxOpenConns(pgMaxOpenConns)
	sqlDB.SetMaxIdleConns(pgMaxIdleConns)
	sqlDB.SetConnMaxLifetime(pgConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(10 * time.Minute)

	if err = db.AutoMigrate(&domain.Project{}, &domain.Article{}); err != nil {
		slog.Error("postgres AutoMigrate failed", "error", err)
		os.Exit(1)
	}

	return &DB{db: db}
}

type DB struct {
	db *gorm.DB
}

func (s *DB) Article() domain.ArticleRepository {
	return &ArticleRepo{db: s.db}
}

func (s *DB) Project() domain.ProjectRepository { return &ProjectRepo{db: s.db} }

func (s *DB) Do(ctx context.Context, fn func(uow domain.UnitOfWork) error) error {
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txUow := &DB{db: tx}
		return fn(txUow)
	})
}
