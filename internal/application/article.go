package application

import (
	"context"
	"errors"
	"fmt"
	"io"
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
		k := strings.TrimSpace(val.Kind)
		overviews[idx] = &model.ArticleOverview{
			ID:        val.ID,
			Title:     val.Title,
			Summary:   val.Summary,
			Tags:      val.Tags,
			Date:      val.CreatedAt.Format("2006-01-02"),
			Slug:      val.Slug,
			Kind:      k,
			KindLabel: k,
		}
	}

	return overviews, total
}

func (as *ArticleService) CreateArticles(ctx context.Context, recursive bool) (*model.BatchArticleReport, error) {
	report := &model.BatchArticleReport{
		Created: make([]model.BatchArticleEntry, 0),
		Skipped: make([]model.BatchArticleEntry, 0),
		Errors:  make([]model.BatchArticleEntry, 0),
	}

	absDir := config.Cfg.Article.MarkDownPath

	st, err := os.Stat(absDir)
	if err != nil {
		return nil, err
	}
	if !st.IsDir() {
		return nil, fmt.Errorf("it's not dir: %s", config.Cfg.Article.MarkDownPath)
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

		rel, err := filepath.Rel(config.WorkDir, full)
		if err != nil {
			report.Errors = append(report.Errors, model.BatchArticleEntry{Path: filepath.ToSlash(full), Error: err.Error()})
			continue
		}
		rel = filepath.ToSlash(rel)

		slug := slugFromMarkdownPath(rel)
		if slug == "" {
			report.Errors = append(report.Errors, model.BatchArticleEntry{Path: rel, Error: "cannot derive slug from path"})
			continue
		}
		n, err := domain.CountArticlesBySlug(ctx, slug)
		if err != nil {
			report.Errors = append(report.Errors, model.BatchArticleEntry{Path: rel, Error: err.Error()})
			continue
		}
		if n > 0 {
			report.Skipped = append(report.Skipped, model.BatchArticleEntry{Path: rel, Reason: "exists_slug"})
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

// slugFromMarkdownPath 使用路径中的文件名（不含目录、不含扩展名）作为 Slug，与 frontmatter 无关。
func slugFromMarkdownPath(rel string) string {
	base := filepath.Base(rel)
	ext := filepath.Ext(base)
	name := strings.TrimSpace(strings.TrimSuffix(base, ext))
	if name == "" || name == "." || name == ".." {
		return ""
	}
	return name
}

func (as *ArticleService) CreateArticle(ctx context.Context, path string) (uint, error) {

	slug := slugFromMarkdownPath(path)
	if slug == "" {
		return 0, fmt.Errorf("cannot derive slug from markdown path: %q", path)
	}

	now := time.Now()
	article := &domain.Article{
		Slug:      slug,
		Kind:      "",
		Markdown:  path,
		CreatedAt: now,
		UpdatedAt: now,
	}

	err := domain.Do(ctx, func(uow domain.UnitOfWork) error {
		repo := uow.Article()
		if err := repo.Save(ctx, article); err != nil {
			return err
		}

		id := article.ID
		if err := as.convert(ctx, repo, id, true); err != nil {
			return err
		}
		if err := as.buildIndex(ctx, repo, id); err != nil {
			return err
		}
		return nil
	})

	return article.ID, err
}

func (*ArticleService) convert(ctx context.Context, repo domain.ArticleRepository, id uint, force bool) error {
	acts, err := repo.Get(ctx, id)
	if err != nil {
		return err
	}

	article := acts[0]
	article.IsPublished = true

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
		return err
	}

	article.Html = path

	return repo.Update(ctx, article)
}

func (*ArticleService) buildIndex(ctx context.Context, repo domain.ArticleRepository, id uint) error {
	ar, err := repo.Get(ctx, id)
	if err != nil {
		return err
	}
	return ar[0].AddToIndex(ctx)
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

func (as *ArticleService) AddToSearchIndex(ctx context.Context, id uint) error {
	return domain.Do(ctx, func(uow domain.UnitOfWork) error {
		repo := uow.Article()
		return as.buildIndex(ctx, repo, id)
	})
}

func (*ArticleService) ShowArticle(ctx context.Context, path string) (*domain.OSSFile, error) {
	return domain.DownloadFile(ctx, path)
}
