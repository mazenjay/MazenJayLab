# MazenJayLab — 本地构建（Go + Tailwind + Next）
#
# 产物目录结构:
#   ~/.mjlab/bin/mjlab     — Go 二进制可执行程序
#   ~/.mjlab/config.toml   — 后端配置
#   ~/.mjlab/template.html — MD 转 HTML 模板
#   ~/.mjlab/app.css       — Tailwind 编译产物
#   ~/.mjlab/dict/         — 结巴分词依赖字典
#   ~/.mjlab/scripts/      — 无 RSA 的管理脚本（交互式，首次会问管理端地址）
#   web/lab-next/.next/    — Next 默认构建目录
#
# 用法:
#   make                  # 等价于 make deploy
#   make deploy           # 全量构建 (后端+CSS+前端)
#   make lab-go           # 仅构建后端 (会自动先编译 Tailwind CSS 并拷贝相关文件)
#   make lab-next         # 仅构建 Next.js 前端
#   make tailwind         # 仅单独构建 Tailwind CSS
#
# Next 构建时带上 BACKEND_URL:
#   make deploy NEXT_BACKEND_URL=https://mazenjay.com
#
# 跳过部分（变量非空即跳过）:
#   make deploy SKIP_FRONTEND=1
#
# 启动（需先构建完毕）:
#   终端1 — 后端 API: ~/.mjlab/bin/mjlab
#   终端2 — 前端:     cd web/lab-next && npm start

SHELL := /bin/bash

GO          ?= go
NPM         ?= npm
PREFIX      ?= /usr/local
APP_HOME    := $(HOME)/.mjlab
APP_BIN     := $(APP_HOME)/bin

.PHONY: all deploy lab-go lab-next tailwind tailwind-css css clean clean-all install help

all: deploy

# 部署目标
deploy: lab-go
ifneq ($(SKIP_FRONTEND),1)
deploy: lab-next
endif

# ==========================================
# 1. 后端构建 (自动依赖 Tailwind)
# ==========================================
lab-go: tailwind
	@echo "=== 开始构建后端 lab-go ==="
	@mkdir -p "$(APP_BIN)"

	$(GO) mod download
	# 1.1 编译可执行程序到 ~/.mjlab/bin/mjlab
	$(GO) build -trimpath -ldflags "-s -w" -tags "release" -o "$(APP_BIN)/mjlab" ./cmd/main.go

	# 1.2 拷贝配置、模板与 CSS 到 ~/.mjlab/（config.toml 已存在则保留，不覆盖）
	@echo "正在拷贝配置文件、模板与 CSS..."
	@if [ -f "$(APP_HOME)/config.toml" ]; then \
		echo "已存在 $(APP_HOME)/config.toml，跳过覆盖（删除该文件后再 make 可恢复仓库默认配置）"; \
	else \
		cp cmd/config.toml "$(APP_HOME)/config.toml"; \
	fi
	@cp template.html "$(APP_HOME)/template.html"

	# 注：假设你的 Tailwind 构建产物是 static/css/app.css，将其拷入 .mjlab 根目录
	# 如果你的 css 输出路径不同，请修改这行代码的源路径
	@cp build/app.css "$(APP_HOME)/app.css"

	# 1.3 提取 gojieba 字典到 ~/.mjlab/dict
	@echo "正在自动提取 gojieba 字典到 $(APP_HOME)/dict ..."
	@rm -rf "$(APP_HOME)/dict"
	@GOJIEBA_DIR=$$($(GO) list -m -f '{{.Dir}}' github.com/yanyiwu/gojieba) && \
	cp -r "$$GOJIEBA_DIR/deps/cppjieba/dict" "$(APP_HOME)/dict"

	# 1.4 无 RSA 管理脚本 → ~/.mjlab/scripts/
	@echo "正在安装管理脚本到 $(APP_HOME)/scripts ..."
	@mkdir -p "$(APP_HOME)/scripts"
	@cp scripts/admin-local/*.sh "$(APP_HOME)/scripts/"
	@chmod a+x "$(APP_HOME)/scripts/"*.sh

	@echo "✅ 后端构建完毕！应用已安装到 $(APP_HOME)"

# ==========================================
# 2. Tailwind 单独构建
# ==========================================
tailwind:
	@echo "=== 开始构建 Tailwind CSS ==="
	cd tailwind && $(NPM) ci && $(NPM) run build

# 兼容旧目标名
css: tailwind
tailwind-css: tailwind

# ==========================================
# 3. 前端 Next.js 构建
# ==========================================
lab-next:
	@echo "=== 开始构建前端 lab-next ==="
	cd web/lab-next && $(NPM) install --no-fund --no-audit
ifdef NEXT_BACKEND_URL
	cd web/lab-next && BACKEND_URL="$(NEXT_BACKEND_URL)" $(NPM) run build
else
	cd web/lab-next && $(NPM) run build
endif

# ==========================================
# 4. 辅助命令 (清理、安装、帮助)
# ==========================================
clean:
	rm -rf "$(APP_HOME)"
	rm -rf web/lab-next/.next
	@echo "已删除 $(APP_HOME) 与 web/lab-next/.next（未删 node_modules，如需: make clean-all）"

clean-all: clean
	rm -rf tailwind/node_modules web/lab-next/node_modules

install: lab-go
	install -d "$(DESTDIR)$(PREFIX)/bin"
	install -m 0755 "$(APP_BIN)/mjlab" "$(DESTDIR)$(PREFIX)/bin/mjlab"

help:
	@echo "make / make deploy     全量构建 (lab-go + tailwind + lab-next)"
	@echo "make lab-go            仅构建后端，输出到 $(APP_HOME) (自动附带编译 CSS)"
	@echo "make tailwind          仅构建 Tailwind"
	@echo "make lab-next          仅构建 Next 前端"
	@echo "NEXT_BACKEND_URL=...   传给 Next 构建时的 BACKEND_URL"
	@echo "SKIP_FRONTEND=1        跳过 Next 前端构建"
	@echo "make install           将 mjlab 软链/安装到系统 $(PREFIX)/bin"
	@echo "make clean             删除 $(APP_HOME) 与 Next 缓存"
	@echo "管理脚本（无 RSA）     make 后见 $(APP_HOME)/scripts/，未设置 ADMIN_BASE 时会询问地址"