#!/usr/bin/env bash
# POST /batch-articles  批量导入 WorkDir/article_md 下所有 .md
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

rec="1"
if [[ $# -ge 1 ]]; then
  rec="${1:-1}"
else
  read -r -p "是否递归子目录 [1/0，默认 1]: " rec_in
  rec="${rec_in:-1}"
fi

body=$(mktemp)
trap 'rm -f "$body"' EXIT
printf 'recursive=%s' "$rec" >"$body"

admin_curl_plain POST /batch-articles "$body" -H "Content-Type: application/x-www-form-urlencoded"
printf '\n'
