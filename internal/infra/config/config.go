package config

import (
	"fmt"
	"log/slog"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

func init() {
	initVar()

	// read configure file
	viper.SetConfigName("config")
	viper.SetConfigType("toml")
	viper.AddConfigPath(".")
	viper.AddConfigPath(WorkDir)
	viper.SetEnvPrefix("MJ")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := viper.ReadInConfig(); err != nil {
		slog.Warn("未找到配置文件，将全部使用默认值或环境变量", "err", err)
	}
	if err := viper.Unmarshal(&Cfg); err != nil {
		slog.Error("无法读取配置: ", "err", err)
		os.Exit(1)
	}

	var (
		article  = filepath.Join(WorkDir, "article")
		templ    = filepath.Join(WorkDir, "template.html")
		index    = filepath.Join(WorkDir, "index")
		dbFile   = filepath.Join(WorkDir, "data", "mazenjay.db")
		logFile  = filepath.Join(WorkDir, "logs", "app.log")
		artilemd = filepath.Join(WorkDir, "article_md")
	)
	// 数据文件、主日志路径为约定目录，不在配置文件中提供（忽略 toml / 环境变量中的覆盖）

	Cfg.App.Env = Mode
	if isPostgresDriver(Cfg.Database.Driver) {
		if strings.TrimSpace(Cfg.Database.Source) == "" {
			Cfg.Database.Source = buildPostgresDSN(Cfg.Database)
		}
	} else {
		Cfg.Database.Source = ProcessPath("", dbFile, false)
	}
	Cfg.Article.OutputDir = ProcessPath("", article, true)
	Cfg.Article.Template = ProcessPath("", templ, false)
	Cfg.Search.IndexPath = ProcessPath("", index, true)
	Cfg.Log.File = ProcessPath("", logFile, false)
	Cfg.Article.MarkDownPath = ProcessPath("", artilemd, true)
	Cfg.Article.PublicAssetURLPrefix = "/images"

}

var Cfg Config

// Config 整个应用的配置总结构体
type Config struct {
	App      AppConfig     `mapstructure:"app"`
	Log      LogConfig     `mapstructure:"log"`
	Article  ArticleConfig `mapstructure:"article"` // ← 新增：生成的静态内容配置
	Database DbConfig      `mapstructure:"database"`
	Search   SearchConfig  `mapstructure:"search"`
}

// LogConfig [log] 文件日志与滚动切分（lumberjack）；日志文件路径由程序固定为 WorkDir/logs/app.log，不在此配置
type LogConfig struct {
	File       string `mapstructure:"file"`         // 由 init 固定为 WorkDir/logs/app.log，mapstructure 项忽略
	MaxSizeMB  int    `mapstructure:"max_size_mb"`  // 单文件最大 MB，超限滚动；默认 100
	MaxBackups int    `mapstructure:"max_backups"`  // 保留历史文件个数；默认 10
	MaxAgeDays int    `mapstructure:"max_age_days"` // 保留天数；0 表示不按日期删除
	Compress   bool   `mapstructure:"compress"`     // 是否 gzip 压缩已滚动文件
	Console    bool   `mapstructure:"console"`      // 是否同时写入 stderr
	Level      string `mapstructure:"level"`        // debug / info / warn / error，默认 info
}

// AppConfig [app] 部分
type AppConfig struct {
	Env  string `mapstructure:"env"`  // debug / release
	Port int    `mapstructure:"port"` // "8080"
}

// ArticleConfig [content] 部分（新增，用于 Markdown → HTML 生成）
type ArticleConfig struct {
	OutputDir      string `mapstructure:"output_dir"`       // 生成的 HTML 文件存放目录，例如 "./public/generated"
	ServePrefix    string `mapstructure:"serve_prefix"`     // 静态服务的前缀，例如 "/generated" 或 "/articles"
	CleanOnStartup bool   `mapstructure:"clean_on_startup"` // 启动时是否清空 output_dir（默认 false）
	Template       string `mapstructure:"template"`         // 自定义 HTML 模板目录（如果用模板渲染）
	MarkDownPath   string
	// PublicAssetURLPrefix 对外暴露 Markdown 资源时的 URL 前缀（与 Gin Static、Next/nginx 反代一致），如 /article_md
	PublicAssetURLPrefix string `mapstructure:"public_asset_url_prefix"`
}

// DbConfig [database] 部分
// sqlite: Source 固定为 WorkDir/data/mazenjay.db（见 init）。
// postgres: 无 source 时用 host/port/user/password/db_name 拼 DSN；也可直接写 source=postgres://...
type DbConfig struct {
	Driver   string `mapstructure:"driver"`
	Source   string `mapstructure:"source"`
	Host     string `mapstructure:"host,omitempty"`
	Port     string `mapstructure:"port,omitempty"`
	User     string `mapstructure:"user,omitempty"`
	Password string `mapstructure:"password,omitempty"`
	DBName   string `mapstructure:"db_name,omitempty"`
}

type SearchConfig struct {
	IndexPath string `mapstructure:"index_path"`
}

func isPostgresDriver(driver string) bool {
	switch strings.ToLower(strings.TrimSpace(driver)) {
	case "postgres", "postgresql", "pg":
		return true
	default:
		return false
	}
}

// IsPostgresDriver 是否使用 PostgreSQL（供 main 选择仓储实现）。
func IsPostgresDriver() bool {
	return isPostgresDriver(Cfg.Database.Driver)
}

// buildPostgresDSN 由字段拼 postgres URL；生产请将 sslmode 改为 require（可通过 source 整串覆盖）。
func buildPostgresDSN(c DbConfig) string {
	host := strings.TrimSpace(c.Host)
	if host == "" {
		host = "127.0.0.1"
	}
	port := strings.TrimSpace(c.Port)
	if port == "" {
		port = "5432"
	}
	user := strings.TrimSpace(c.User)
	if user == "" {
		user = "postgres"
	}
	dbname := strings.TrimSpace(c.DBName)
	if dbname == "" {
		dbname = "mjlab"
	}
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(user, c.Password),
		Host:   fmt.Sprintf("%s:%s", host, port),
		Path:   "/" + strings.TrimPrefix(dbname, "/"),
	}
	// 不在 URL 里传 TimeZone：url.QueryEscape 会把 Asia/Shanghai 变成 Asia%2FShanghai，
	// pgx 传给服务端后会被当成非法时区名。会话时区用数据库默认（常见为 UTC）；展示时在应用层处理。
	q := url.Values{}
	q.Set("sslmode", "disable")
	u.RawQuery = q.Encode()
	return u.String()
}

func ProcessPath(path string, defaultPath string, isDir bool) string {
	home, _ := os.UserHomeDir()

	if path == "" {
		if strings.HasPrefix(defaultPath, "~") {
			defaultPath = strings.Replace(defaultPath, "~", home, 1)
		}
		var dir string
		if isDir {
			dir = defaultPath
		} else {
			dir = filepath.Dir(defaultPath)
		}
		err := os.MkdirAll(dir, 0755)
		if err != nil {
			panic(err)
		}

		return defaultPath
	}

	if strings.HasPrefix(path, "~") {
		return strings.Replace(path, "~", home, 1)
	}

	return path

}

// ArticleMarkdownRootRelative 返回 MarkDownPath 相对 WorkDir 的路径（正斜杠），用于 Markdown 资源路径校验与改写。
func ArticleMarkdownRootRelative() string {
	rel, err := filepath.Rel(WorkDir, filepath.Clean(Cfg.Article.MarkDownPath))
	if err != nil {
		return "article_md"
	}
	s := filepath.ToSlash(rel)
	if s == "." || s == "" {
		return "article_md"
	}
	return s
}
