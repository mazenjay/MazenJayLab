package application

import (
	"context"
	"errors"
	"fmt"
	"mjlab/internal/domain"
	"sync"
)

type SearchCommand struct {
	Type     string
	Keywords string
	Tags     []string
	Page     int
	PerPage  int
}

type SearchService struct{}

func (*SearchService) Search(ctx context.Context, command SearchCommand) (*domain.SearchResults, error) {
	var (
		res   *domain.SearchResults
		qb    *domain.SearchQueryBuilder
		query domain.SearchQuery
		err   error
	)
	qb = domain.NewSearchQueryBuilder(command.Keywords).
		WithPage(command.Page).
		WithPerPage(command.PerPage).
		WithDocType(command.Type).
		WithTags(command.Tags)

	if query, err = qb.Build(); err != nil {
		return res, err
	}
	if res, err = domain.Search(ctx, query); err != nil {
		return res, err
	}

	return res, err
}

func (s *SearchService) AddDocs(ctx context.Context, ids ...uint) error {
	if len(ids) == 0 {
		return errors.New("ids is empty")
	}
	articles, err := domain.GetArticle(ctx, ids...)
	if err != nil {
		return err
	}

	docs := make([]domain.Searchable, len(articles))
	for idx, article := range articles {
		docs[idx] = article
	}

	return domain.AddDocs(ctx, docs)
}

func (*SearchService) RebuildIndex(ctx context.Context) error {

	_, total, err := domain.GetArticles(ctx, domain.Query{
		Limit:     1,
		Offset:    0,
		SortOrder: "asc",
		Sort:      "id",
	})
	if err != nil {
		return err
	}

	workerNum := 10

	taskCh := make(chan struct {
		offset int64
		limit  int64
	}, workerNum)
	errCh := make(chan error, 16)
	var wg sync.WaitGroup

	for i := 0; i < workerNum; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()

			for task := range taskCh {

				// ctx 取消检查
				select {
				case <-ctx.Done():
					return
				default:
				}

				articles, _, err := domain.GetArticles(ctx, domain.Query{
					Limit:     int(task.limit),
					Offset:    int(task.offset),
					SortOrder: "asc",
					Sort:      "id",
				})
				if err != nil {
					errCh <- fmt.Errorf("rebuild index failed at offset=%d limit=%d: %w",
						task.offset, task.limit, err)
					continue
				}

				if len(articles) == 0 {
					continue
				}

				docs := make([]domain.Searchable, len(articles))
				for i, a := range articles {
					docs[i] = a
				}

				if err := domain.AddDocs(ctx, docs); err != nil {
					errCh <- fmt.Errorf("rebuild index failed at offset=%d limit=%d: %w",
						task.offset, task.limit, err)
					continue
				}
			}
		}()
	}

	go func() {
		var offset, limit int64
		limit = 20
		defer close(taskCh)

		for ; offset < total; offset += limit {
			select {
			case <-ctx.Done():
				return
			case taskCh <- struct {
				offset int64
				limit  int64
			}{offset: offset, limit: limit}:
			}
		}
	}()

	go func() {
		wg.Wait()
		close(errCh)
	}()

	var errs []error
	for err := range errCh {
		errs = append(errs, err)
	}

	if len(errs) > 0 {
		return fmt.Errorf("rebuild index failed: %w", errors.Join(errs...))
	}

	return nil

}
