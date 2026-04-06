#!/usr/bin/env bash
# POST /article  表单字段 path = 仓库内 markdown 路径（与 CreateArticle 一致）
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

if [[ $# -lt 1 ]]; then
  echo "用法: $0 <markdown_oss_path>  例: $0 notes/hello.md" >&2
  exit 1
fi

path_enc="$(urlencode "$1")"
body=$(mktemp)
trap 'rm -f "$body"' EXIT
printf 'path=%s' "$path_enc" >"$body"

admin_curl_signed POST /article "$body" -H "Content-Type: application/x-www-form-urlencoded"
printf '\n'
