package md2html

import (
	"strings"
	"testing"
)

func TestRewriteArticleMediaURLs(t *testing.T) {
	mdPath := "article_md/posts/hello.md"
	htmlIn := `<p><img src="./pics/a.png" alt="a"></p>`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if !strings.Contains(out, `src="/article_md/posts/pics/a.png"`) {
		t.Fatalf("got %q", out)
	}
}

func TestRewriteArticleMediaURLs_SiblingMd(t *testing.T) {
	mdPath := "article_md/hello.md"
	htmlIn := `<img src="img/x.png">`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if !strings.Contains(out, `src="/article_md/img/x.png"`) {
		t.Fatalf("got %q", out)
	}
}

func TestRewriteArticleMediaURLs_PreservesHTTP(t *testing.T) {
	mdPath := "article_md/a.md"
	htmlIn := `<img src="https://ex.com/z.png">`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if out != htmlIn && !strings.Contains(out, "https://ex.com/z.png") {
		t.Fatalf("got %q", out)
	}
}

func TestRewriteArticleMediaURLs_AlreadyPrefixed(t *testing.T) {
	mdPath := "article_md/a.md"
	htmlIn := `<img src="/article_md/foo.png">`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if !strings.Contains(out, `src="/article_md/foo.png"`) {
		t.Fatalf("got %q", out)
	}
}

func TestRewriteArticleMediaURLs_QueryFragment(t *testing.T) {
	mdPath := "article_md/x.md"
	htmlIn := `<img src="a.png?v=1#x">`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if !strings.Contains(out, `src="/article_md/a.png?v=1#x"`) {
		t.Fatalf("got %q", out)
	}
}

func TestRewriteArticleMediaURLs_Escape(t *testing.T) {
	mdPath := "article_md/x.md"
	htmlIn := `<img src="a b.png">`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if !strings.Contains(out, "a%20b.png") {
		t.Fatalf("expected escaped segment, got %q", out)
	}
}

func TestRewriteArticleMediaURLs_TraversalRejected(t *testing.T) {
	mdPath := "article_md/sub/post.md"
	htmlIn := `<img src="../../../etc/passwd">`
	out := RewriteArticleMediaURLs(htmlIn, mdPath, "/article_md", "article_md")
	if strings.Contains(out, "/article_md/") && strings.Contains(out, "etc") {
		t.Fatalf("should not expose path outside article_md: %q", out)
	}
}
