package application

import (
	"context"
	"errors"
	"io"
	"mjlab/api/model"
	"mjlab/internal/domain"
	"mjlab/internal/infra/config"
	"path/filepath"
	"time"
)

type ArticleService struct{}

func (*ArticleService) Pagination(ctx context.Context, query domain.Query) ([]*model.ArticleOverview, int64) {
	articles, total, err := domain.GetArticles(ctx, query)
	if err != nil {
		return nil, 0
	}

	overviews := make([]*model.ArticleOverview, len(articles))
	for idx, val := range articles {
		overviews[idx] = &model.ArticleOverview{
			ID:       val.ID,
			Title:    val.Title,
			Summary:  val.Summary,
			Category: val.Tag,
			Slug:     val.Slug,
		}
	}

	return overviews, total
}

func (*ArticleService) ConvertMd(ctx context.Context, force, publish bool, id uint) error {

	return domain.Do(ctx, func(uow domain.UnitOfWork) error {
		repo := uow.Article()
		acts, err := repo.Get(ctx, id)
		if err != nil {
			return err
		}

		article := acts[0]
		if publish {
			article.IsPublished = true
		}

		if !force && article.Html != "" {
			return nil
		}
		newCtx, cancel := context.WithTimeout(ctx, time.Second*20)
		defer cancel()

		var (
			file *domain.OSSFile
			ex   error
			path string
		)
		file, ex = domain.DownloadFile(newCtx, article.Markdown)
		if ex != nil {
			return ex
		}
		filename := filepath.Join("article", article.Slug+".html")
		path, err = domain.UploadWithTempFile(newCtx, filename, func(writer io.Writer) error {
			return article.Render(newCtx, file, writer, config.Cfg.Article.Template)
		})
		article.Html = path

		return repo.Update(ctx, article)
	})
}

func (*ArticleService) Add(ctx context.Context, path string) (uint, error) {
	article := &domain.Article{
		Markdown:  path,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	if err := domain.AddArticle(ctx, article); err != nil {
		return 0, err
	}
	return article.ID, nil
}

func (*ArticleService) ManageArticleStatus(ctx context.Context, id uint, status string) error {
	if id == 0 {
		return errors.New("id is required")
	}
	if status != "publish" && status != "unpublish" {
		return errors.New("status is required")
	}

	return domain.Do(ctx, func(uow domain.UnitOfWork) error {
		repo := uow.Article()
		article, err := repo.Get(ctx, id)
		if err != nil {
			return err
		}

		article[0].IsPublished = status == "publish"
		return repo.Update(ctx, article[0])
	})
}
