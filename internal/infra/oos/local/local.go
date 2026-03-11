package local

import (
	"context"
	"errors"
	"io"
	"mjlab/internal/domain"
	"os"
	"path/filepath"
)

func New(root string) *Local {
	return &Local{root: root}
}

type Local struct {
	root string
}

func (s *Local) Upload(ctx context.Context, filename string, file io.Reader) (string, error) {
	if filename == "" {
		return "", errors.New("filename is empty")
	}

	select {
	case <-ctx.Done():
		return "", ctx.Err()
	default:
	}

	fullPath := filepath.Join(s.root, filename)

	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	f, err := os.Create(fullPath)
	if err != nil {
		return "", err
	}
	defer func() {
		if ctx.Err() != nil {
			_ = os.Remove(fullPath)
		}
	}()
	defer func(f *os.File) {
		_ = f.Close()
	}(f)

	buf := make([]byte, 32*1024)

	for {
		select {
		case <-ctx.Done():
			return "", ctx.Err()
		default:
		}

		n, err := file.Read(buf)
		if n > 0 {
			if _, werr := f.Write(buf[:n]); werr != nil {
				return "", werr
			}
		}

		if err != nil {
			if err == io.EOF {
				break
			}
			return "", err
		}
	}

	return filename, nil
}

func (s *Local) Download(ctx context.Context, filename string) (*domain.OSSFile, error) {
	if filename == "" {
		return nil, errors.New("filename is empty")
	}

	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}

	fullPath := filepath.Join(s.root, filename)

	f, err := os.Open(fullPath)
	if err != nil {
		return nil, err
	}

	return &domain.OSSFile{
		ReadCloser: &ctxReadCloser{
			ctx: ctx,
			rc:  f,
		},
		OriginalName: filepath.Base(filename),
		Path:         fullPath,
	}, nil
}

func (s *Local) Delete(ctx context.Context, filename string) error {
	if filename == "" {
		return errors.New("filename is empty")
	}

	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}

	fullPath := filepath.Join(s.root, filename)

	return os.Remove(fullPath)
}

type ctxReadCloser struct {
	ctx context.Context
	rc  io.ReadCloser
}

func (c *ctxReadCloser) Read(p []byte) (int, error) {
	select {
	case <-c.ctx.Done():
		return 0, c.ctx.Err()
	default:
		return c.rc.Read(p)
	}
}

func (c *ctxReadCloser) Close() error {
	return c.rc.Close()
}
