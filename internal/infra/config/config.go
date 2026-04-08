package config

import (
	"log/slog"
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
		article = filepath.Join(WorkDir, "article")
		templ   = filepath.Join(WorkDir, "template.html")
		index   = filepath.Join(WorkDir, "index")
	)
	// 数据文件、主日志路径为约定目录，不在配置文件中提供（忽略 toml / 环境变量中的覆盖）
	dbFile := filepath.Join(WorkDir, "data", "mazenjay.db")
	logFile := filepath.Join(WorkDir, "logs", "app.log")

	Cfg.App.Env = Mode
	Cfg.Database.Source = ProcessPath("", dbFile)
	Cfg.Article.OutputDir = ProcessPath(Cfg.Article.OutputDir, article)
	Cfg.Article.Template = ProcessPath(Cfg.Article.Template, templ)
	Cfg.Search.IndexPath = ProcessPath(Cfg.Search.IndexPath, index)
	Cfg.Log.File = ProcessPath("", logFile)

}

var Cfg Config

// Config 整个应用的配置总结构体
type Config struct {
	App      AppConfig     `mapstructure:"app"`
	Log      LogConfig     `mapstructure:"log"`
	Article  ArticleConfig `mapstructure:"article"` // ← 新增：生成的静态内容配置
	Database DbConfig      `mapstructure:"database"`
	Search   SearchConfig  `mapstructure:"search"`

	WorkDir string
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
}

// DbConfig [database] 部分；SQLite 文件路径由程序固定为 WorkDir/data/mazenjay.db，不在此配置
type DbConfig struct {
	Driver   string `mapstructure:"driver"`
	Source   string `mapstructure:"source"` // 由 init 固定，mapstructure 项忽略
	Host     string `mapstructure:"host,omitempty"`
	Port     string `mapstructure:"port,omitempty"`
	User     string `mapstructure:"user,omitempty"`
	Password string `mapstructure:"password,omitempty"`
	DBName   string `mapstructure:"db_name,omitempty"`
}

type SearchConfig struct {
	IndexPath string `mapstructure:"index_path"`
}

func ProcessPath(path string, defaultPath string) string {
	home, _ := os.UserHomeDir()

	if path == "" {
		if strings.HasPrefix(defaultPath, "~") {
			defaultPath = strings.Replace(defaultPath, "~", home, 1)
		}
		dir := filepath.Dir(defaultPath)
		err := os.MkdirAll(dir, os.ModePerm)
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
