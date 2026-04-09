package logging

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// callerFileLineBeyondRepo 跳过 GORM、infra/database、domain 薄层，使 SQL 日志指向业务调用方（如 application / api）。
func callerFileLineBeyondRepo() string {
	pcs := make([]uintptr, 64)
	// 跳过 Callers、本函数、Trace；其后多为 GORM 回调链，再由 skip() 过滤
	n := runtime.Callers(4, pcs)
	frames := runtime.CallersFrames(pcs[:n])
	// 与 go.mod module 名无关：本机目录常为 .../MazenJayLab/internal/... 而非 mjlab/internal/...
	skip := func(normPath, fn string) bool {
		if strings.Contains(normPath, "gorm.io/gorm") {
			return true
		}
		if strings.Contains(normPath, "internal/infra/database/") {
			return true
		}
		if strings.Contains(normPath, "internal/infra/logging/") {
			return true
		}
		if strings.Contains(normPath, "internal/domain/") {
			return true
		}
		if strings.HasPrefix(fn, "runtime.") {
			return true
		}
		return false
	}
	for {
		fr, more := frames.Next()
		if !more {
			return ""
		}
		if fr.File == "" {
			continue
		}
		norm := filepath.ToSlash(fr.File)
		if skip(norm, fr.Function) {
			continue
		}
		return fmt.Sprintf("%s:%d", fr.File, fr.Line)
	}
}

type appFrameGormLogger struct {
	base gormlogger.Interface
	log  *log.Logger
	cfg  gormlogger.Config
	out  io.Writer
}

func newAppFrameGormLogger(w io.Writer, cfg gormlogger.Config) gormlogger.Interface {
	std := log.New(w, "", log.LstdFlags|log.Lmicroseconds)
	base := gormlogger.New(std, cfg)
	return &appFrameGormLogger{
		base: base,
		log:  std,
		cfg:  cfg,
		out:  w,
	}
}

func (a *appFrameGormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	cfg := a.cfg
	cfg.LogLevel = level
	return newAppFrameGormLogger(a.out, cfg)
}

func (a *appFrameGormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	a.base.Info(ctx, msg, data...)
}

func (a *appFrameGormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	a.base.Warn(ctx, msg, data...)
}

func (a *appFrameGormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	a.base.Error(ctx, msg, data...)
}

// Trace 与 gorm.io/gorm/logger 行为对齐，仅将文件:行换为「跳过 repo/domain 后」的调用帧。
func (a *appFrameGormLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	if a.cfg.LogLevel <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)
	switch {
	case err != nil && a.cfg.LogLevel >= gormlogger.Error && (!errors.Is(err, gorm.ErrRecordNotFound) || !a.cfg.IgnoreRecordNotFoundError):
		sql, rows := fc()
		if errors.Is(err, gorm.ErrRecordNotFound) && a.cfg.IgnoreRecordNotFoundError {
			return
		}
		ms := float64(elapsed.Nanoseconds()) / 1e6
		line := callerFileLineBeyondRepo()
		if line == "" {
			line = "(caller unknown)"
		}
		if rows >= 0 {
			a.log.Printf("%s\n[%.3fms] [rows:%v] %s | ERROR: %v\n", line, ms, rows, sql, err)
		} else {
			a.log.Printf("%s\n[%.3fms] ERROR: %v\n%s\n", line, ms, err, sql)
		}

	case elapsed > a.cfg.SlowThreshold && a.cfg.SlowThreshold != 0 && a.cfg.LogLevel >= gormlogger.Warn:
		sql, rows := fc()
		ms := float64(elapsed.Nanoseconds()) / 1e6
		line := callerFileLineBeyondRepo()
		if line == "" {
			line = "(caller unknown)"
		}
		a.log.Printf("%s\n[%.3fms] [rows:%v] [SLOW] %s\n", line, ms, rows, sql)

	case a.cfg.LogLevel >= gormlogger.Info:
		sql, rows := fc()
		ms := float64(elapsed.Nanoseconds()) / 1e6
		line := callerFileLineBeyondRepo()
		if line == "" {
			line = "(caller unknown)"
		}
		a.log.Printf("%s\n[%.3fms] [rows:%v] %s\n", line, ms, rows, sql)
	}
}
