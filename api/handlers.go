package api

import (
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
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
	"time"

	"github.com/gin-gonic/gin"
)

func init() {
	articleServ = &application.ArticleService{}
	searchServ = &application.SearchService{}
	proServ = &application.ProjectService{}
}

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
	ErrSignatureMissing = errors.New("signature header missing")
	ErrSignatureInvalid = errors.New("invalid signature")
	ErrTimestampInvalid = errors.New("timestamp invalid or too old")
	ErrNonceMissing     = errors.New("nonce missing")
	trustedPublicKeys   []*rsa.PublicKey
)

func init() {
	loadTrustedKeysFromDir()
}

func loadTrustedKeysFromDir() {
	var dir string
	dir = filepath.Join(config.WorkDir, ".keys")
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}

	for _, entry := range entries {
		if entry.IsDir() || !strings.HasSuffix(entry.Name(), ".pem") {
			continue
		}

		path := filepath.Join(dir, entry.Name())
		pemBytes, err := os.ReadFile(path)
		if err != nil {
			slog.Warn("无效 PEM 格式", "file", entry.Name())
			continue
		}

		block, _ := pem.Decode(pemBytes)
		if block == nil {
			slog.Warn("无效 PEM 格式", "file", entry.Name())
			continue
		}

		pub, err := x509.ParsePKIXPublicKey(block.Bytes)
		if err != nil {
			slog.Warn("解析公钥失败", "file", entry.Name(), "err", err)
			continue
		}

		if rsaPub, ok := pub.(*rsa.PublicKey); ok {
			trustedPublicKeys = append(trustedPublicKeys, rsaPub)
			slog.Info("加载信任公钥", "file", entry.Name(), "path", path)
		}

	}

	slog.Info("总共加载信任公钥数量", "count", len(trustedPublicKeys))

}

func RSAVerifyMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		if len(trustedPublicKeys) == 0 {
			c.AbortWithStatus(http.StatusUnauthorized)
			return
		}

		sigBase64 := c.GetHeader("X-Signature")
		timestamp := c.GetHeader("X-Timestamp")
		nonce := c.GetHeader("X-Nonce")

		if sigBase64 == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": ErrSignatureMissing.Error()})
			return
		}
		if nonce == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": ErrNonceMissing.Error()})
			return
		}

		ts, err := time.Parse(time.RFC3339, timestamp)
		if err != nil || time.Since(ts) > 5*time.Minute || time.Since(ts) < -30*time.Second {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": ErrTimestampInvalid.Error()})
			return
		}

		var bodyHash string
		if c.Request.Body != nil && c.Request.ContentLength > 0 {
			body, _ := io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(strings.NewReader(string(body)))
			h := sha256.Sum256(body)
			bodyHash = base64.StdEncoding.EncodeToString(h[:])
		}

		signString := fmt.Sprintf("%s\n%s\n%s\n%s\n%s",
			c.Request.Method,
			c.Request.URL.Path,
			timestamp,
			nonce,
			bodyHash,
		)

		sigBytes, err := base64.StdEncoding.DecodeString(sigBase64)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": ErrSignatureInvalid.Error()})
			return
		}

		hash := sha256.Sum256([]byte(signString))

		var verified bool
		for i, pk := range trustedPublicKeys {
			err := rsa.VerifyPKCS1v15(pk, crypto.SHA256, hash[:], sigBytes)
			if err == nil {
				verified = true
				slog.Debug("签名验证通过", "key_index", i)
				break
			}
		}

		if !verified {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid signature - no matching public key"})
			return
		}

		c.Next()

	}
}

var (
	articleServ *application.ArticleService
	searchServ  *application.SearchService
	proServ     *application.ProjectService
)

func ArticlePagination(c *gin.Context) {
	var (
		query domain.Query
		err   error
	)
	const pageSize = 5
	query.Sort = c.DefaultQuery("sort", "created_at")
	query.SortOrder = c.DefaultQuery("sort_order", "desc")
	query.Keywords = c.DefaultQuery("keywords", "")
	query.Limit = pageSize + 1
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	query.Offset = (page - 1) * pageSize

	records, total := articleServ.Pagination(c, query)
	c.JSON(http.StatusOK, model.Page{Total: total, Records: records[:min(len(records), pageSize)], HasMore: len(records) > pageSize})
}

func ShowArticle(c *gin.Context) {
	slug := c.Param("slug")
	path := filepath.Join("article", slug+".html")
	article, err := articleServ.ShowArticle(c, path)
	if err != nil {
		c.String(404, "article not found")
		return
	}
	defer article.Close()
	c.DataFromReader(http.StatusOK, -1, "text/html", article, nil)
}

