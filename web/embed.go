package web

import "embed"

//go:embed statics/* template/*
var Statics embed.FS
