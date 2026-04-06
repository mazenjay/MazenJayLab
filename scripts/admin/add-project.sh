#!/usr/bin/env bash
# POST /project  multipart: project(JSON 字符串) + 可选 icon 文件
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

if [[ $# -lt 1 ]]; then
  echo "用法: $0 <project.json> [icon.png]  # JSON 内容需满足 ProjectCreateParam（title/slug 必填）" >&2
  exit 1
fi

json_file="$1"
icon="${2:-}"
if [[ ! -f "$json_file" ]]; then
  echo "找不到 JSON 文件: $json_file" >&2
  exit 1
fi
project_json=$(cat "$json_file")

body=$(mktemp)
bnd=$(mktemp)
trap 'rm -f "$body" "$bnd"' EXIT

if [[ -n "$icon" ]]; then
  admin_build_multipart_project "$body" "$bnd" "$project_json" "$icon"
else
  admin_build_multipart_project "$body" "$bnd" "$project_json" ""
fi
boundary=$(cat "$bnd")

admin_curl_signed POST /project "$body" -H "Content-Type: multipart/form-data; boundary=${boundary}"
printf '\n'