// Search API: default and max per_page (single page; spotlight shows at most this many).
const searchAPIDefaultPerPage = 20
const searchAPIMaxPerPage = 20

func clampSearchPerPage(p int) int {
	if p < 1 {
		p = searchAPIDefaultPerPage
	}
	if p > searchAPIMaxPerPage {
		return searchAPIMaxPerPage
	}
	return p
}

func Search(c *gin.Context) {
	var param model.SearchParam
	if err := c.ShouldBindQuery(&param); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	cmd := strings.ToLower(strings.TrimSpace(param.Command))
	query := application.SearchCommand{
		Keywords: strings.TrimSpace(param.Keywords),
		Page:     param.Page,
		PerPage:  clampSearchPerPage(param.PerPage),
	}

	switch cmd {
	case "tags":
		query.Tags = splitSearchTags(param.Keywords)
		query.Keywords = ""
	case "title":
		query.TitleOnly = true
	case "date":
		df, err := domain.ParseDateKeyword(param.Keywords)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		query.DateFilter = df
		query.Keywords = ""
	case "kind":
		query.Type = strings.TrimSpace(param.Keywords)
		query.Keywords = ""
	default:
		// 普通全文搜索，command 为空或未知
	}

	res, err := searchServ.Search(c, query)
	if err != nil || res == nil {
		slog.Error("search failed", "err", err)
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(200, model.Page{Total: int64(res.Total), Records: res.Hits})
}

func splitSearchTags(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		out = append(out, p)
	}
	return out
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

	id, err := articleServ.CreateArticle(c, path)
	if err != nil {
		c.AbortWithStatus(http.StatusInternalServerError)
		return
	}

	c.JSON(200, gin.H{
		"id": id,
	})
}

// BatchCreateArticles POST /batch-articles
// 固定扫描 WorkDir/article_md；表单 recursive（默认 true；0/false/no 为仅当前目录，不含子目录）
func BatchCreateArticles(c *gin.Context) {
	rec := true
	if v := strings.ToLower(strings.TrimSpace(c.PostForm("recursive"))); v == "0" || v == "false" || v == "no" {
		rec = false
	}

	rep, err := articleServ.CreateArticles(c.Request.Context(), rec)
	if err != nil {
		slog.Warn("batch articles failed", "err", err)
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rep)
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
		_ = searchServ.RebuildIndex(c)
	}()

	c.JSON(200, gin.H{
		"message": "index rebuilt",
	})
}

func DelAllDocs(c *gin.Context) {
	err := searchServ.DelIndex(c)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
			"message": err,
		})
		slog.Warn("del index failed", "error", err)
	}

	c.JSON(200, gin.H{
		"message": "del all docs success",
	})
}

func AddArticleToIndex(c *gin.Context) {
	var (
		id  int
		err error
	)
	idStr := c.PostForm("id")

	if id, err = strconv.Atoi(idStr); err == nil {
		if err = articleServ.AddToSearchIndex(c, uint(id)); err == nil {
			c.JSON(200, gin.H{
				"message": "success",
			})
			return
		}
	}

	c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
		"message": err,
	})

}

func GetProjectIcon(c *gin.Context) {
	slug := c.Param("path")
	rel := filepath.Join("upload", slug+".jpeg")
	data, err := proServ.GetAppIcon(c, rel)
	if err != nil {
		c.String(http.StatusNotFound, "icon not found")
		return
	}

	c.Data(http.StatusOK, "image/jpeg", data)
}

func GetProjects(c *gin.Context) {
	projects, err := proServ.GetProjects(c)
	if err != nil {
		slog.Warn("get projects failed", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"projects": projects,
	})
}

func AddProject(c *gin.Context) {
	raw := c.PostForm("project")
	if raw == "" {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "project field required"})
		return
	}

	var param model.ProjectCreateParam
	if err := json.Unmarshal([]byte(raw), &param); err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid project json"})
		return
	}

	project, err := application.ProjectFromCreateParam(param)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var icon []byte
	if fh, err := c.FormFile("icon"); err == nil && fh != nil {
		f, err := fh.Open()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "open icon failed"})
			return
		}
		icon, err = io.ReadAll(f)
		_ = f.Close()
		if err != nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "read icon failed"})
			return
		}
	}

	if err := proServ.Add(c, project, icon); err != nil {
		slog.Warn("add project failed", "error", err)
		c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": project.ID})
}
