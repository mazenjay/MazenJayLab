#!/usr/bin/env bash
# 与 api/handlers.go RSAVerifyMiddleware 一致的签名：
# body_hash =（有 body 且 Content-Length > 0）base64(sha256(raw_body))，否则 ""
# sign_string = METHOD + "\n" + URL.Path + "\n" + X-Timestamp + "\n" + X-Nonce + "\n" + body_hash
# X-Signature = base64( RSA-SHA256-PKCS1v15(sign_string) )  /* openssl dgst -sha256 -sign */

set -euo pipefail

admin_require_key() {
  if [[ -z "${ADMIN_PRIVATE_KEY:-}" ]]; then
    echo "请设置 ADMIN_PRIVATE_KEY 为与服务器 \$WorkDir/.keys 中公钥配对的私钥 PEM 路径" >&2
    exit 1
  fi
  if [[ ! -f "$ADMIN_PRIVATE_KEY" ]]; then
    echo "私钥文件不存在: $ADMIN_PRIVATE_KEY" >&2
    exit 1
  fi
}

# 计算与中间件一致的 body_hash（空文件视为无 body → 空字符串）
admin_body_hash() {
  local body_file="$1"
  if [[ -z "$body_file" || ! -s "$body_file" ]]; then
    printf ''
    return
  fi
  openssl dgst -sha256 -binary "$body_file" | openssl base64 -A
}

# 对 sign_string 做 RSA-SHA256 PKCS#1 v1.5 签名并输出单行 base64（无有效 body_hash 时传空文件或省略第四参）
admin_sign_string() {
  local method="$1"
  local url_path="$2" # 必须与请求 line 里 path 完全一致，例如 /article
  local ts="$3"
  local nonce="$4"
  local body_hash="${5:-}"

  admin_require_key
  local sign_string
  sign_string=$(printf '%s\n%s\n%s\n%s\n%s' "$method" "$url_path" "$ts" "$nonce" "$body_hash")
  printf '%s' "$sign_string" | openssl dgst -sha256 -sign "$ADMIN_PRIVATE_KEY" | openssl base64 -A
}

# 生成 RFC3339 UTC 时间戳（秒精度，Z 结尾）
admin_timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

admin_nonce() {
  openssl rand -hex 16
}

urlencode() {
  python3 -c 'import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

# 已签名的 HTTP 请求（与中间件一致：对「即将发送的原始 body 字节」做 sha256→base64）
# 用法: admin_curl_signed METHOD /url/path bodyfile|- [curl 额外参数...]
# bodyfile 为 - 表示无 body（Content-Length 为 0，body_hash 为空串）
admin_curl_signed() {
  local method="$1"
  local url_path="$2"
  local body_file="$3"
  shift 3

  admin_require_key
  local base="${ADMIN_BASE:-http://127.0.0.1:7700}"
  local ts nonce body_hash sig

  ts=$(admin_timestamp)
  nonce=$(admin_nonce)
  if [[ "$body_file" == "-" ]]; then
    body_hash=""
  else
    body_hash=$(admin_body_hash "$body_file")
  fi
  sig=$(admin_sign_string "$method" "$url_path" "$ts" "$nonce" "$body_hash")

  local url="${base}${url_path}"
  if [[ "$body_file" == "-" ]]; then
    curl -sS -X "$method" "$url" \
      -H "X-Signature: $sig" \
      -H "X-Timestamp: $ts" \
      -H "X-Nonce: $nonce" \
      "$@"
  else
    curl -sS -X "$method" "$url" \
      -H "X-Signature: $sig" \
      -H "X-Timestamp: $ts" \
      -H "X-Nonce: $nonce" \
      --data-binary "@$body_file" \
      "$@"
  fi
}

# 生成 multipart/form-data（project + 可选 icon），boundary 写入第二参数所给文件（一行、无换行）
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
