package search

import (
	"context"
	"fmt"
	"log/slog"
	"mjlab/internal/domain"
	"os"
	"strconv"
	"sync"

	"github.com/blugelabs/bluge/analysis"
	"github.com/blugelabs/bluge/index"
	"github.com/blugelabs/bluge/search/highlight"

	blugelib "github.com/blugelabs/bluge"
)

const (
	batchSize = 200
)

type repo struct {
	mu        sync.RWMutex
	writer    *blugelib.Writer
	bilingual *analysis.Analyzer
}

func New(indexPath string, analyzer *analysis.Analyzer) domain.SearchIndex {
	var config blugelib.Config
	if indexPath == "" {
		config = blugelib.InMemoryOnlyConfig()
	} else {
		config = blugelib.DefaultConfig(indexPath)
	}
	config.DefaultSearchAnalyzer = analyzer
	writer, err := blugelib.OpenWriter(config)
	if err != nil {
		slog.Error(err.Error())
		os.Exit(0)
	}

	return &repo{writer: writer, bilingual: analyzer}
}

func (r *repo) Index(ctx context.Context, s domain.Searchable) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	doc := r.buildDocument(ctx, s)
	batch := blugelib.NewBatch()
	batch.Delete(doc.ID())
	batch.Update(doc.ID(), doc)
	return r.writer.Batch(batch)
}

func (r *repo) IndexBatch(ctx context.Context, ss []domain.Searchable) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	batch := blugelib.NewBatch()

	for i, s := range ss {
		doc := r.buildDocument(ctx, s)
		batch.Update(doc.ID(), doc)

		// flush per batchSize
		if (i+1)%batchSize == 0 {
			if err := r.flushBatchWithContext(ctx, batch, i); err != nil {
				return err
			}
			batch = blugelib.NewBatch()
		}
	}

	// flush remainder
	if err := r.flushBatchWithContext(ctx, batch, len(ss)); err != nil {
		return err
	}

	return nil
}

// flushBatchWithContext 支持 ctx 超时/取消
func (r *repo) flushBatchWithContext(ctx context.Context, batch *index.Batch, idx int) error {
	errCh := make(chan error, 1)

	go func() {
		err := r.writer.Batch(batch)
		errCh <- err
	}()

	select {
	case <-ctx.Done():
		return fmt.Errorf("flush batch at %d canceled: %w", idx, ctx.Err())
	case err := <-errCh:
		if err != nil {
			return fmt.Errorf("flush batch at %d failed: %w", idx, err)
		}
	}

	return nil
}

func (r *repo) Delete(_ context.Context, docType string, id uint) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	globalID := fmt.Sprintf("%s_%d", docType, id)
	doc := blugelib.NewDocument(globalID)
	batch := blugelib.NewBatch()
	batch.Delete(doc.ID())
	return r.writer.Batch(batch)
}

func (r *repo) Search(ctx context.Context, q domain.SearchQuery) (*domain.SearchResults, error) {
	r.mu.RLock()
	reader, err := r.writer.Reader()
	r.mu.RUnlock()
	if err != nil {
		return nil, fmt.Errorf("open bluge reader: %w", err)
	}
	defer reader.Close()

	blugeQuery := r.buildQuery(q)

	req := blugelib.NewTopNSearch(q.Offset()+q.PerPage(), blugeQuery).
		WithStandardAggregations().
		IncludeLocations()

	// highlight
	highlighter := highlight.NewHTMLHighlighter()

	dmi, err := reader.Search(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("bluge search: %w", err)
	}

	results := &domain.SearchResults{
		Page:    q.Page(),
		PerPage: q.PerPage(),
		Total:   dmi.Aggregations().Count(),
	}

	// skip offset documents
	skip := q.Offset()
	curr := 0
	for {
		match, err := dmi.Next()
		if err != nil {
			return nil, fmt.Errorf("iterate search results: %w", err)
		}
		if match == nil {
			break
		}
		if curr < skip {
			curr++
			continue
		}

		var articleID int64
		var title, summary, docType, icon string
		highlightMap := make(map[string][]string)

		err = match.VisitStoredFields(func(field string, value []byte) bool {
			var hlStr string
			if hlBytes := highlighter.BestFragment(match.Locations[field], value); len(hlBytes) > 0 {
				hlStr = string(hlBytes)
				highlightMap[field] = append(highlightMap[field], hlStr)
			}

			switch field {
			case string(domain.FieldID):
				articleID, _ = strconv.ParseInt(string(value), 10, 64)
			case string(domain.FieldIcon):
				icon = string(value)
			case string(domain.FieldDocType):
				docType = string(value)
			case string(domain.FieldTitle):
				if hlStr != "" {
					title = hlStr
				} else {
					title = string(value)
				}
			case string(domain.FieldSummary):
				if hlStr != "" {
					summary = hlStr
				} else {
					summary = string(value)
				}
			}
			return true
		})
		if err != nil {
			return nil, err
		}

		results.Hits = append(results.Hits, domain.SearchResult{
			ID:        uint(articleID),
			Type:      docType,
			Score:     match.Score,
			Title:     title,
			Summary:   summary,
			Highlight: highlightMap,
			Icon:      icon,
		})

		curr++
		if len(results.Hits) >= q.PerPage() {
			break
		}
	}

	return results, nil
}

