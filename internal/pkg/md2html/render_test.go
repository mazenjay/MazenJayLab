package md2html

import (
	"context"
	"os"
	"testing"
)

func TestGenerateHTMLFromFile(t *testing.T) {
	// ===== 1️⃣ 你要改这里 =====
	//mdPath := "/Users/mazhj/Downloads/什么是内网穿透？.md"                                         // 你的 md 文件路径

	mdPath := "/Users/mazhj/Desktop/notes/Go channel设计.md"
	templatePath := "/Users/mazhj/Documents/workspaces/projects/MazenJayLab/template.html" // 根目录 template.html
	outputPath := "output.html"

	// ===== 2️⃣ 读取 Markdown 文件 =====
	content, err := os.ReadFile(mdPath)
	if err != nil {
		t.Fatalf("read md failed: %v", err)
	}

	// ===== 3️⃣ 解析 Markdown =====
	doc, err := ParseMarkdown(nil, content)
	if err != nil {
		t.Fatalf("parse markdown failed: %v", err)
	}

	// ===== 4️⃣ 创建输出文件 =====
	outFile, err := os.Create(outputPath)
	if err != nil {
		t.Fatalf("create output file failed: %v", err)
	}
	defer outFile.Close()

	// ===== 5️⃣ 生成 HTML =====
	err = doc.GenerateStaticHTML(context.Background(), templatePath, outFile)
	if err != nil {
		t.Fatalf("generate html failed: %v", err)
	}

	t.Logf("HTML generated successfully: %s", outputPath)
}
