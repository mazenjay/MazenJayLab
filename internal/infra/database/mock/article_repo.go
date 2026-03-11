package mock

import (
	"context"
	"errors"
	"mjlab/internal/domain"
	"slices"
	"sort"
	"strings"
	"time"
)

var articleRepo = &ArticleRepo{
	data: []*domain.Article{
		{
			ID:          1,
			Title:       "Building the Digital Glass Lab",
			Slug:        "digital-glass-lab",
			Summary:     "Exploring the intersection of Glassmorphism and modern web performance",
			ViewCount:   12,
			IsPublished: true,
			Tag:         "DESIGN",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          2,
			Title:       "Go vs Rust: A Benchmark",
			Slug:        "go-vs-rust-benchmark",
			Summary:     "Running 1 million requests per second. Which language holds up better?",
			ViewCount:   32,
			IsPublished: true,
			Tag:         "BACKEND",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
		{
			ID:          3,
			Title:       "Minimalist Interfaces",
			Slug:        "minimalist-interfaces",
			Summary:     "Why 'Less is More' is harder than it looks.",
			ViewCount:   8,
			IsPublished: true,
			Tag:         "UI",
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		},
	},
	nextID: 0,
}

type ArticleRepo struct {
	data   []*domain.Article
	nextID uint
}

func (r *ArticleRepo) Get(_ context.Context, ids ...uint) ([]*domain.Article, error) {
	var articles []*domain.Article
	for _, val := range r.data {
		if slices.Contains(ids, val.ID) {
			articles = append(articles, val)
		}
	}

	return articles, nil
}

func (r *ArticleRepo) List(_ context.Context, q domain.Query) ([]*domain.Article, int64, error) {

	result := make([]*domain.Article, 0)

	// 关键词过滤
	for _, article := range r.data {
		if q.Keywords != "" {
			if !strings.Contains(strings.ToLower(article.Title), strings.ToLower(q.Keywords)) &&
				!strings.Contains(strings.ToLower(article.Summary), strings.ToLower(q.Keywords)) {
				continue
			}
		}
		result = append(result, article)
	}

	total := int64(len(result))

	// 排序
	if q.Sort != "" {
		sort.Slice(result, func(i, j int) bool {
			var less bool

			switch q.Sort {
			case "created_at":
				less = result[i].CreatedAt.Before(result[j].CreatedAt)
			case "view_count":
				less = result[i].ViewCount < result[j].ViewCount
			default:
				less = result[i].ID < result[j].ID
			}

			if strings.ToLower(q.SortOrder) == "desc" {
				return !less
			}
			return less
		})
	}

	// 分页
	start := q.Offset
	end := q.Offset + q.Limit

	if start > len(result) {
		return []*domain.Article{}, total, nil
	}

	if end > len(result) {
		end = len(result)
	}

	if q.Limit == 0 {
		return result, total, nil
	}

	return result[start:end], total, nil
}

func (r *ArticleRepo) Save(_ context.Context, article *domain.Article) error {
	article.ID = r.nextID
	r.nextID++
	article.CreatedAt = time.Now()
	article.UpdatedAt = time.Now()

	r.data = append(r.data, article)
	return nil
}

func (r *ArticleRepo) Update(_ context.Context, article *domain.Article) error {
	for i, val := range r.data {
		if val.ID == article.ID {
			article.UpdatedAt = time.Now()
			r.data[i] = article
			return nil
		}
	}
	return errors.New("not found")
}

func (r *ArticleRepo) Delete(_ context.Context, id uint) error {
	for i, val := range r.data {
		if val.ID == id {
			r.data = append(r.data[:i], r.data[i+1:]...)
			return nil
		}
	}
	return errors.New("not found")
}
