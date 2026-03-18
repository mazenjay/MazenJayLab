package domain

import (
	"context"
	"errors"
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
	if ossStore == nil {
		return "", errors.New("ossStore is nil")
	}
	return ossStore.Upload(ctx, path, file)
}

func DownloadFile(ctx context.Context, path string) (*OSSFile, error) {
	if ossStore == nil {
		return nil, errors.New("ossStore is nil")
	}
	return ossStore.Download(ctx, path)
}

func DeleteFile(ctx context.Context, path string) error {
	return ossStore.Delete(ctx, path)
}

func UploadWithTempFile(ctx context.Context,  writeFn func(writer io.Writer) (string,error)) (string, error) {
	tmpFile, err := os.CreateTemp("", "upload-*.tmp")
	if err != nil {
		return "", err
	}

	tmpPath := tmpFile.Name()

	defer func() {
		_ = tmpFile.Close()
		_ = os.Remove(tmpPath)
	}()

	var filename string
	if filename, err = writeFn(tmpFile); err != nil {
		return "", err
	}

	if _, err = tmpFile.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	return UploadFile(ctx, filename, tmpFile)
}
