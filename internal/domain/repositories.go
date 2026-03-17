package domain

import "context"

type UnitOfWork interface {
	Article() ArticleRepository
	Do(context.Context, func(UnitOfWork) error) error
}

type Query struct {
	Limit     int
	Offset    int
	Keywords  string
	Sort      string
	SortOrder string
}

var uow UnitOfWork

func InitRepo(u UnitOfWork) {
	if uow == nil {
		uow = u
	}
}

func ArticleRepo() ArticleRepository {
	return uow.Article()
}

func Do(ctx context.Context, fn func(UnitOfWork) error) error {
	return uow.Do(ctx, fn)
}

type Tags []string
