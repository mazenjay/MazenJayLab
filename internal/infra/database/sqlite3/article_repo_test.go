package sqlite3

import (
	"context"
	"testing"

	"mjlab/internal/domain"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}

	if err := db.AutoMigrate(&domain.Article{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	return db
}

func seedTestData(t *testing.T, db *gorm.DB) {
	articles := []domain.Article{
		{Title: "Go Netpoll", Summary: "IO 模型", ViewCount: 100, IsPublished: true},
		{Title: "SQLite B+Tree", Summary: "索引结构", ViewCount: 200, IsPublished: true},
		{Title: "Container Runtime", Summary: "Linux 容器", ViewCount: 50, IsPublished: false},
	}

	for _, a := range articles {
		if err := db.Create(&a).Error; err != nil {
			t.Fatalf("seed error: %v", err)
		}
	}
}

func TestArticleRepo_CRUD(t *testing.T) {
	db := setupTestDB(t)
	seedTestData(t, db)

	repo := &ArticleRepo{db: db}
	ctx := context.Background()

	t.Run("Get", func(t *testing.T) {
		list, err := repo.Get(ctx, 1, 2)
		if err != nil {
			t.Fatal(err)
		}
		if len(list) != 2 {
			t.Fatalf("expected 2, got %d", len(list))
		}
	})

	t.Run("List with pagination", func(t *testing.T) {
		query := domain.Query{
			Limit:     2,
			Offset:    0,
			Sort:      "view_count",
			SortOrder: "desc",
		}

		list, total, err := repo.List(ctx, query)
		if err != nil {
			t.Fatal(err)
		}

		if total != 3 {
			t.Fatalf("expected total 3, got %d", total)
		}

		if len(list) != 2 {
			t.Fatalf("expected 2 items, got %d", len(list))
		}

		if list[0].ViewCount < list[1].ViewCount {
			t.Fatalf("expected desc order")
		}
	})

	t.Run("Keyword search", func(t *testing.T) {
		query := domain.Query{
			Keywords: "Go",
		}

		list, total, err := repo.List(ctx, query)
		if err != nil {
			t.Fatal(err)
		}

		if total != 1 {
			t.Fatalf("expected 1, got %d", total)
		}

		if list[0].Title != "Go Netpoll" {
			t.Fatalf("unexpected result")
		}
	})

	t.Run("Save", func(t *testing.T) {
		a := &domain.Article{
			Title:       "New Article",
			Summary:     "test",
			IsPublished: true,
		}

		if err := repo.Save(ctx, a); err != nil {
			t.Fatal(err)
		}

		if a.ID == 0 {
			t.Fatalf("ID not generated")
		}
	})

	t.Run("Update", func(t *testing.T) {
		a := &domain.Article{
			ID:    1,
			Title: "Updated Title",
		}

		if err := repo.Update(ctx, a); err != nil {
			t.Fatal(err)
		}

		var updated domain.Article
		db.First(&updated, 1)

		if updated.Title != "Updated Title" {
			t.Fatalf("update failed")
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := repo.Delete(ctx, 1); err != nil {
			t.Fatal(err)
		}

		var count int64
		db.Model(&domain.Article{}).Where("id = ?", 1).Count(&count)

		if count != 0 {
			t.Fatalf("delete failed")
		}
	})
}
