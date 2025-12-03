# ChatGPT Plan Sync

自动同步 ChatGPT 官方订阅套餐（Free / Plus / Pro / Team / Business / Enterprise 等）的最新配置，
生成标准化的 `plans-override.json`，供前端「订阅对比生成器」直接读取并覆盖本地数据。

核心目标：

- **不再手动改表格**：额度 / 权限更新后，由脚本统一生成 JSON
- **统一数据源**：前端只认一个 `plans-override.json`
- **可自动化**：支持 GitHub Actions 定时运行，自动提交最新数据

---

## 项目结构

```text
.
├─ package.json              # 使用 ESM 的 Node 项目配置
├─ plans-override.json       # 导出的套餐配置（给前端读取）
└─ tools
   └─ update-plans.mjs       # 从 chatgpt.com/pricing 抓取并生成 JSON 的脚本
