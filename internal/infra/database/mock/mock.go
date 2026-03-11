package mock

import (
	"context"
	"mjlab/internal/domain"
)

func init() {
	domain.InitRepo(&Mock{articleRepo})
}

type Mock struct {
	articleRepo domain.ArticleRepository
}

func (m *Mock) Article() domain.ArticleRepository {
	return m.articleRepo
}

func (m *Mock) Do(_ context.Context, fn func(work domain.UnitOfWork) error) error {
	return fn(m)
}
