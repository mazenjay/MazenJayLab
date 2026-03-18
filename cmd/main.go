package main

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"mjlab/api"
	"mjlab/internal/domain"
	"mjlab/internal/infra/config"
	"mjlab/internal/infra/database/sqlite3"
	"mjlab/internal/infra/oos/local"
	"mjlab/internal/infra/search"
	"mjlab/web"
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
	staticFS, _ := fs.Sub(web.Statics, "statics")
	engine.StaticFS("/statics", http.FS(staticFS))

	engine.SetFuncMap(api.IndexFunc)
	engine.LoadHTMLFS(http.FS(web.Statics), "template/*.html")

	engine.GET("/", api.Index)
	engine.GET("/:slug", api.ShowArticle)

	rg := engine.Group("/api")
	{
		rg.GET("/search", api.Search)
		rg.GET("/articles", api.ArticlePagination)
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
	engine.POST("/rebuild-index", api.RebuildIndex)
	engine.POST("/article/:id/:status", api.ManageArticleStatus)

	srv := &http.Server{
		Addr:    fmt.Sprintf("127.0.0.1:%d", config.Cfg.App.Port+1),
		Handler: engine,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	return srv
}
