package md2html

import (
	"bytes"
	"context"
	"os"
	"strings"
	"testing"
)

func TestParseMarkdown(t *testing.T) {
	mdContent := `---
title: 测试文章
date: 2023-10-27
---
# Header1
内容1
## Header2
内容2
`
	md := newMarkdown()
	doc, err := ParseMarkdown(md, []byte(mdContent))
	if err != nil {
		t.Fatalf("解析失败: %v", err)
	}

	// 1. 验证元数据
	if doc.Title != "测试文章" {
		t.Errorf("期望标题 '测试文章'，得到 '%s'", doc.Title)
	}

	// 2. 验证 TOC
	// Goldmark 默认会将 "Header1" 转为 id="header1"
	if !strings.Contains(doc.TOC, "href=\"#header1\"") {
		t.Errorf("TOC 缺少锚点。当前 TOC: %s", doc.TOC)
	}

	// 3. 验证正文 HTML 是否包含生成的 ID
	if !strings.Contains(doc.HTML, "id=\"header1\"") {
		t.Errorf("正文 HTML 缺少 ID。当前 HTML: %s", doc.HTML)
	}
}

func TestUnsafeHTML(t *testing.T) {
	// 测试 WithUnsafe 是否生效
	mdContent := `这里有一个视频：<iframe src="test"></iframe>`
	md := newMarkdown()
	doc, err := ParseMarkdown(md, []byte(mdContent))
	if err != nil {
		t.Fatal(err)
	}

	if !strings.Contains(doc.HTML, "<iframe") {
		t.Error("WithUnsafe 未生效，iframe 被过滤了")
	}
}

func TestGenerateStaticHTML(t *testing.T) {
	// 准备临时模板文件
	tmplContent := `<html><head><title>{{.Title}}</title></head><body>{{.TOC | safe}}{{.HTML | safe}}</body></html>`
	tmplFile := "test_layout.html"
	err := os.WriteFile(tmplFile, []byte(tmplContent), 0644)
	if err != nil {
		t.Fatal(err)
	}
	defer os.Remove(tmplFile) // 测试完删除

	doc := &Document{
		Title: "测试静态生成",
		HTML:  "<p>Hello World</p>",
		TOC:   "<ul><li>TOC</li></ul>",
	}

	var buf bytes.Buffer
	err = doc.GenerateStaticHTML(context.Background(), tmplFile, &buf)
	if err != nil {
		t.Fatalf("生成静态文件失败: %v", err)
	}

	result := buf.String()
	if !strings.Contains(result, "<title>测试静态生成</title>") {
		t.Error("最终 HTML 缺少标题")
	}
	if !strings.Contains(result, "Hello World") {
		t.Error("最终 HTML 缺少正文内容")
	}
}

func TestCodeHighlighting(t *testing.T) {
	codeMD := "```go\npackage main\n```"
	md := newMarkdown()
	doc, err := ParseMarkdown(md, []byte(codeMD))
	if err != nil {
		t.Fatal(err)
	}

	// 检查是否包含 Chroma 生成的高亮 class (通常是 chroma 或相关 span)
	if !strings.Contains(doc.HTML, "class=\"chroma\"") && !strings.Contains(doc.HTML, "style") {
		t.Error("代码高亮似乎未生效")
	}
}
