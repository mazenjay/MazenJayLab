package config

import (
	"log/slog"
	"mjlab/internal/infrastructure/config/db"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

func read() {
	viper.SetConfigName("config") // 名字叫 config (不需要后缀)
	viper.SetConfigType("toml")   // 类型是 yaml

	configDir := os.Getenv("CONFIG_PATH")
	if configDir == "" {
		// os.Executable() 返回当前运行的二进制文件的绝对路径 (e.g., /app/server)
		ex, err := os.Executable()
		if err != nil {
			slog.Error("无法获取可执行文件路径: ", "err", err)
		}
		// filepath.Dir 获取目录路径 (e.g., /app)
		configDir = filepath.Dir(ex)
	}
	viper.AddConfigPath(configDir)
	viper.AddConfigPath(".")

	viper.SetEnvPrefix("MJLAB")
	viper.AutomaticEnv()
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	if err := viper.ReadInConfig(); err != nil {
		slog.Error("无法读取配置文件: ", "err", err)
	}
}

func GetDatabaseConfig() *db.DatabaseConfig {
	read()

	var config db.DatabaseConfig
	if err := viper.Unmarshal(&config); err != nil {
		slog.Error("无法解析配置文件: ", "err", err)
	}
	return &config
}
