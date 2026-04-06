package application

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log/slog"
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
			ID:      val.ID,
			Title:   val.Title,
			Summary: val.Summary,
			Tags:    val.Tags,
			Date:    val.CreatedAt.Format("2006-01-02"),
			Slug:    val.Slug,
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
		if path, err = domain.UploadWithTempFile(newCtx, func(writer io.Writer) (string, error) {
			if e := article.Render(newCtx, file, writer, config.Cfg.Article.Template); e != nil {
				return "", e
			}
			filename := filepath.Join("article", article.Slug+".html")
			return filename, nil
		}); err != nil {
			slog.Warn("convert to md failed")
			return err
		}

		article.Html = path

		return repo.Update(ctx, article)
	})
}

func (as *ArticleService) CreateArticle(ctx context.Context, path string) (uint, error) {
	now := time.Now()
	data := fmt.Sprintf("%s-%d", path, now.UnixNano())
	sum := sha256.Sum256([]byte(data))
	article := &domain.Article{
		Slug:      hex.EncodeToString(sum[:]),
		Markdown:  path,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := domain.AddArticle(ctx, article); err != nil {
		return 0, err
	}

	go func() {
		if e := as.ConvertMd(ctx, true, true, article.ID); e != nil {
			slog.Warn("convert to markdown was failed", "err", e)
			return
		}

		if e := as.AddToSearchIndex(ctx, article.ID); e != nil {
			slog.Warn("add to search index was failed", "err", e)
		}

	}()

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

func (*ArticleService) AddToSearchIndex(ctx context.Context, id uint) error {
	return domain.Do(ctx, func(uow domain.UnitOfWork) error {
		repo := uow.Article()
		ar, err := repo.Get(ctx, id)
		if err != nil {
			return err
		}
		return ar[0].AddToIndex(ctx)
	})
}

func (*ArticleService) ShowArticle(ctx context.Context, path string) (*domain.OSSFile, error) {
	return domain.DownloadFile(ctx, path)
}
