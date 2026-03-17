package model

type SearchParam struct {
	Command  string `json:"command" form:"command"`
	Keywords string `json:"keywords" form:"keywords"`
	Page     int    `json:"page" form:"page"`
	PerPage  int    `json:"per_page" form:"per_page"`
}
