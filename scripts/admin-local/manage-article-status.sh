#!/usr/bin/env bash
# POST /article/:id/:status  publish | unpublish
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

id=""
status=""
if [[ $# -eq 2 ]]; then
  id="$1"
  status="$2"
else
  read -r -p "article id: " id
  read -r -p "status (publish 或 unpublish): " status
fi

if [[ "$status" != "publish" && "$status" != "unpublish" ]]; then
  echo "status 必须是 publish 或 unpublish" >&2
  exit 1
fi

path="/article/${id}/${status}"
admin_curl_plain POST "$path" "-"
printf '\n'
