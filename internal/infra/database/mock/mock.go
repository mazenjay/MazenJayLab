package mock

import (
	"context"
	"mjlab/internal/domain"
)

type Mock struct {
	articleRepo domain.ArticleRepository
	projectRepo domain.ProjectRepository
}

func (m *Mock) Article() domain.ArticleRepository {
	return m.articleRepo
}

func (m *Mock) Project() domain.ProjectRepository {
	return m.projectRepo
}

func (m *Mock) Do(_ context.Context, fn func(work domain.UnitOfWork) error) error {
	return fn(m)
}
