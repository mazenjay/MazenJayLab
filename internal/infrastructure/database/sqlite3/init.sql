CREATE TABLE articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,

    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    summary VARCHAR(500),
    path VARCHAR(255),
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true
);

-- 索引（GORM 会单独建）
CREATE INDEX idx_articles_deleted_at ON articles(deleted_at);
CREATE INDEX idx_articles_slug ON articles(slug);


CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME,
    updated_at DATETIME,
    deleted_at DATETIME,

    title VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    path VARCHAR(255),
    content TEXT,
    cover_url VARCHAR(255),
    demo_url VARCHAR(255),
    source_url VARCHAR(255),
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT true
);

CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);