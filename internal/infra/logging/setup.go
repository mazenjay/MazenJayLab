package logging

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"time"

	"mjlab/internal/infra/config"

	lumberjack "gopkg.in/natefinch/lumberjack.v2"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// Setup 将 slog 默认 logger 指向滚动日志文件，并返回与 slog 相同的 Writer 供 Gin 等使用。
func Setup(cfg config.LogConfig) (writer io.Writer, cleanup func(), err error) {
	if cfg.File == "" {
		return nil, nil, fmt.Errorf("log file path is empty")
	}
	dir := filepath.Dir(cfg.File)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, nil, err
	}

	maxSize := cfg.MaxSizeMB
	if maxSize <= 0 {
		maxSize = 100
	}
	maxBackups := cfg.MaxBackups
	if maxBackups <= 0 {
		maxBackups = 10
	}

	lj := &lumberjack.Logger{
		Filename:   cfg.File,
		MaxSize:    maxSize,
		MaxBackups: maxBackups,
		MaxAge:     cfg.MaxAgeDays,
		Compress:   cfg.Compress,
	}

	var w io.Writer = lj
	if cfg.Console {
		w = io.MultiWriter(os.Stdout, lj)
	}

	level := parseLevel(cfg.Level)
	opts := &slog.HandlerOptions{Level: level}
	if strings.EqualFold(strings.TrimSpace(cfg.Level), "debug") {
		opts.AddSource = true
	}
	h := slog.NewTextHandler(w, opts)
	slog.SetDefault(slog.New(h))

	cleanup = func() { _ = lj.Close() }
	return w, cleanup, nil
}

// GormConfig 与 Setup 返回的 writer 共用同一目标（文件 ± stderr），实现 slog / Gin / GORM 日志同一路由。
// [log].level=debug 时打印每条 SQL；生产建议 info/warn。不写彩色转义，避免污染滚动文件。
func GormConfig(w io.Writer, cfg config.LogConfig) *gorm.Config {
	lvl := gormlogger.Warn
	switch strings.ToLower(strings.TrimSpace(cfg.Level)) {
	case "debug":
		lvl = gormlogger.Info
	case "info":
		lvl = gormlogger.Warn
	case "warn", "warning":
		lvl = gormlogger.Warn
	case "error":
		lvl = gormlogger.Error
	default:
		lvl = gormlogger.Warn
	}

	gcfg := gormlogger.Config{
		SlowThreshold:             200 * time.Millisecond,
		LogLevel:                  lvl,
		IgnoreRecordNotFoundError: true,
		Colorful:                  false,
	}
	return &gorm.Config{
		// 首帧跳过 repo/domain，SQL 前缀行指向 application/api 等调用方
		Logger: newAppFrameGormLogger(w, gcfg),
	}
}

func parseLevel(s string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
