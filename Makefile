SHELL := /bin/bash

BUILD_DIR   ?= build
GO          ?= go
NPM         ?= npm
PREFIX      ?= /usr/local
DESTDIR     ?=

.PHONY: all deploy mjlab lab-next tailwind clean clean-all install help

all: deploy

deploy: mjlab tailwind lab-next

$(BUILD_DIR):
	mkdir -p "$(BUILD_DIR)"

# ======================
# Go backend
# ======================
mjlab: $(BUILD_DIR)
	$(GO) mod download
	$(GO) build -trimpath -ldflags "-s -w" -o "$(BUILD_DIR)/mjlab" ./cmd/main.go

# ======================
# Tailwind（独立项目）
# ======================
tailwind:
	cd tailwind && \
	rm -rf node_modules package-lock.json && \
	$(NPM) install && \
	$(NPM) run build

# ======================
# Next.js frontend（关键修复）
# ======================
lab-next:
	cd web/lab-next && \
	rm -rf node_modules package-lock.json && \
	$(NPM) install

ifdef NEXT_BACKEND_URL
	cd web/lab-next && BACKEND_URL="$(NEXT_BACKEND_URL)" $(NPM) run build
else
	cd web/lab-next && $(NPM) run build
endif

# ======================
# 清理
# ======================
clean:
	rm -rf "$(BUILD_DIR)"
	rm -rf web/lab-next/.next
	rm -rf tailwind/node_modules web/lab-next/node_modules
	rm -f web/lab-next/package-lock.json tailwind/package-lock.json
	@echo "clean 完成"

clean-all: clean

# ======================
# 安装
# ======================
install: mjlab
	install -d "$(DESTDIR)$(PREFIX)/bin"
	install -m 0755 "$(BUILD_DIR)/mjlab" "$(DESTDIR)$(PREFIX)/bin/mjlab"

# ======================
# 帮助
# ======================
help:
	@echo "make / make deploy     构建全部"
	@echo "make mjlab             构建 Go 后端"
	@echo "make tailwind          构建 Tailwind"
	@echo "make lab-next          构建 Next.js（已修复 oxide 问题）"
	@echo "make clean             清理全部构建"
	@echo "NEXT_BACKEND_URL=...   传给 Next 构建"