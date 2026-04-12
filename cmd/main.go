package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"mjlab/api"
	"mjlab/internal/domain"
	"mjlab/internal/infra/config"
	"mjlab/internal/infra/database/postgres"
	"mjlab/internal/infra/database/sqlite3"
	"mjlab/internal/infra/logging"
	"mjlab/internal/infra/oos/local"
	"mjlab/internal/infra/search"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yanyiwu/gojieba"
	"gorm.io/gorm"
)

func newUnitOfWork(gormCfg *gorm.Config) domain.UnitOfWork {
	if config.IsPostgresDriver() {
		return postgres.New(config.Cfg.Database.Source, gormCfg)
	}
	return sqlite3.New(config.Cfg.Database.Source, gormCfg)
}

func main() {
	logWriter, logCleanup, err := logging.Setup(config.Cfg.Log)
	if err != nil {
		_, _ = fmt.Fprintf(os.Stderr, "logging setup: %v\n", err)
		os.Exit(1)
	}
	defer logCleanup()

	if strings.EqualFold(strings.TrimSpace(config.Cfg.App.Env), "release") {
		gin.SetMode(gin.ReleaseMode)
	}
	gin.DefaultWriter = logWriter
	gin.DefaultErrorWriter = logWriter

	gormCfg := logging.GormConfig(logWriter, config.Cfg.Log)

	var (
		oss domain.OSS
		uow domain.UnitOfWork
		sg  domain.SearchIndex
	)

	oss = local.New(config.WorkDir)
	uow = newUnitOfWork(gormCfg)

	var jb *gojieba.Jieba
	if config.Mode == "release" {
		dictDir := filepath.Join(config.WorkDir, "dict")
		jb = gojieba.NewJieba(
			filepath.Join(dictDir, "jieba.dict.utf8"),
			filepath.Join(dictDir, "hmm_model.utf8"),
			filepath.Join(dictDir, "user.dict.utf8"),
			filepath.Join(dictDir, "idf.utf8"),
			filepath.Join(dictDir, "stop_words.utf8"),
		)
	} else {
		jb = gojieba.NewJieba()
	}
	defer jb.Free()
	sg = search.New(config.Cfg.Search.IndexPath, search.NewJiebaAnalyzer(jb))

	domain.InitOSS(oss)
	domain.InitRepo(uow)
	domain.InitSearchIndex(sg)

	// web server
	user := startUserServer()
	admin := startAdminServer()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_ = user.Shutdown(ctx)
	_ = admin.Shutdown(ctx)

}

func startUserServer() *http.Server {
	engine := gin.Default()
	engine.Use(api.Options)
	engine.StaticFile("/static/app.css", filepath.Join(config.WorkDir, "app.css"))
	engine.Static(config.Cfg.Article.PublicAssetURLPrefix, filepath.Clean(config.Cfg.Article.MarkDownPath))

	engine.GET("/:slug", api.ShowArticle)

	rg := engine.Group("/api")
	{
		rg.GET("/search", api.Search)
		rg.GET("/articles", api.ArticlePagination)
		rg.GET("/icon/:path", api.GetProjectIcon)
		rg.GET("/projects", api.GetProjects)
	}

	srv := &http.Server{
		Addr:                         fmt.Sprintf(":%d", config.Cfg.App.Port),
		DisableGeneralOptionsHandler: true,
		Handler:                      engine,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("user server listen failed", "err", err)
			os.Exit(1)
		}
	}()

	return srv
}

func startAdminServer() *http.Server {

	engine := gin.Default()
	// engine.Use(api.RSAVerifyMiddleware())
	engine.POST("/article", api.CreateArticle)
	engine.POST("/batch-articles", api.BatchCreateArticles)
	engine.POST("/project", api.AddProject)
	engine.POST("/rebuild-index", api.RebuildIndex)
	engine.POST("/article/:id/:status", api.ManageArticleStatus)
	engine.POST("/del-index", api.DelAllDocs)
	engine.POST("/add-article-index", api.AddArticleToIndex)

	srv := &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", 7700),
		Handler: engine,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("admin server listen failed", "err", err)
			os.Exit(1)
		}
	}()

	return srv
}
