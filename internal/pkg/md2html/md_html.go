package md2html

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"github.com/alecthomas/chroma/formatters/html"
	"github.com/yuin/goldmark"
	highlight "github.com/yuin/goldmark-highlighting"
	meta "github.com/yuin/goldmark-meta"
	"github.com/yuin/goldmark/ast"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	gmhtml "github.com/yuin/goldmark/renderer/html"
	"github.com/yuin/goldmark/text"
	"html/template"
	"io"
	"path/filepath"
	"strings"
	"time"
)

type TOCItem struct {
	Level int
	Text  string
	ID    string
}

type Document struct {
	Title       string
	Description string
	Draft       bool
	Tags        []string
	Date        time.Time
	HTML        string
	TOC         string
}

func newMarkdown() goldmark.Markdown {
	return goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			meta.Meta,
			highlight.NewHighlighting(
				highlight.WithStyle("github-dark"),
				highlight.WithFormatOptions(
					html.WithLineNumbers(true),
				),
			),
		),
		goldmark.WithParserOptions(
			parser.WithAutoHeadingID(),
		),
		goldmark.WithRendererOptions(
			gmhtml.WithUnsafe(),
		),
	)
}

func ParseMarkdown(md goldmark.Markdown, source []byte) (*Document, error) {
	if md == nil {
		md = newMarkdown()
	}

	// 1. 创建 Reader
	reader := text.NewReader(source)

	// 2. 解析成 AST (只解析一次)
	context := parser.NewContext()
	doc := md.Parser().Parse(reader, parser.WithContext(context))

	// 3. 提取元数据 (meta)
	metaData := meta.Get(context)
	document := &Document{}
	fillMetadata(document, metaData)

	// 4. 提取 TOC (从已经解析好的 doc 中提取)
	tocItems := extractTOC(doc, source)
	document.TOC = renderTOCHTML(tocItems)

	// 5. 渲染 HTML
	var buf bytes.Buffer
	if err := md.Renderer().Render(&buf, source, doc); err != nil {
		return nil, err
	}
	document.HTML = buf.String()

	return document, nil
}

// 辅助函数：填充元数据
func fillMetadata(a *Document, m map[string]interface{}) {
	if v, ok := m["title"].(string); ok {
		a.Title = v
	}
	if v, ok := m["description"].(string); ok {
		a.Description = v
	}
	if v, ok := m["draft"].(bool); ok {
		a.Draft = v
	}
	if v, ok := m["tags"].([]interface{}); ok {
		for _, t := range v {
			if s, ok := t.(string); ok {
				a.Tags = append(a.Tags, s)
			}
		}
	}
	if v, ok := m["date"].(string); ok {
		// 增加错误处理，或者默认格式转换
		t, err := time.Parse("2006-01-02", v)
		if err == nil {
			a.Date = t
		}
	}
}

// 优化后的 TOC 提取
func extractTOC(doc ast.Node, source []byte) []TOCItem {
	var toc []TOCItem
	_ = ast.Walk(doc, func(n ast.Node, entering bool) (ast.WalkStatus, error) {
		if entering && n.Kind() == ast.KindHeading {
			h := n.(*ast.Heading)

			// 提取纯文本
			var textBuf bytes.Buffer
			textBuf.Write(h.Text(source))

			// 获取 ID
			id := ""
			if attr, ok := h.AttributeString("id"); ok {
				if b, ok := attr.([]byte); ok {
					id = string(b)
				} else if s, ok := attr.(string); ok {
					id = s
				}
			}

			toc = append(toc, TOCItem{
				Level: h.Level,
				Text:  textBuf.String(),
				ID:    id,
			})
		}
		return ast.WalkContinue, nil
	})
	return toc
}

func renderTOCHTML(toc []TOCItem) string {
	if len(toc) == 0 {
		return ""
	}
	var b strings.Builder
	b.WriteString("<ul class=\"toc\">")
	for _, item := range toc {
		padding := (item.Level - 1) * 20
		b.WriteString(fmt.Sprintf(
			"<li class=\"toc-level-%d\" style=\"margin-left:%dpx\"><a href=\"#%s\">%s</a></li>",
			item.Level, padding, item.ID, item.Text,
		))
	}
	b.WriteString("</ul>")
	return b.String()
}

var NoOutPutErr = errors.New("no output")

func (doc *Document) GenerateStaticHTML(ctx context.Context, templatePath string, output io.Writer) error {

	if output == nil {
		return NoOutPutErr
	}

	if ctx == nil {
		ctx = context.Background()
	}
	funcMap := template.FuncMap{
		"safe": func(s string) template.HTML { return template.HTML(s) },
	}
	tName := filepath.Base(templatePath)
	tmpl, err := template.New(tName).Funcs(funcMap).ParseFiles(templatePath)
	if err != nil {
		return err
	}

	if err = tmpl.Execute(output, doc); err != nil {
		return err
	}

	return nil

}
