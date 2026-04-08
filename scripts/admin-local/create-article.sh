#!/usr/bin/env bash
# POST /article  表单 path = 仓库内 markdown 路径
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

path_arg=""
if [[ $# -ge 1 ]]; then
  path_arg="$1"
else
  read -r -p "Markdown OSS 路径（例 notes/hello.md）: " path_arg
fi

path_enc="$(urlencode "$path_arg")"
body=$(mktemp)
trap 'rm -f "$body"' EXIT
printf 'path=%s' "$path_enc" >"$body"

admin_curl_plain POST /article "$body" -H "Content-Type: application/x-www-form-urlencoded"
printf '\n'
