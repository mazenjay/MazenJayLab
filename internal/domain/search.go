package domain

import (
	"context"
	"errors"
	"io"
	"strings"
	"time"
)

const (
	DefaultPage    = 1
	DefaultPerPage = 10
	MaxPerPage     = 100
	MaxKeywordLen  = 200
)

type Searchable interface {
	GetSearchID() uint                                    // 获取真实 ID (如 1)
	GetSearchType() string                                // 获取类型 (如 "article", "project")
	GetSearchTitle() string                               // 获取标题
	GetSearchSummary() string                             // 获取摘要
	GetSearchContent(ctx context.Context) (string, error) // 获取正文文本
	GetSearchTags() []string                              // 获取标签
	GetSearchCreatedAt() time.Time                        // 获取创建/发布时间
	GetIcon() string									// 获取展示Icon
}

type SearchIndex interface {
	io.Closer
	Index(ctx context.Context, doc Searchable) error
	IndexBatch(ctx context.Context, docs []Searchable) error
	Delete(ctx context.Context, docType string, id uint) error
	Search(ctx context.Context, query SearchQuery) (*SearchResults, error)
}

type SearchQuery struct {
	docType  string
	keywords string
	tags     []string
	page     int
	perPage  int
}

func (q SearchQuery) DocType() string  { return q.docType } // 新增：获取类型过滤条件
func (q SearchQuery) Keywords() string { return q.keywords }
func (q SearchQuery) Tags() []string   { return q.tags }
func (q SearchQuery) Page() int        { return q.page }
func (q SearchQuery) PerPage() int     { return q.perPage }
func (q SearchQuery) Offset() int      { return (q.page - 1) * q.perPage }

// HasTagFilter 是否包含标签过滤
func (q SearchQuery) HasTagFilter() bool { return len(q.tags) > 0 }

// HasDocTypeFilter 是否包含类型过滤
func (q SearchQuery) HasDocTypeFilter() bool { return q.docType != "" }

type SearchQueryBuilder struct {
	docType  string
	keywords string
	tags     []string
	page     int
	perPage  int
	errs     []string
}

func NewSearchQueryBuilder(keywords string) *SearchQueryBuilder {
	b := &SearchQueryBuilder{
		keywords: strings.TrimSpace(keywords),
		page:     DefaultPage,
		perPage:  DefaultPerPage,
	}
	if b.keywords == "" {
		b.errs = append(b.errs, "keywords must not be empty")
	}
	if len(b.keywords) > MaxKeywordLen {
		b.errs = append(b.errs, "keywords too long (max 200 chars)")
	}
	return b
}

func (b *SearchQueryBuilder) WithPage(page int) *SearchQueryBuilder {
	if page < 1 {
		page = DefaultPage
	}
	b.page = page
	return b
}

func (b *SearchQueryBuilder) WithPerPage(perPage int) *SearchQueryBuilder {
	if perPage < 1 {
		perPage = DefaultPerPage
	}
	if perPage > MaxPerPage {
		perPage = MaxPerPage
	}
	b.perPage = perPage
	return b
}

func (b *SearchQueryBuilder) WithTags(tags []string) *SearchQueryBuilder {
	seen := make(map[string]struct{})
	for _, t := range tags {
		t = strings.TrimSpace(t)
		if t == "" {
			continue
		}
		if _, ok := seen[t]; !ok {
			seen[t] = struct{}{}
			b.tags = append(b.tags, t)
		}
	}
	return b
}

func (b *SearchQueryBuilder) WithDocType(docType string) *SearchQueryBuilder {
	b.docType = docType
	return b
}

func (b *SearchQueryBuilder) Build() (SearchQuery, error) {
	if len(b.errs) > 0 {
		return SearchQuery{}, errors.New(strings.Join(b.errs, "; "))
	}
	return SearchQuery{
		keywords: b.keywords,
		tags:     b.tags,
		page:     b.page,
		perPage:  b.perPage,
	}, nil
}

// MustBuild 构建 SearchQuery，校验失败直接 panic（仅用于测试）
func (b *SearchQueryBuilder) MustBuild() SearchQuery {
	q, err := b.Build()
	if err != nil {
		panic(err)
	}
	return q
}

func NewSearchQuery(keywords string, page, perPage int) (SearchQuery, error) {
	return NewSearchQueryBuilder(keywords).
		WithPage(page).
		WithPerPage(perPage).
		Build()
}

type IndexField string

const (
	FieldIcon IndexField = "icon"
	FieldDocType   IndexField = "doc_type"
	FieldID        IndexField = "id"
	FieldTitle     IndexField = "title"
	FieldContent   IndexField = "content"
	FieldSummary   IndexField = "summary"
	FieldTags      IndexField = "tags"
	FieldPublished IndexField = "published_at"
)

type SearchResult struct {
	Type      string              `json:"type"`
	ID        uint                `json:"id"`
	Score     float64             `json:"score"`
	Title     string              `json:"title"`
	Summary   string              `json:"summary"`
	Highlight map[string][]string `json:"-"`
	Icon string `json:"icon_url"`
}

type SearchResults struct {
	Total   uint64
	Hits    []SearchResult
	Page    int
	PerPage int
}

func (r *SearchResults) TotalPages() int {
	if r.PerPage == 0 {
		return 0
	}
	total := int(r.Total)
	pages := total / r.PerPage
	if total%r.PerPage != 0 {
		pages++
	}
	return pages
}

var (
	index            SearchIndex
	NoSearchIndexErr = errors.New("no search index")
)

func InitSearchIndex(searchIndex SearchIndex) {
	if index != nil {
		return
	}
	index = searchIndex
}

func Search(ctx context.Context, query SearchQuery) (*SearchResults, error) {
	if index == nil {
		return nil, NoSearchIndexErr
	}
	return index.Search(ctx, query)
}

func AddDocs(ctx context.Context, docs []Searchable) error {
	if index == nil {
		return NoSearchIndexErr
	}

	return index.IndexBatch(ctx, docs)
}
