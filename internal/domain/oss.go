package domain

import (
	"context"
	"io"
	"os"
)

type OSSFile struct {
	io.ReadCloser
	OriginalName string
	Path         string
}

type OSS interface {
	Upload(context.Context, string, io.Reader) (string, error)
	Download(context.Context, string) (*OSSFile, error)
	Delete(context.Context, string) error
}

var ossStore OSS

func InitOSS(store OSS) {
	if ossStore != nil {
		return
	}
	ossStore = store
}

func UploadFile(ctx context.Context, path string, file io.Reader) (string, error) {
	return ossStore.Upload(ctx, path, file)
}

func DownloadFile(ctx context.Context, path string) (*OSSFile, error) {
	return ossStore.Download(ctx, path)
}

func DeleteFile(ctx context.Context, path string) error {
	return ossStore.Delete(ctx, path)
}

func UploadWithTempFile(ctx context.Context, path string, writeFn func(writer io.Writer) error) (string, error) {
	tmpFile, err := os.CreateTemp("", "upload-*.tmp")
	if err != nil {
		return "", err
	}

	tmpPath := tmpFile.Name()

	defer func() {
		_ = tmpFile.Close()
		_ = os.Remove(tmpPath)
	}()

	if err = writeFn(tmpFile); err != nil {
		return "", err
	}

	if _, err = tmpFile.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	return UploadFile(ctx, path, tmpFile)
}
