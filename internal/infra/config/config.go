package config

import (
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

func init() {
	viper.SetConfigName("config")
	viper.SetConfigType("toml")

	home, _ := os.UserHomeDir()
	configDir := filepath.Join(home, ".mjlab")
	viper.AddConfigPath(".")
	viper.AddConfigPath(configDir)

	viper.SetEnvPrefix("MJLAB")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := viper.ReadInConfig(); err != nil {
		slog.Warn("未找到配置文件，将全部使用默认值或环境变量", "err", err)
	}
	if err := viper.Unmarshal(&Cfg); err != nil {
		slog.Error("无法读取配置: ", "err", err)
		os.Exit(1)
	}

	if home, err := os.UserHomeDir(); err == nil {
		if err = os.MkdirAll(filepath.Join(home, ".mjlab"), os.ModePerm); err != nil {
			panic(err)
		}

		Cfg.WorkDir = filepath.Join(home, ".mjlab")
		Cfg.Database.Source = ProcessPath(Cfg.Database.Source, "~/.mjlab/data/mazenjay.db")
		Cfg.Article.OutputDir = ProcessPath(Cfg.Article.OutputDir, "~/.mjlab/article")
		Cfg.Article.Template = ProcessPath(Cfg.Article.Template, "~/.mjlab/template.html")
		Cfg.Search.IndexPath = ProcessPath(Cfg.Search.IndexPath, "~/.mjlab/index")
	}

}

var Cfg Config

// Config 整个应用的配置总结构体
type Config struct {
	App      AppConfig     `mapstructure:"app"`
	Article  ArticleConfig `mapstructure:"article"` // ← 新增：生成的静态内容配置
	Database DbConfig      `mapstructure:"database"`
	Search   SearchConfig  `mapstructure:"search"`

	WorkDir string
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

// DbConfig [database] 部分
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

func ProcessPath(path string, defaultPath string) string {
	home, _ := os.UserHomeDir()

	if path == "" {
		if strings.HasPrefix(defaultPath, "~") {
			return strings.Replace(defaultPath, "~", home, 1)
		}

		return defaultPath
	}

	if strings.HasPrefix(path, "~") {
		return strings.Replace(path, "~", home, 1)
	}

	return path

}
