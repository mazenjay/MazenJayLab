package search

import (
	"context"
	"fmt"
	"strings"
	"testing"
	"time"

	"mjlab/internal/domain"

	"github.com/yanyiwu/gojieba"
)

func TestArticleSearchEngine(t *testing.T) {
	// [1] 初始化结巴分词与分析器 (全局单例)
	jb := gojieba.NewJieba()
	defer jb.Free()

	analyzer := NewJiebaAnalyzer(jb)

	// [2] 初始化纯内存的搜索引擎 Repo
	repo := New("", analyzer)

	defer repo.Close()

	ctx := context.Background()

	// [3] 准备测试文章数据
	mockArticles := []*domain.Article{
		{
			ID:        1,
			Title:     "深入理解 Go 语言并发模型",
			Summary:   "Go 语言通过 Goroutine 和 Channel 实现了高性能的并发处理机制。",
			Tag:       "golang,backend",
			CreatedAt: time.Now(),
		},
		{
			ID:        2,
			Title:     "Rust 内存安全探秘",
			Summary:   "Rust 的所有权机制彻底解决了空指针和内存泄漏的问题。",
			Tag:       "rust,backend",
			CreatedAt: time.Now(),
		},
		{
			ID:        3,
			Title:     "使用 Gin 框架构建高性能 API",
			Summary:   "Gin 是一个非常轻量级的 Go Web 框架，路由速度极快。",
			Tag:       "golang,web",
			CreatedAt: time.Now(),
		},
	}

	ss := make([]domain.Searchable, len(mockArticles))
	for i, a := range mockArticles {
		ss[i] = a
	}
	// [4] 测试批量写入
	var err error
	err = repo.IndexBatch(ctx, ss)
	if err != nil {
		t.Fatalf("Failed to index articles: %v", err)
	}
	fmt.Println("✅ 成功索引了 3 篇文章")

	// ---------------------------------------------------------
	// 测试用例 A: 搜索含有中英文混合的词汇，并验证高亮
	// ---------------------------------------------------------
	fmt.Println("\n--- 测试用例 A: 搜索 'Go并发' ---")

	// 使用 domain 中优雅的 Builder 模式构建真正的 SearchQuery
	q1 := domain.NewSearchQueryBuilder("Go并发").
		WithPage(1).
		WithPerPage(10).
		MustBuild()

	res1, err := repo.Search(ctx, q1)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	if res1.Total == 0 {
		t.Errorf("Expected to find articles for 'Go并发', but got 0")
	}

	for _, hit := range res1.Hits {
		fmt.Printf("匹配文章 ID: %d, 得分: %.2f\n", hit.ID, hit.Score)
		fmt.Printf("高亮标题: %s\n", hit.Title)
		fmt.Printf("高亮摘要: %s\n", hit.Summary)

		// 验证 <mark> 高亮标签是否成功包裹住了关键字
		if hit.ID == 1 {
			if !strings.Contains(hit.Title, "<mark>") {
				t.Errorf("Expected highlight <mark> in Title, got: %s", hit.Title)
			}
		}
	}

	// ---------------------------------------------------------
	// 测试用例 B: 测试 Tag 过滤 (只搜 web 分类下的 Go 文章)
	// ---------------------------------------------------------
	fmt.Println("\n--- 测试用例 B: 搜索 'Go' 且 Tag='web' ---")

	q2 := domain.NewSearchQueryBuilder("Go").
		WithTags([]string{"web"}).
		WithPage(1).
		WithPerPage(10).
		MustBuild()

	res2, err := repo.Search(ctx, q2)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	// 应该只有 ID=3 的文章 (Gin框架) 符合要求
	if res2.Total != 1 || res2.Hits[0].ID != 3 {
		t.Errorf("Expected only article 3 to match, got total: %d", res2.Total)
	} else {
		fmt.Printf("✅ Tag 过滤成功，匹配到文章 ID: %d - %s\n", res2.Hits[0].ID, res2.Hits[0].Title)
	}

	// ---------------------------------------------------------
	// 测试用例 C: 测试文章删除
	// ---------------------------------------------------------
	fmt.Println("\n--- 测试用例 C: 测试删除文章 3 ---")
	err = repo.Delete(ctx, "article", 3)
	if err != nil {
		t.Fatalf("Failed to delete article: %v", err)
	}

	// 删除后，再次搜索 "Gin"
	q3 := domain.NewSearchQueryBuilder("Gin").
		WithPage(1).
		WithPerPage(10).
		MustBuild()

	res3, err := repo.Search(ctx, q3)
	if err != nil {
		t.Fatalf("Search failed: %v", err)
	}

	if res3.Total != 0 {
		t.Errorf("Expected article 3 to be deleted, but still found %d results", res3.Total)
	} else {
		fmt.Println("✅ 删除功能正常，已无法搜出被删除的文章 ID=3")
	}
}
