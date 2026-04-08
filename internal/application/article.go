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
	"os"
	"path/filepath"
	"strings"
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

const articleMarkdownSubdir = "article_md"

// BatchCreateArticlesFromDir 固定扫描 WorkDir/article_md 下的 .md，批量创建文章；仅按 markdown 存储路径去重（不在此处解析 MD）。
func (as *ArticleService) BatchCreateArticlesFromDir(ctx context.Context, recursive bool) (*model.BatchArticleReport, error) {
	report := &model.BatchArticleReport{
		Created: make([]model.BatchArticleEntry, 0),
		Skipped: make([]model.BatchArticleEntry, 0),
		Errors:  make([]model.BatchArticleEntry, 0),
	}

	workDir := filepath.Clean(config.Cfg.WorkDir)
	absDir := filepath.Join(workDir, articleMarkdownSubdir)

	st, err := os.Stat(absDir)
	if err != nil {
		return nil, err
	}
	if !st.IsDir() {
		return nil, fmt.Errorf("不是目录: %s", articleMarkdownSubdir)
	}

	var files []string
	if recursive {
		err = filepath.WalkDir(absDir, func(path string, d os.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if d.IsDir() {
				return nil
			}
			if strings.EqualFold(filepath.Ext(d.Name()), ".md") {
				files = append(files, path)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	} else {
		entries, err := os.ReadDir(absDir)
		if err != nil {
			return nil, err
		}
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			if strings.EqualFold(filepath.Ext(e.Name()), ".md") {
				files = append(files, filepath.Join(absDir, e.Name()))
			}
		}
	}

	for _, full := range files {
		select {
		case <-ctx.Done():
			return report, ctx.Err()
		default:
		}

		rel, err := filepath.Rel(workDir, full)
		if err != nil {
			report.Errors = append(report.Errors, model.BatchArticleEntry{Path: filepath.ToSlash(full), Error: err.Error()})
			continue
		}
		rel = filepath.ToSlash(rel)

		n, err := domain.CountArticlesByMarkdown(ctx, rel)
		if err != nil {
			report.Errors = append(report.Errors, model.BatchArticleEntry{Path: rel, Error: err.Error()})
			continue
		}
		if n > 0 {
			report.Skipped = append(report.Skipped, model.BatchArticleEntry{Path: rel, Reason: "exists_markdown"})
			continue
		}

		id, err := as.CreateArticle(ctx, rel)
		if err != nil {
			report.Errors = append(report.Errors, model.BatchArticleEntry{Path: rel, Error: err.Error()})
			continue
		}
		report.Created = append(report.Created, model.BatchArticleEntry{Path: rel, ID: id})
	}

	return report, nil
}
