package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"mjlab/api"
	"mjlab/internal/domain"
	"mjlab/internal/infra/config"
	"mjlab/internal/infra/database/sqlite3"
	"mjlab/internal/infra/oos/local"
	"mjlab/internal/infra/search"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yanyiwu/gojieba"
)

func main() {

	var (
		oss domain.OSS
		uow domain.UnitOfWork
		sg  domain.SearchIndex
	)

	oss = local.New(config.Cfg.WorkDir)
	uow = sqlite3.New(config.Cfg.Database.Source)

	jb := gojieba.NewJieba()
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
			log.Fatalf("listen: %s\n", err)
		}
	}()

	return srv
}

func startAdminServer() *http.Server {

	engine := gin.Default()
	engine.Use(api.RSAVerifyMiddleware())
	engine.POST("/article", api.CreateArticle)
	engine.POST("/project", api.AddProject)
	engine.POST("/rebuild-index", api.RebuildIndex)
	engine.POST("/article/:id/:status", api.ManageArticleStatus)
	engine.POST("/del-index", api.DelAllDocs)
	engine.POST("/add-article-index", api.AddArticleToIndex)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%d", 7700),
		Handler: engine,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	return srv
}
