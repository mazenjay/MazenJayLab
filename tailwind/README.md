# Tailwind → `static/css/app.css`

- **入口**：`src/input.css`（`@tailwind` 指令）
- **配置**：`tailwind.config.js`（主题与 `@tailwindcss/typography`）
- **扫描**：`../template.html`（含文末隐藏节点，用于脚本里动态插入的 class）

构建与发布说明见上级目录 `static/css/README.md`。

```bash
npm install
npm run build    # 输出 ../static/css/app.css
npm run watch    # 本地改模板时监听
```
