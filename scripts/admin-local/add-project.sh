#!/usr/bin/env bash
# POST /project  multipart: project(JSON) + 可选 icon
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

json_file=""
icon=""
if [[ $# -ge 1 ]]; then
  json_file="$1"
  icon="${2:-}"
else
  read -r -p "project JSON 文件路径: " json_file
  read -r -p "可选 icon 文件路径（无则回车）: " icon
fi

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

admin_curl_plain POST /project "$body" -H "Content-Type: multipart/form-data; boundary=${boundary}"
printf '\n'
