package application

import (
	"context"
	"errors"
	"io"
	"mjlab/internal/domain"
)

func WriteArticleToStream(id uint, writer io.Writer) error {
	if id <= 0 {
		return errors.New("illegal data")
	}
	ctx := context.TODO()
	article, err := domain.GetArticle(ctx, id)
	if err != nil {
		return err
	}

	file, err := domain.DownloadFile(ctx, article.Path)
	if err != nil {
		return err
	}
	defer file.Close()

	if _, err = io.Copy(writer, file); err != nil {
		return err
	}
	return nil
}
