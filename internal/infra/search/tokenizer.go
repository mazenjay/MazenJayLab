package search

import (
	"strings"

	"github.com/blugelabs/bluge/analysis"
	"github.com/blugelabs/bluge/analysis/token"
	"github.com/yanyiwu/gojieba"
)

// NewJiebaAnalyzer 组装出最终供 bluge 使用的分析器
func NewJiebaAnalyzer(x *gojieba.Jieba) *analysis.Analyzer {
	return &analysis.Analyzer{
		Tokenizer: NewJiebaTokenizer(x), // 第一步：Jieba 负责初始切词
		TokenFilters: []analysis.TokenFilter{
			NewStopWordFilter(chineseStopWords), // 第二步：去掉无意义的中文停用词
			token.NewLowerCaseFilter(),          // 第三步：将英文统一转为小写，实现大小写不敏感
		},
	}
}

// JiebaTokenizer 实现 bluge 的 analysis.Tokenizer 接口
type JiebaTokenizer struct {
	x *gojieba.Jieba
}

func NewJiebaTokenizer(x *gojieba.Jieba) *JiebaTokenizer {
	return &JiebaTokenizer{x: x}
}

// Tokenize 是分词的第一步：把长文本切成一个个词元 (Token)
func (t *JiebaTokenizer) Tokenize(input []byte) analysis.TokenStream {
	// 使用 SearchMode (搜索引擎模式)，它会对长词进行二次切分，提高召回率
	words := t.x.Tokenize(string(input), gojieba.SearchMode, true)

	stream := make(analysis.TokenStream, 0, len(words))

	for _, w := range words {
		// 过滤掉纯空格或空白字符
		if strings.TrimSpace(w.Str) == "" {
			continue
		}

		// 构建 bluge 标准的 Token 结构
		stream = append(stream, &analysis.Token{
			Start:        w.Start,
			End:          w.End,
			Term:         []byte(w.Str),
			PositionIncr: 1,
			Type:         analysis.Ideographic, // 标记为表意文字
		})
	}
	return stream
}

// StopWordFilter 实现 bluge 的 analysis.TokenFilter 接口
type StopWordFilter struct {
	stopWords map[string]bool
}

func NewStopWordFilter(stopWords map[string]bool) *StopWordFilter {
	return &StopWordFilter{stopWords: stopWords}
}

// Filter 是分词的第二步：过滤掉停用词 (如 "的", "了", "在")
func (f *StopWordFilter) Filter(input analysis.TokenStream) analysis.TokenStream {
	res := make(analysis.TokenStream, 0, len(input))
	for _, t := range input {
		// 如果不是停用词，才保留
		if !f.stopWords[string(t.Term)] {
			res = append(res, t)
		}
	}
	return res
}

// 停用词表
var chineseStopWords = map[string]bool{
	"的": true, "了": true, "在": true, "是": true, "我": true,
	"有": true, "和": true, "就": true, "不": true, "人": true,
	"都": true, "一": true, "一个": true, "上": true, "也": true,
	"很": true, "到": true, "说": true, "要": true, "去": true,
	"你": true, "会": true, "着": true, "没有": true, "看": true,
	"好": true, "自己": true, "这": true,
}
