package api

import (
	"fmt"
	"html/template"
	"log/slog"
	"mjlab/api/model"
	"mjlab/internal/application"
	"mjlab/internal/domain"
	"mjlab/internal/infra/config"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

func Options(c *gin.Context) {
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
	c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
	c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(204)
		return
	}
	c.Next()
}

var (
	articleServ *application.ArticleService

	searchServ *application.SearchService

	IndexFunc = template.FuncMap{
		"animDelay": func(index int) string {
			return fmt.Sprintf("%.2fs", float64(index)*0.05)
		},
		"gridClass": func(index int) string {
			// 蓝图 1：1个巨无霸，4个标准，2个宽扁
			blueprint1 := []string{
				"md:col-span-2 md:row-span-2", // 0
				"md:col-span-1 md:row-span-1", // 1
				"md:col-span-1 md:row-span-1", // 2
				"md:col-span-1 md:row-span-1", // 3
				"md:col-span-1 md:row-span-1", // 4
				"md:col-span-2 md:row-span-1", // 5
				"md:col-span-2 md:row-span-1", // 6
			}
			if index < len(blueprint1) {
				return blueprint1[index]
			}
			return "md:col-span-1 md:row-span-1"
		},
	}
)

func Index(c *gin.Context) {
	var (
		hasMore bool
		query   domain.Query
	)
	const pageSize = 7

	query.SortOrder = "desc"
	query.Sort = "created_at"
	query.Limit = pageSize + 1
	records, total := articleServ.Pagination(c, query)
	hasMore = len(records) > pageSize

	pages := total / pageSize
	if pages*pageSize < total {
		pages += 1
	}

	c.HTML(http.StatusOK, "index.html", &gin.H{
		"Articles":   records[:min(len(records), pageSize)],
		"HasMore":    hasMore,
		"TotalPages": pages,
	})

}

func ArticlePagination(c *gin.Context) {
	var (
		query domain.Query
		err   error
	)
	const pageSize = 7
	query.Sort = c.DefaultQuery("sort", "created_at")
	query.SortOrder = c.DefaultQuery("sort_order", "desc")
	query.Keywords = c.DefaultQuery("keywords", "")
	query.Limit = pageSize + 1
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
	}
	query.Offset = (page - 1) * pageSize

	records, total := articleServ.Pagination(c, query)
	c.JSON(200, model.Page{Total: total, Records: records[:min(len(records), pageSize)], HasMore: len(records) > pageSize})
}

func ShowArticle(c *gin.Context) {
	slug := c.Param("slug")
	path := filepath.Join(config.Cfg.Article.OutputDir, slug+".html")
	if _, err := os.Stat(path); err != nil {
		c.String(404, "article not found")
		return
	}

	c.File(path)
}

func Search(c *gin.Context) {
	var (
		param model.SearchParam
		query application.SearchCommand
		err   error

		res *domain.SearchResults
	)
	if err = c.ShouldBindQuery(&param); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
	}

	switch param.Command {
	case "note":
		query.Type = "article"
	case "tags":
		query.Tags = strings.Split(param.Keywords, ",")
	default:
	}

	query.Keywords = param.Keywords
	query.Page = param.Page
	query.PerPage = param.PerPage

	if res, err = searchServ.Search(c, query); err != nil || res == nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(200, model.Page{Total: int64(res.Total), Records: res.Hits})

}

func CreateArticle(c *gin.Context) {
	var (
		path  string
		exist bool
	)

	if path, exist = c.GetPostForm("path"); !exist {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	id, err := articleServ.Add(c, path)
	if err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	go articleServ.ConvertMd(c, true, true, id)

	c.JSON(200, gin.H{
		"id": id,
	})
}

func ManageArticleStatus(c *gin.Context) {
	var (
		id  uint64
		err error
	)

	if id, err = strconv.ParseUint(c.Param("id"), 10, 64); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	err = articleServ.ManageArticleStatus(c, uint(id), c.Param("status"))
	if err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(200, gin.H{
		"message": "article status updated",
	})
}

func RebuildIndex(c *gin.Context) {

	go func() {
		err := searchServ.RebuildIndex(c)
		slog.Warn("rebuild index completed", "error", err)
	}()

	c.JSON(200, gin.H{
		"message": "index rebuilt",
	})
}
