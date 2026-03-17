drop table if exists articles;

create table articles
(
    id           INTEGER
        primary key autoincrement,
    title        TEXT                               not null,
    slug         TEXT                               not null
        unique,
    summary      TEXT,
    view_count   INTEGER  default 0                 not null,
    is_published INTEGER  default 0                 not null,
    tags          TEXT,
    markdown     TEXT                               not null,
    html         TEXT                               not null,
    created_at   DATETIME default CURRENT_TIMESTAMP not null,
    updated_at   DATETIME default CURRENT_TIMESTAMP not null
);

create index idx_articles_is_published
    on articles (is_published);

create index idx_articles_slug
    on articles (slug);


INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (1, '深入理解 Go 的 Netpoll 模型', 'deep-dive-go-netpoll', '本文从 epoll/kqueue 原理出发，深入解析 Go runtime 的网络调度机制。', 1287, 1, '["Go","Runtime","Network"]', '/content/markdown/deep-dive-go-netpoll.md', '/content/html/deep-dive-go-netpoll.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');
INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (2, '从零实现一个简易容器运行时', 'build-a-mini-container-runtime', '梳理 namespace 与 cgroup 的核心机制，并用 Go 实现最小容器。', 932, 1, '["Linux","Container","Go"]', '/content/markdown/build-a-mini-container-runtime.md', '/content/html/build-a-mini-container-runtime.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');
INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (3, 'SQLite B+ 树索引原理详解', 'sqlite-bplus-tree', '结合页结构与 buffer pool，深入讲解 SQLite 的 B+ 树实现。', 756, 1, '["Database","SQLite","Index"]', '/content/markdown/sqlite-bplus-tree.md', '/content/html/sqlite-bplus-tree.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');
INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (4, 'Golang context 取消机制源码分析', 'golang-context-cancel-source', '分析 context.WithCancel 的内部实现与取消传播机制。', 1103, 1, '["Go","Concurrency"]', '/content/markdown/golang-context-cancel-source.md', '/content/html/golang-context-cancel-source.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');
INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (5, '如何实现一个高性能 TUN 代理', 'implement-tun-proxy', '从 TUN 原理到 TCP 转发，实现完整流量代理。', 489, 1, '["Network","Proxy","TUN"]', '/content/markdown/implement-tun-proxy.md', '/content/html/implement-tun-proxy.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');
INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (6, '使用 Goldmark 构建博客 Markdown 引擎', 'build-blog-with-goldmark', '介绍如何用 goldmark 解析 Markdown 并生成目录。', 642, 1, '["Go","Blog","Markdown"]', '/content/markdown/build-blog-with-goldmark.md', '/content/html/build-blog-with-goldmark.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');
INSERT INTO articles (id, title, slug, summary, view_count, is_published, tags, markdown, html, created_at, updated_at) VALUES (7, '深入理解 epoll 与 kqueue 的差异', 'epoll-vs-kqueue', '对比 Linux 与 macOS 的 IO 多路复用机制。', 1501, 1, '["Linux","macOS","Network"]', '/content/markdown/epoll-vs-kqueue.md', '/content/html/epoll-vs-kqueue.html', '2026-03-04 10:48:35', '2026-03-04 10:48:35');


