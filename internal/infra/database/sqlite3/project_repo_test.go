package sqlite3

import (
	"context"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"mjlab/internal/domain"
)

func setupProjectTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open db: %v", err)
	}

	if err := db.AutoMigrate(&domain.Project{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	return db
}

func TestProjectRepo_Get(t *testing.T) {
	db := setupProjectTestDB(t)
	repo := &ProjectRepo{db: db}

	// 准备测试数据
	projects := []*domain.Project{
		{ID: 1, Title: "项目A", Summary: "简介A", Slug: "project-a"},
		{ID: 2, Title: "项目B", Summary: "简介B", Slug: "project-b"},
		{ID: 3, Title: "项目C", Summary: "简介C", Slug: "project-c"},
	}
	db.CreateInBatches(projects, 3)

	ctx := context.Background()

	t.Run("正常获取多个ID", func(t *testing.T) {
		result, err := repo.Get(ctx, 1, 3)
		require.NoError(t, err)
		assert.Len(t, result, 2)
		assert.Equal(t, uint(1), result[0].ID)
		assert.Equal(t, uint(3), result[1].ID)
	})

	t.Run("传入空ID切片应返回空切片", func(t *testing.T) {
		result, err := repo.Get(ctx)
		require.NoError(t, err)
		assert.Empty(t, result)
	})

	t.Run("获取不存在的ID", func(t *testing.T) {
		result, err := repo.Get(ctx, 999)
		require.NoError(t, err)
		assert.Empty(t, result)
	})
}

func TestProjectRepo_List(t *testing.T) {
	db := setupProjectTestDB(t)
	repo := &ProjectRepo{db: db}

	// 准备测试数据
	now := time.Now()
	projects := []*domain.Project{
		{ID: 1, Title: "Go语言实战", Subtitle: "入门教程", Summary: "学习Go的最佳实践", Slug: "go1", SortOrder: 10, CreatedAt: now.Add(-time.Hour)},
		{ID: 2, Title: "AI绘画工具", Subtitle: "Midjourney", Summary: "基于AI的绘画生成器", Slug: "2", SortOrder: 20, CreatedAt: now.Add(-2 * time.Hour)},
		{ID: 3, Title: "项目管理平台", Subtitle: "Trello替代品", Summary: "团队协作工具", Slug: "3", SortOrder: 5, CreatedAt: now},
		{ID: 4, Title: "微服务架构", Subtitle: "", Summary: "Go微服务最佳实践", Slug: "4", SortOrder: 15, CreatedAt: now.Add(-30 * time.Minute)},
	}
	db.CreateInBatches(projects, 4)

	ctx := context.Background()

	t.Run("关键词搜索 - 标题", func(t *testing.T) {
		q := domain.Query{Keywords: "Go"}
		result, total, err := repo.List(ctx, q)
		require.NoError(t, err)
		assert.Equal(t, int64(2), total) // ID1 和 ID4
		assert.Len(t, result, 2)
	})

	t.Run("关键词搜索 - 简介", func(t *testing.T) {
		q := domain.Query{Keywords: "AI"}
		result, total, err := repo.List(ctx, q)
		require.NoError(t, err)
		assert.Equal(t, int64(1), total)
		assert.Equal(t, "AI绘画工具", result[0].Title)
	})

	t.Run("分页查询", func(t *testing.T) {
		q := domain.Query{
			Limit:  2,
			Offset: 2,
		}
		result, total, err := repo.List(ctx, q)
		require.NoError(t, err)
		assert.Equal(t, int64(4), total)
		assert.Len(t, result, 2)
	})

	t.Run("排序 - sort_order DESC", func(t *testing.T) {
		q := domain.Query{
			Sort:      "sort_order",
			SortOrder: "desc",
		}
		result, _, err := repo.List(ctx, q)
		require.NoError(t, err)
		assert.Equal(t, 20, result[0].SortOrder) // ID2
	})

	t.Run("无关键词时返回所有记录", func(t *testing.T) {
		q := domain.Query{Limit: 10}
		result, total, err := repo.List(ctx, q)
		require.NoError(t, err)
		assert.Equal(t, int64(4), total)
		assert.Len(t, result, 4)
	})
}

func TestProjectRepo_Save(t *testing.T) {
	db := setupProjectTestDB(t)
	repo := &ProjectRepo{db: db}
	ctx := context.Background()

	p := &domain.Project{
		Title:     "测试新项目",
		Subtitle:  "测试副标题",
		Summary:   "这是一个测试项目",
		Slug:      "project-a",
		RepoURL:   "https://github.com/test/project",
		LaunchURL: "https://example.com",
		SortOrder: 100,
	}

	err := repo.Save(ctx, p)
	require.NoError(t, err)
	assert.NotZero(t, p.ID) // 创建后ID应该被填充
}

func TestProjectRepo_Update(t *testing.T) {
	db := setupProjectTestDB(t)
	repo := &ProjectRepo{db: db}
	ctx := context.Background()

	// 先插入一条数据
	p := &domain.Project{Title: "旧标题", SortOrder: 1, RepoURL: "old", LaunchURL: "old"}
	db.Create(p)

	updateData := &domain.Project{
		ID:        p.ID,
		SortOrder: 999,
		RepoURL:   "https://github.com/new",
		LaunchURL: "https://new.example.com",
	}

	err := repo.Update(ctx, updateData)
	require.NoError(t, err)

	// 验证更新结果
	var updated domain.Project
	db.First(&updated, p.ID)

	assert.Equal(t, 999, updated.SortOrder)
	assert.Equal(t, "https://github.com/new", updated.RepoURL)
	assert.Equal(t, "https://new.example.com", updated.LaunchURL)
	assert.Equal(t, "旧标题", updated.Title) // 未更新字段应该保持不变
}

func TestProjectRepo_Delete(t *testing.T) {
	db := setupProjectTestDB(t)
	repo := &ProjectRepo{db: db}
	ctx := context.Background()

	p := &domain.Project{Title: "将被删除的项目"}
	db.Create(p)

	err := repo.Delete(ctx, p.ID)
	require.NoError(t, err)

	// 验证软删除（如果有 DeletedAt 字段）
	var count int64
	db.Model(&domain.Project{}).Unscoped().Where("id = ?", p.ID).Count(&count)
	assert.Equal(t, int64(1), count) // 数据还在，但 DeletedAt 不为空

	// 正常查询应该查不到
	var found domain.Project
	err = db.First(&found, p.ID).Error
	assert.Error(t, err) // gorm.ErrRecordNotFound
}
