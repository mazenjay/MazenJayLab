#!/usr/bin/env bash
# POST /add-article-index  表单 id
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

aid=""
if [[ $# -ge 1 ]]; then
  aid="$1"
else
  read -r -p "article id: " aid
fi

body=$(mktemp)
trap 'rm -f "$body"' EXIT
printf 'id=%s' "$aid" >"$body"

admin_curl_plain POST /add-article-index "$body" -H "Content-Type: application/x-www-form-urlencoded"
printf '\n'
