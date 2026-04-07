# MazenJayLab — 本地构建（Go + Tailwind + Next）
#
# 产物目录（默认 BUILD_DIR=build）:
#   $(BUILD_DIR)/mjlab     — Go 二进制
#   web/lab-next/.next/    — Next 默认构建目录（与 Go 产物分开）
#
# 用法:
#   make                  # 等价于 make deploy
#   make deploy
#   make mjlab            # 仅 Go
#   make lab-next         # 仅 Next
#   make tailwind         # 仅 Tailwind → static/css/app.css
#
# Next 构建时带上 BACKEND_URL:
#   make deploy NEXT_BACKEND_URL=https://mazenjay.com
#
# 跳过部分（变量非空即跳过）:
#   make deploy SKIP_FRONTEND=1 SKIP_TAILWIND=1
#
# 安装二进制（需先 make mjlab）:
#   sudo make install PREFIX=/usr/local
#
# 启动（需先 make deploy 或分别构建）:
#   终端1 — 后端 API: ./build/mjlab   （端口见 cmd/config.toml，默认 8080）
#   终端2 — 前端:     cd web/lab-next && npm start   （默认 3000）
#   若要让 Next 把 /api 反代到后端，构建时设置 NEXT_BACKEND_URL=http://127.0.0.1:8080

SHELL := /bin/bash

BUILD_DIR   ?= build
GO          ?= go
NPM         ?= npm
PREFIX      ?= /usr/local
DESTDIR     ?=

.PHONY: all deploy mjlab lab-next tailwind tailwind-css css clean install help

all: deploy

deploy: mjlab
ifneq ($(SKIP_TAILWIND),1)
deploy: tailwind
endif
ifneq ($(SKIP_FRONTEND),1)
deploy: lab-next
endif

$(BUILD_DIR):
	mkdir -p "$(BUILD_DIR)"

mjlab: $(BUILD_DIR)
	$(GO) mod download
	$(GO) build -trimpath -ldflags "-s -w" -o "$(BUILD_DIR)/mjlab" ./cmd/main.go

tailwind:
	cd tailwind && $(NPM) ci && $(NPM) run build

# 与旧目标名兼容（README / 习惯）
css: tailwind
tailwind-css: tailwind

lab-next:
	cd web/lab-next && $(NPM) install --no-fund --no-audit
ifdef NEXT_BACKEND_URL
	cd web/lab-next && BACKEND_URL="$(NEXT_BACKEND_URL)" $(NPM) run build
else
	cd web/lab-next && $(NPM) run build
endif

clean:
	rm -rf "$(BUILD_DIR)"
	rm -rf web/lab-next/.next
	@echo "已删除 $(BUILD_DIR) 与 web/lab-next/.next（未删 node_modules，如需: make clean-all）"

clean-all: clean
	rm -rf tailwind/node_modules web/lab-next/node_modules

install: mjlab
	install -d "$(DESTDIR)$(PREFIX)/bin"
	install -m 0755 "$(BUILD_DIR)/mjlab" "$(DESTDIR)$(PREFIX)/bin/mjlab"

help:
	@echo "make / make deploy     构建 mjlab + tailwind + lab-next"
	@echo "make mjlab             仅构建 $(BUILD_DIR)/mjlab"
	@echo "make tailwind          仅构建 Tailwind → static/css/app.css"
	@echo "make lab-next          仅 Next → web/lab-next/.next"
	@echo "NEXT_BACKEND_URL=...   传给 Next 构建时的 BACKEND_URL"
	@echo "SKIP_FRONTEND=1        跳过 Next"
	@echo "SKIP_TAILWIND=1        跳过 Tailwind"
	@echo "make install           安装 mjlab 到 PREFIX (默认 $(PREFIX))"
	@echo "make clean             删除 $(BUILD_DIR) 与 web/lab-next/.next"
	@echo "运行: ./$(BUILD_DIR)/mjlab  与  cd web/lab-next && $(NPM) start"
