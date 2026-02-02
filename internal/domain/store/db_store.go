package store

import (
	"context"
	"errors"
	"mjlab/internal/domain"
)

type DBStore interface {
	GetArticle(context.Context, uint) (*domain.Article, error) // 根据 id 获取文章
	ListArticles(context.Context, Query) ([]*domain.Article, int, error)

	// CreateArticle(context.Context, *domain.Article) error
	// UpdateArticle(context.Context, *domain.Article) error
	// DeleteArticle(context.Context, uint) error
}

type Query struct {
	Limit     int
	Offset    int
	Keywords  string
	Sort      string
	SortOrder string
}

var dbStore DBStore

func InitDBStore(store DBStore) {
	if dbStore != nil {
		return
	}
	dbStore = store
}

func GetArticle(ctx context.Context, id uint) (*domain.Article, error) {
	if dbStore == nil {
		return nil, errors.New("db store not initialized")
	}
	return dbStore.GetArticle(ctx, id)
}

func ListArticles(ctx context.Context, query Query) ([]*domain.Article, int, error) {
	if dbStore == nil {
		return nil, 0, errors.New("db store not initialized")
	}
	return dbStore.ListArticles(ctx, query)
}
