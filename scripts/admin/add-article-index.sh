#!/usr/bin/env bash
# POST /add-article-index  表单 id
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

if [[ $# -lt 1 ]]; then
  echo "用法: $0 <article_id>" >&2
  exit 1
fi

body=$(mktemp)
trap 'rm -f "$body"' EXIT
printf 'id=%s' "$1" >"$body"

admin_curl_signed POST /add-article-index "$body" -H "Content-Type: application/x-www-form-urlencoded"
printf '\n'
