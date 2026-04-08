#!/usr/bin/env bash
# POST /del-index  无 body
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

admin_curl_plain POST /del-index "-"
printf '\n'
