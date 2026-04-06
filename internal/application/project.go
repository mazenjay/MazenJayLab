package application

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"mjlab/api/model"
	"mjlab/internal/domain"
	"path/filepath"
)

type ProjectService struct{}

// ProjectFromCreateParam 将管理端参数转为领域模型；theme_color、status 为空时使用与 GORM 一致的默认值。
func ProjectFromCreateParam(p model.ProjectCreateParam) (*domain.Project, error) {
	if p.Title == "" || p.Slug == "" {
		return nil, errors.New("title and slug are required")
	}
	proj := &domain.Project{
		Title:      p.Title,
		Slug:       p.Slug,
		Subtitle:   p.Subtitle,
		Summary:    p.Summary,
		Icon:       p.Icon,
		ThemeColor: p.ThemeColor,
		Status:     p.Status,
		RepoURL:    p.RepoURL,
		LaunchURL:  p.LaunchURL,
		SortOrder:  p.SortOrder,
	}
	if proj.ThemeColor == "" {
		proj.ThemeColor = "blue"
	}
	if proj.Status == "" {
		proj.Status = "Live"
	}
	if len(p.Techs) > 0 {
		b, err := json.Marshal(p.Techs)
		if err != nil {
			return nil, err
		}
		proj.TechsJSON = string(b)
	}
	return proj, nil
}

func (*ProjectService) GetAppIcon(ctx context.Context, icon string) ([]byte, error) {
	file, err := domain.DownloadFile(ctx, icon)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (*ProjectService) GetProjects(ctx context.Context) ([]model.ProjectOverview, error) {
	query := domain.Query{
		Sort:      "sort_order",
		SortOrder: "desc",
	}

	repo := domain.ProjectRepo()
	projects, _, err := repo.List(ctx, query)
	if err != nil {
		return nil, err
	}

	results := make([]model.ProjectOverview, 0, len(projects))
	for _, p := range projects {
		view := model.ProjectOverview{
			Title:      p.Title,
			Subtitle:   p.Subtitle,
			Summary:    p.Summary,
			Slug:       p.Slug,
			Icon:       p.Icon,
			ThemeColor: p.ThemeColor,
			Status:     p.Status,
			RepoURL:    p.RepoURL,
			LaunchURL:  p.LaunchURL,
		}
		if p.TechsJSON != "" {
			var techs []model.ProjectTech
			if uerr := json.Unmarshal([]byte(p.TechsJSON), &techs); uerr != nil {
				slog.Warn("project techs json invalid", "slug", p.Slug, "err", uerr)
			} else {
				view.Techs = techs
			}
		}
		results = append(results, view)
	}

	return results, nil
}

// Add 持久化作品；若 icon 非空则上传为 upload/{slug}.jpeg，并把 Icon 设为对外访问路径。
func (*ProjectService) Add(ctx context.Context, project *domain.Project, icon []byte) error {
	repo := domain.ProjectRepo()
	if len(icon) > 0 {
		path := filepath.Join("upload", project.Slug+".jpeg")
		if _, err := domain.UploadFile(ctx, path, bytes.NewReader(icon)); err != nil {
			return err
		}
		project.Icon = "/api/icon/" + project.Slug
	}
	return repo.Save(ctx, project)
}
