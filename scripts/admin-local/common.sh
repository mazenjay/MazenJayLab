#!/usr/bin/env bash
# 无 RSA：适用于当前 cmd/main.go 中未启用 RSAVerifyMiddleware 时的本机管理端（默认 127.0.0.1:7700）。
# 若生产环境重新启用 RSA，请继续使用 scripts/admin/ 下带签名的脚本。
set -euo pipefail

admin_prompt_base() {
  if [[ -n "${ADMIN_BASE:-}" ]]; then
    return
  fi
  local def="http://127.0.0.1:7700"
  read -r -p "管理端地址 [${def}]: " input
  ADMIN_BASE="${input:-$def}"
  export ADMIN_BASE
}

# multipart（与 scripts/admin/common.sh 一致）
admin_build_multipart_project() {
  local out_file="$1"
  local boundary_file="$2"
  local project_json="$3"
  local icon_path="${4:-}"
  local boundary="mjlab$(openssl rand -hex 16)"
  printf '%s' "$boundary" >"$boundary_file"

  {
    printf -- '--%s\r\n' "$boundary"
    printf 'Content-Disposition: form-data; name="project"\r\n\r\n'
    printf '%s\r\n' "$project_json"
    if [[ -n "$icon_path" && -f "$icon_path" ]]; then
      printf -- '--%s\r\n' "$boundary"
      # shellcheck disable=SC2016
      printf 'Content-Disposition: form-data; name="icon"; filename="%s"\r\n' "$(basename "$icon_path")"
      printf 'Content-Type: application/octet-stream\r\n\r\n'
      cat "$icon_path"
      printf '\r\n'
    fi
    printf -- '--%s--\r\n' "$boundary"
  } >"$out_file"
}

urlencode() {
  python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

# bodyfile 为 - 表示无 body
admin_curl_plain() {
  local method="$1"
  local url_path="$2"
  local body_file="$3"
  shift 3
  admin_prompt_base
  local url="${ADMIN_BASE}${url_path}"
  if [[ "$body_file" == "-" ]]; then
    curl -sS -X "$method" "$url" "$@"
  else
    curl -sS -X "$method" "$url" --data-binary "@$body_file" "$@"
  fi
}
