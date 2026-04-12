package domain

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// SearchDateFilter 对应 date: 后 gt:/gte:/lt:/lte:/eq: 子句，用于 Bluge published_at 范围查询。
type SearchDateFilter struct {
	Has            bool
	Start          time.Time
	End            time.Time
	StartInclusive bool
	EndInclusive   bool
}

var dateKeywordRe = regexp.MustCompile(`^(?i)(gt|gte|lt|lte|eq):(\d{4}-\d{2}-\d{2})$`)

// ParseDateKeyword 解析如 "gt:2002-02-01"（UTC 日界）。
func ParseDateKeyword(s string) (SearchDateFilter, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return SearchDateFilter{}, fmt.Errorf("empty date clause")
	}
	m := dateKeywordRe.FindStringSubmatch(s)
	if m == nil {
		return SearchDateFilter{}, fmt.Errorf(
			"invalid date format: use gt:2002-02-01, gte:..., lt:..., lte:..., eq:...",
		)
	}
	op := strings.ToLower(m[1])
	d, err := time.ParseInLocation("2006-01-02", m[2], time.UTC)
	if err != nil {
		return SearchDateFilter{}, err
	}
	nextDay := d.AddDate(0, 0, 1)
	f := SearchDateFilter{Has: true}
	switch op {
	case "eq":
		f.Start = d
		f.End = nextDay
		f.StartInclusive = true
		f.EndInclusive = false
	case "gt":
		f.Start = nextDay
		f.End = time.Time{}
		f.StartInclusive = true
		f.EndInclusive = false
	case "gte":
		f.Start = d
		f.End = time.Time{}
		f.StartInclusive = true
		f.EndInclusive = false
	case "lt":
		f.Start = time.Time{}
		f.End = d
		f.StartInclusive = true
		f.EndInclusive = false
	case "lte":
		f.Start = time.Time{}
		f.End = nextDay
		f.StartInclusive = true
		f.EndInclusive = false
	default:
		return SearchDateFilter{}, fmt.Errorf("unknown date op: %s", op)
	}
	return f, nil
}