func (r *repo) Close() error {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.writer.Close()
}

func (r *repo) buildDocument(ctx context.Context, s domain.Searchable) *blugelib.Document {

	globalID := fmt.Sprintf("%s_%d", s.GetSearchType(), s.GetSearchID())
	doc := blugelib.NewDocument(globalID)

	doc.AddField(blugelib.NewKeywordField(string(domain.FieldDocType), s.GetSearchType()).StoreValue())
	doc.AddField(blugelib.NewKeywordField(string(domain.FieldIcon), s.GetIcon()).StoreValue())
	idStr := strconv.FormatInt(int64(s.GetSearchID()), 10)
	// id field (stored, not analyzed)
	doc.AddField(
		blugelib.NewKeywordFieldBytes(string(domain.FieldID), []byte(idStr)).
			StoreValue().
			Aggregatable(),
	)

	// title field (stored + bilingual analyzed)
	doc.AddField(
		blugelib.NewTextField(string(domain.FieldTitle), s.GetSearchTitle()).
			WithAnalyzer(r.bilingual).
			StoreValue().
			HighlightMatches(),
	)

	// summary field (stored + bilingual analyzed)
	doc.AddField(
		blugelib.NewTextField(string(domain.FieldSummary), s.GetSearchSummary()).
			WithAnalyzer(r.bilingual).
			StoreValue().
			HighlightMatches(),
	)

	// content field (analyzed only, NOT stored)
	if content, err := s.GetSearchContent(ctx); err == nil {
		doc.AddField(
			blugelib.NewTextField(string(domain.FieldContent), content).
				WithAnalyzer(r.bilingual),
		)
	}

	// tags field (keyword, stored)
	tags := s.GetSearchTags()
	for _, tag := range tags {
		doc.AddField(
			blugelib.NewKeywordField(string(domain.FieldTags), tag).StoreValue(),
		)
	}

	// published_at (date, aggregatable)
	doc.AddField(
		blugelib.NewDateTimeField(string(domain.FieldPublished), s.GetSearchCreatedAt()).
			Aggregatable().
			StoreValue(),
	)

	return doc
}

func (r *repo) buildQuery(q domain.SearchQuery) blugelib.Query {

	titleQ := blugelib.NewMatchQuery(q.Keywords()).
		SetField(string(domain.FieldTitle)).
		SetAnalyzer(r.bilingual).
		SetBoost(3.0)

	summaryQ := blugelib.NewMatchQuery(q.Keywords()).
		SetField(string(domain.FieldSummary)).
		SetAnalyzer(r.bilingual).
		SetBoost(1.5)

	contentQ := blugelib.NewMatchQuery(q.Keywords()).
		SetField(string(domain.FieldContent)).
		SetAnalyzer(r.bilingual).
		SetBoost(1.0)

	shouldQuery := blugelib.NewBooleanQuery().
		AddShould(titleQ).
		AddShould(summaryQ).
		AddShould(contentQ)

	if len(q.Tags()) > 0 {
		for _, tag := range q.Tags() {
			tagQ := blugelib.NewTermQuery(tag).SetField(string(domain.FieldTags))
			shouldQuery.AddMust(tagQ)
		}
	}

	return shouldQuery
}
