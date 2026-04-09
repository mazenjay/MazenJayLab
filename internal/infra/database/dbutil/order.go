package dbutil

import (
	"strings"

	"mjlab/internal/domain"
)

// BuildOrderClause GORM Order 子句，SQLite / PostgreSQL 通用。
func BuildOrderClause(query domain.Query) string {
	allowedSort := map[string]string{
		"id":         "id",
		"created_at": "created_at",
		"sort_order": "sort_order",
	}

	field, ok := allowedSort[strings.ToLower(query.Sort)]
	if !ok {
		field = "id"
	}

	order := "DESC"
	if strings.ToLower(query.SortOrder) == "asc" {
		order = "ASC"
	}

	return field + " " + order
}
