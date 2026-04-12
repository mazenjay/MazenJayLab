package md2html

import (
	"net/url"
	"path"
	"strings"

	"golang.org/x/net/html"
)

// RewriteArticleMediaURLs 将正文 HTML 中相对路径的 img[src] 改写为可经 publicURLPrefix 访问的绝对路径。
// markdownPathFromWorkDir 为相对工作目录的路径，须位于 contentRootRelativePath 之下（如 article_md/foo.md）。
// publicURLPrefix 为对外 URL 前缀（如 /article_md），contentRootRelativePath 为与工作目录一致的根路径段（如 article_md）。
func RewriteArticleMediaURLs(htmlFragment string, markdownPathFromWorkDir string, publicURLPrefix string, contentRootRelativePath string) string {
	if htmlFragment == "" || strings.TrimSpace(markdownPathFromWorkDir) == "" {
		return htmlFragment
	}
	webPrefix := normalizePublicURLPrefix(publicURLPrefix)
	root := strings.TrimSpace(contentRootRelativePath)
	root = path.Clean(root)
	if webPrefix == "" || root == "" || root == "." {
		return htmlFragment
	}

	mdPath := strings.TrimSpace(markdownPathFromWorkDir)
	mdPath = path.Clean(mdPath)
	if mdPath != root && !strings.HasPrefix(mdPath, root+"/") {
		return htmlFragment
	}

	doc, err := html.Parse(strings.NewReader(
		"<!doctype html><html><head></head><body>" + htmlFragment + "</body></html>",
	))
	if err != nil {
		return htmlFragment
	}
	body := findFirstElement(doc, "body")
	if body == nil {
		return htmlFragment
	}
	for c := body.FirstChild; c != nil; c = c.NextSibling {
		rewriteMediaInNode(c, mdPath, root, webPrefix)
	}
	var b strings.Builder
	for c := body.FirstChild; c != nil; c = c.NextSibling {
		if err := html.Render(&b, c); err != nil {
			return htmlFragment
		}
	}
	return b.String()
}

func normalizePublicURLPrefix(p string) string {
	p = strings.TrimSpace(p)
	if p == "" {
		return ""
	}
	if !strings.HasPrefix(p, "/") {
		p = "/" + p
	}
	return strings.TrimSuffix(p, "/")
}

func findFirstElement(n *html.Node, tag string) *html.Node {
	if n.Type == html.ElementNode && n.Data == tag {
		return n
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if found := findFirstElement(c, tag); found != nil {
			return found
		}
	}
	return nil
}

func rewriteMediaInNode(n *html.Node, mdPath, contentRoot, webPrefix string) {
	if n.Type == html.ElementNode && n.Data == "img" {
		rewriteImgSrcAttr(n, mdPath, contentRoot, webPrefix)
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		rewriteMediaInNode(c, mdPath, contentRoot, webPrefix)
	}
}

func rewriteImgSrcAttr(n *html.Node, mdPath, contentRoot, webPrefix string) {
	for i := range n.Attr {
		if n.Attr[i].Key != "src" {
			continue
		}
		if v := resolveArticleAssetURL(n.Attr[i].Val, mdPath, contentRoot, webPrefix); v != "" {
			n.Attr[i].Val = v
		}
		break
	}
}

func resolveArticleAssetURL(src string, mdPath, contentRoot, webPrefix string) string {
	src = strings.TrimSpace(src)
	if src == "" {
		return ""
	}
	lower := strings.ToLower(src)
	if strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://") ||
		strings.HasPrefix(lower, "data:") || strings.HasPrefix(src, "//") {
		return ""
	}

	frag := ""
	if i := strings.IndexByte(src, '#'); i >= 0 {
		frag = src[i:]
		src = src[:i]
	}
	query := ""
	if i := strings.IndexByte(src, '?'); i >= 0 {
		query = src[i:]
		src = src[:i]
	}

	if strings.HasPrefix(src, "/") {
		if strings.HasPrefix(src, webPrefix+"/") || src == webPrefix {
			return ""
		}
		return ""
	}

	mdDir := path.Dir(mdPath)
	joined := path.Join(mdDir, strings.TrimSpace(src))
	joined = path.Clean(joined)
	rel, ok := relPathUnderContentRoot(joined, contentRoot)
	if !ok {
		return ""
	}
	web := path.Join(webPrefix, escapeURLPathSegments(rel))
	return web + query + frag
}

func relPathUnderContentRoot(joined, contentRoot string) (string, bool) {
	if joined == contentRoot {
		return "", true
	}
	prefix := contentRoot + "/"
	if !strings.HasPrefix(joined, prefix) {
		return "", false
	}
	rel := joined[len(prefix):]
	if rel == "" || strings.Contains(rel, "..") {
		return "", false
	}
	return rel, true
}

func escapeURLPathSegments(rel string) string {
	rel = strings.Trim(rel, "/")
	if rel == "" {
		return ""
	}
	parts := strings.Split(rel, "/")
	for i, p := range parts {
		parts[i] = url.PathEscape(p)
	}
	return strings.Join(parts, "/")
}
