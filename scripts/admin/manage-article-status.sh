#!/usr/bin/env bash
# POST /article/:id/:status  status 为 publish 或 unpublish
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

if [[ $# -ne 2 ]]; then
  echo "用法: $0 <article_id> <publish|unpublish>" >&2
  exit 1
fi

id="$1"
status="$2"
if [[ "$status" != "publish" && "$status" != "unpublish" ]]; then
  echo "status 必须是 publish 或 unpublish" >&2
  exit 1
fi

path="/article/${id}/${status}"
admin_curl_signed POST "$path" "-"
printf '\n'
