# Admin 接口脚本使用说明

本目录下的脚本用于调用 **管理端 HTTP 服务**（默认 `http://127.0.0.1:7700`）。所有路由均经过 `RSAVerifyMiddleware`：请求必须携带 **RSA 签名** 与 **时间戳**、**随机 nonce**，否则返回 `401`。

---

## 依赖与环境

- **Bash**、**curl**、**OpenSSL**（用于 `openssl dgst -sha256 -sign` / `base64`）
- **Python 3**（`create-article.sh` 里对 `path` 做 URL 编码）

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_PRIVATE_KEY` | 是 | RSA **私钥** PEM 文件路径，需与服务器 `WorkDir/.keys/*.pem` 中的**公钥**配对 |
| `ADMIN_BASE` | 否 | 管理端根 URL，默认 `http://127.0.0.1:7700`（不要带末尾 `/`） |

使用前示例：

```bash
export ADMIN_PRIVATE_KEY="$HOME/.mjlab/admin-priv.pem"
export ADMIN_BASE="http://127.0.0.1:7700"   # 可选
```

私钥请勿提交仓库；本地可配合 `.gitignore` 中的 `scripts/admin/*.pem`。

### 服务器侧：信任公钥

应用会从 **`WorkDir/.keys/`** 读取所有 `.pem` **公钥**（SubjectPublicKeyInfo）。若没有可用公钥，中间件会对所有请求直接 `401`。

生成密钥对示例（仅作参考，按你方安全策略保管私钥）：

```bash
openssl genrsa -out admin-priv.pem 2048
openssl rsa -in admin-priv.pem -pubout -out admin-pub.pem
# 将 admin-pub.pem 复制到服务器的 ~/.mjlab/.keys/ 下（文件名以 .pem 结尾）
```

注意：`X-Timestamp` 为 **RFC3339**，服务端校验时钟大致在 **±5 分钟** 内；本机时间偏差过大会导致 `timestamp invalid or too old`。

---

## 签名规则（与 `api/handlers.go` 一致）

脚本通过 `common.sh` 中的 `admin_curl_signed` 自动完成下列步骤。

1. **`body_hash`**  
   - 若请求 **无 body**（`Content-Length == 0`）：`body_hash` 为 **空字符串** `""`。  
   - 若有 body：对 **即将发送的原始 body 字节** 计算 `SHA256`，再 **标准 Base64** 编码得到 `body_hash`。

2. **`sign_string`**（每行之间为换行符 `\n`，共五行）  
   `METHOD` + `\n` + `URL.Path` + `\n` + `X-Timestamp` + `\n` + `X-Nonce` + `\n` + `body_hash`  
   - **`URL.Path`** 必须与 Gin 收到的路径完全一致，例如 `/article`、`/article/3/publish`，**不含** `ADMIN_BASE`、query、fragment。

3. **`X-Signature`**  
   对 **`sign_string` 整段 UTF-8 字节** 做 `SHA256`，再对该摘要做 **RSA PKCS#1 v1.5** 签名，最后 **Base64** 编码（与 `openssl dgst -sha256 -sign` 一致）。

4. 请求头  
   - `X-Signature`  
   - `X-Timestamp`（UTC，例如 `2026-04-05T12:00:00Z`）  
   - `X-Nonce`（任意不重复的字符串，脚本用随机 hex）

**重要：** 带 body 的请求（尤其 `multipart/form-data`）必须先 **按字节构造好 body 文件**，签名用的哈希必须与 **curl 实际发出的 body** 完全一致；`add-project.sh` 已按此实现。

---

## 脚本一览

在仓库根目录执行时建议：

```bash
chmod +x scripts/admin/*.sh   # 若尚未可执行
```

| 脚本 | 对应接口 | 作用简述 |
|------|-----------|----------|
| `create-article.sh` | `POST /article` | 登记一篇新文章，并指向 WorkDir 下已有 `.md` 路径 |
| `add-project.sh` | `POST /project` | 新增一条作品（Works），可选上传图标文件 |
| `rebuild-index.sh` | `POST /rebuild-index` | 触发搜索索引重建（异步） |
| `manage-article-status.sh` | `POST /article/:id/:status` | 发布或下架文章 |
| `del-index.sh` | `POST /del-index` | 删除搜索索引中的文档 |
| `add-article-index.sh` | `POST /add-article-index` | 将指定文章加入搜索索引 |

下面为各脚本的用法与说明。

---

### `create-article.sh`

**接口：** `POST /article`  
**Body：** `application/x-www-form-urlencoded`，字段 **`path`**（字符串为 Markdown 文件在 **服务器 WorkDir** 下的相对路径）。

**用法：**

```bash
./scripts/admin/create-article.sh <markdown_相对路径>
```

**示例：**

```bash
# 先将 .md 放到 ~/.mjlab/drafts/hello.md（默认 WorkDir 多为 ~/.mjlab）
./scripts/admin/create-article.sh drafts/hello.md
```

`path` 中的特殊字符会经脚本做 URL 编码。更完整的 Markdown 示例见 **`scripts/admin/examples/sample-post.md`**。

---

### `add-project.sh`

**接口：** `POST /project`  
**Body：** `multipart/form-data`  
- 字段 **`project`**：JSON 字符串，结构对应 `ProjectCreateParam`（**`title`、`slug` 必填**）。  
- 可选字段 **`icon`**：图片文件（上传后会存为 `upload/{slug}.jpeg` 并设置图标 URL）。

**用法：**

```bash
./scripts/admin/add-project.sh <project.json> [图标文件]
```

**JSON 字段说明（常用）：**

- `title`、`slug`（必填）、`subtitle`、`summary`  
- `icon`：无上传文件时可用 Remix Icon 类名或外链，如 `ri-planet-line`  
- `theme_color`、`status`、`repo_url`、`launch_url`、`sort_order`  
- `techs`：`[{ "name": "Go", "icon": "ri-code-box-line" }, ...]`

**示例：**

```bash
./scripts/admin/add-project.sh ./my-project.json
./scripts/admin/add-project.sh ./my-project.json ./cover.jpeg
```

---

### `rebuild-index.sh`

**接口：** `POST /rebuild-index`  
**Body：** 无。

**用法：**

```bash
./scripts/admin/rebuild-index.sh
```

服务端在 goroutine 中执行重建，HTTP 会较快返回提示信息。

---

### `manage-article-status.sh`

**接口：** `POST /article/:id/:status`  
**Body：** 无。  
**`status`：** 仅能是 **`publish`** 或 **`unpublish`**（与 `ArticleService.ManageArticleStatus` 一致）。

**用法：**

```bash
./scripts/admin/manage-article-status.sh <文章数字ID> publish|unpublish
```

**示例：**

```bash
./scripts/admin/manage-article-status.sh 12 publish
```

---

### `del-index.sh`

**接口：** `POST /del-index`  
**Body：** 无。删除搜索索引数据（具体操作以 `SearchService.DelIndex` 为准）。

**用法：**

```bash
./scripts/admin/del-index.sh
```

---

### `add-article-index.sh`

**接口：** `POST /add-article-index`  
**Body：** `application/x-www-form-urlencoded`，字段 **`id`**（文章 ID）。

**用法：**

```bash
./scripts/admin/add-article-index.sh <文章数字ID>
```

**示例：**

```bash
./scripts/admin/add-article-index.sh 12
```

---

## 自定义其它管理请求

在同目录下可参考 `common.sh`：

- `admin_body_hash` / `admin_sign_string` / `admin_curl_signed`  
- 自行准备 **与发送内容完全一致** 的 body 文件，再调用：  
  `admin_curl_signed POST /your/path bodyfile ...`  
  无 body 时第三个参数传 **`-`**。

---

## 常见问题

1. **`401`、无 JSON 提示**  
   多为 **`WorkDir/.keys` 下没有公钥**；或私钥与公钥不匹配。

2. **`401`、`timestamp invalid or too old`**  
   校正本机时间；确保 `X-Timestamp` 为 RFC3339 且与服务器相差在允许范围内。

3. **`401`、`invalid signature`**  
   路径是否拼错（必须与 **`Request.URL.Path`** 一致）；有 body 时是否用 **同一字节序列** 计算哈希。

4. **`create-article` 成功但渲染失败**  
   检查 `path` 对应文件是否在 **WorkDir** 下真实存在；Markdown 与模板路径是否配置正确。
