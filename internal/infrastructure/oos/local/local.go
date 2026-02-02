package local

import (
	"context"
	"io"
)

type LocalStore struct {
	root string
}

func NewLocalStore(root string) *LocalStore {
	return &LocalStore{root: root}
}

func (s *LocalStore) Upload(ctx context.Context, path string, file io.ReadCloser) (string, error) {
	return "", nil
}

func (s *LocalStore) Download(ctx context.Context, path string) (io.ReadCloser, error) {
	return nil, nil
}

func (s *LocalStore) Delete(ctx context.Context, path string) error {
	return nil
}
