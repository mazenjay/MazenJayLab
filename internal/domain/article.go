package domain

import (
	"context"
	"errors"
	"io"
	"mjlab/internal/pkg/md2html"
	"strings"
	"time"

	"golang.org/x/net/html"
)

type Article struct {
	ID uint `gorm:"primarykey"`

	Title       string
	Slug        string `gorm:uniqueIndex`
	Summary     string
	ViewCount   uint
	IsPublished bool
	Tags        []string `gorm:"column:tags;serializer:json"`
	Markdown    string
	Html        string

	CreatedAt time.Time
	UpdatedAt time.Time
}

func (*Article) TableName() string {
	return "articles"
}

type ArticleRepository interface {
	Get(context.Context, ...uint) ([]*Article, error)
	List(context.Context, Query) ([]*Article, int64, error)
	Save(context.Context, *Article) error
	Update(context.Context, *Article) error
	Delete(context.Context, uint) error
}

func AddArticle(ctx context.Context, article *Article) error {
	return uow.Article().Save(ctx, article)
}

func GetArticle(ctx context.Context, ids ...uint) ([]*Article, error) {
	return uow.Article().Get(ctx, ids...)
}

func GetArticles(ctx context.Context, q Query) ([]*Article, int64, error) {
	return uow.Article().List(ctx, q)
}

func (a *Article) Render(ctx context.Context, fis *OSSFile, output io.Writer, template string) error {
	var (
		doc     *md2html.Document
		err     error
		content []byte
	)

	if err = ctx.Err(); err != nil {
		return err
	}

	if content, err = io.ReadAll(fis); err != nil && !errors.Is(err, io.EOF) {
		return err
	}

	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	doc, err = md2html.ParseMarkdown(nil, content)
	if err != nil {
		return err
	}

	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	if err = doc.GenerateStaticHTML(ctx, template, output); err != nil {
		return err
	}

	a.Title = doc.Title
	a.Summary = doc.Description
	a.Tags = doc.Tags
	a.Slug = doc.Slug

	return nil
}

func (a *Article) ExtractHtmlText(ctx context.Context) (string, error) {

	var (
		file    *OSSFile
		err     error
		content []byte
		doc     *md2html.Document
	)
	if err = ctx.Err(); err != nil {
		return "", err
	}

	if a.Html == "" {
		if file, err = DownloadFile(ctx, a.Markdown); err != nil {
			return "", err
		}

		if content, err = io.ReadAll(file); !errors.Is(err, io.EOF) {
			return "", err
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		doc, err = md2html.ParseMarkdown(nil, content)
		if err != nil {
			return "", err
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		return a.extractHtmlText(doc.HTML)

	} else {
		if file, err = DownloadFile(ctx, a.Html); err != nil {
			return "", err
		}

		if content, err = io.ReadAll(file); err != nil && !errors.Is(err, io.EOF) {
			return "", err
		}

		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		return a.extractHtmlText(string(content))
	}

}

func (*Article) extractHtmlText(htmlStr string) (string, error) {
	document, ex := html.Parse(strings.NewReader(htmlStr))
	if ex != nil {
		return "", ex
	}

	var buf strings.Builder

	var walk func(*html.Node)

	walk = func(n *html.Node) {

		if n.Type == html.ElementNode {
			switch n.Data {
			case "script", "style", "code", "pre", "head", "meta", "link", "noscript", "a":
				return
			}
		}

		if n.Type == html.TextNode {

			text := strings.TrimSpace(n.Data)

			if text != "" {
				buf.WriteString(text)
				buf.WriteString(" ")
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}

	walk(document)
	s := buf.String()
	s = strings.ReplaceAll(s, "\n", " ")
	s = strings.ReplaceAll(s, "\t", " ")

	return strings.Join(strings.Fields(s), " "), nil
}

var _ Searchable = (*Article)(nil)

func (a *Article) GetSearchID() uint        { return a.ID }
func (a *Article) GetSearchType() string    { return "article" }
func (a *Article) GetSearchTitle() string   { return a.Title }
func (a *Article) GetSearchSummary() string { return a.Summary }
func (a *Article) GetSearchContent(ctx context.Context) (string, error) {
	return a.ExtractHtmlText(ctx)
}
func (a *Article) GetSearchTags() []string       { return a.Tags }
func (a *Article) GetSearchCreatedAt() time.Time { return a.CreatedAt }
func (a *Article) GetIcon() string { return "/statics/images/article.png" }
