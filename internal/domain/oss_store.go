package domain

import (
	"context"
	"io"
)

type OSSStore interface {
	Upload(context.Context, string, io.ReadCloser) (string, error)
	Download(context.Context, string) (io.ReadCloser, error)
	Delete(context.Context, string) error
}

var ossStore OSSStore

func InitOSSStore(store OSSStore) {
	if ossStore != nil {
		return
	}
	ossStore = store
}

func UploadFile(ctx context.Context, path string, file io.ReadCloser) (string, error) {
	return ossStore.Upload(ctx, path, file)
}

func DownloadFile(ctx context.Context, path string) (io.ReadCloser, error) {
	return ossStore.Download(ctx, path)
}

func DeleteFile(ctx context.Context, path string) error {
	return ossStore.Delete(ctx, path)
}
